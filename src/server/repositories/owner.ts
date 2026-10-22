import "server-only";
import type { EffectivePlan } from "@/domain/plan";
import { createUserClient } from "@/lib/supabase/server";
import type { OwnerContext } from "../auth/owner";
import { startOfDayInZone } from "@/domain/time";
import { parseMetrics, type Metrics } from "@/domain/metrics";

// Consultas del panel del dueño. Usan el JWT del usuario: RLS es la que aísla por organización.

export async function getDashboardStats(ctx: OwnerContext) {
  const supabase = await createUserClient();
  const since = startOfDayInZone(new Date(), ctx.location.timezone).toISOString();

  const [customers, rewards, pending, todayVisits, staff, program] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("rewards").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("stamp_events").select("id", { count: "exact", head: true }).eq("validation_status", "pending"),
    supabase
      .from("stamp_events")
      .select("id")
      .eq("type", "visit")
      .eq("location_id", ctx.location.id)
      .gte("created_at", since),
    supabase.from("staff_members").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("loyalty_programs")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .is("deleted_at", null),
  ]);

  const ids = (todayVisits.data ?? []).map((v) => v.id);
  let undone = 0;
  if (ids.length > 0) {
    const { count } = await supabase
      .from("stamp_events")
      .select("id", { count: "exact", head: true })
      .in("reverses_event_id", ids);
    undone = count ?? 0;
  }

  return {
    customers: customers.count ?? 0,
    rewardsReady: rewards.count ?? 0,
    pendingBonuses: pending.count ?? 0,
    visitsToday: Math.max(0, ids.length - undone),
    staff: staff.count ?? 0,
    hasProgram: (program.count ?? 0) > 0,
  };
}

export async function getProgram() {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("loyalty_programs")
    .select(
      "id, stamps_required, reward_name, reward_description, reward_expiry_days, bonus_story_enabled, bonus_review_enabled, levels",
    )
    .eq("active", true)
    .is("deleted_at", null)
    .order("location_id", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ───────────── Clientes ─────────────

export const CUSTOMERS_PAGE_SIZE = 25;
export type CustomerFilter = "todos" | "premio" | "ausentes" | "sin-permiso";

export interface CustomerListRow {
  id: string;
  name: string;
  phone_e164: string;
  marketing_consent: boolean;
  last_visit_at: string | null;
  created_at: string;
  visits: number;
  balance: number;
  rewards_available: number;
}

async function rewardCustomerIds() {
  const supabase = await createUserClient();
  const { data, error } = await supabase.from("rewards").select("customer_id").eq("status", "available");
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.customer_id))];
}

export async function listCustomers(opts: { q?: string; filter: CustomerFilter; page: number }) {
  const supabase = await createUserClient();
  let query = supabase
    .from("customers")
    .select("id, name, phone_e164, marketing_consent, last_visit_at, created_at", { count: "exact" })
    .is("deleted_at", null)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const text = (opts.q ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .trim()
    .slice(0, 60);
  const digits = (opts.q ?? "").replace(/\D/g, "");
  if (digits.length >= 3) query = query.like("phone_e164", `%${digits}%`);
  else if (text.length >= 2) query = query.ilike("name", `%${text}%`);

  if (opts.filter === "premio") {
    const ids = await rewardCustomerIds();
    if (ids.length === 0) return { rows: [] as CustomerListRow[], total: 0 };
    query = query.in("id", ids);
  } else if (opts.filter === "ausentes") {
    const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();
    query = query.or(`last_visit_at.lt.${cutoff},last_visit_at.is.null`);
  } else if (opts.filter === "sin-permiso") {
    query = query.eq("marketing_consent", false);
  }

  const from = (opts.page - 1) * CUSTOMERS_PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + CUSTOMERS_PAGE_SIZE - 1);
  if (error) throw error;
  const base = data ?? [];
  const stats = base.length
    ? ((
        await supabase
          .from("customer_stats")
          .select("customer_id, visits, balance, rewards_available")
          .in(
            "customer_id",
            base.map((c) => c.id),
          )
      ).data ?? [])
    : [];
  const byId = new Map(stats.map((s) => [s.customer_id, s]));
  const rows: CustomerListRow[] = base.map((c) => ({
    ...c,
    visits: byId.get(c.id)?.visits ?? 0,
    balance: byId.get(c.id)?.balance ?? 0,
    rewards_available: byId.get(c.id)?.rewards_available ?? 0,
  }));
  return { rows, total: count ?? 0 };
}

export async function getCustomerDetail(customerId: string, locationId: string) {
  const supabase = await createUserClient();
  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      "id, name, phone_e164, birthday, locale, marketing_consent, consent_at, usual_order, created_at, last_visit_at",
    )
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!customer) return null;

  const [card, history, notes] = await Promise.all([
    supabase.rpc("owner_customer_card", { p_customer: customerId, p_location: locationId }),
    supabase
      .from("stamp_events")
      .select("id, type, quantity, validation_status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("customer_notes")
      .select("id, text, pinned, created_at, staff_members(display_name)")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  const c = (card.data ?? {}) as {
    program?: { stamps_required: number; reward_name: string } | null;
    balance?: number;
    rewards?: unknown[];
  };
  return {
    customer,
    program: c.program ?? null,
    balance: c.balance ?? 0,
    rewardsAvailable: c.rewards?.length ?? 0,
    history: history.data ?? [],
    notes: (notes.data ?? []).map((n) => ({
      id: n.id,
      text: n.text,
      pinned: n.pinned,
      created_at: n.created_at,
      author: n.staff_members?.display_name ?? null,
    })),
  };
}

export async function addOwnerNote(organizationId: string, userId: string, customerId: string, text: string) {
  const supabase = await createUserClient();
  const { error } = await supabase
    .from("customer_notes")
    .insert({ organization_id: organizationId, customer_id: customerId, author_user_id: userId, text });
  if (error) throw error;
}

export async function exportCustomers() {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, name, phone_e164, birthday, locale, marketing_consent, consent_at, usual_order, created_at, last_visit_at",
    )
    .is("deleted_at", null)
    .order("created_at")
    .limit(5000);
  if (error) throw error;
  const rows = data ?? [];
  const stats = rows.length
    ? ((await supabase.from("customer_stats").select("customer_id, visits, balance, rewards_redeemed").limit(5000))
        .data ?? [])
    : [];
  const byId = new Map(stats.map((s) => [s.customer_id, s]));
  return rows.map((c) => ({
    ...c,
    visits: byId.get(c.id)?.visits ?? 0,
    balance: byId.get(c.id)?.balance ?? 0,
    redeemed: byId.get(c.id)?.rewards_redeemed ?? 0,
  }));
}

// ───────────── Sellos extra ─────────────

export async function listBonuses() {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("stamp_events")
    .select("id, type, validation_status, evidence, created_at, validated_at, customers(id, name)")
    .in("type", ["bonus_story", "bonus_review"])
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id,
    type: e.type as "bonus_story" | "bonus_review",
    status: e.validation_status as "pending" | "approved" | "rejected",
    handle: (e.evidence as { handle?: string } | null)?.handle ?? null,
    created_at: e.created_at,
    customerId: e.customers?.id ?? null,
    customerName: e.customers?.name ?? "—",
  }));
}

// ───────────── Plan ─────────────

export interface PlanUsage {
  plan: EffectivePlan;
  customerLimit: number | null;
  customers: number;
  staff: number;
  devices: number;
}

export async function getPlanUsage(organizationId: string): Promise<PlanUsage> {
  const supabase = await createUserClient();
  const { data, error } = await supabase.rpc("plan_usage", { p_org: organizationId });
  if (error) throw error;
  const d = data as { plan: PlanUsage["plan"]; customer_limit: number | null; customers: number };
  const [staff, devices] = await Promise.all([
    supabase
      .from("staff_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("active", true)
      .is("deleted_at", null),
    supabase
      .from("staff_devices")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .is("revoked_at", null),
  ]);
  return {
    plan: d.plan,
    customerLimit: d.customer_limit,
    customers: d.customers,
    staff: staff.count ?? 0,
    devices: devices.count ?? 0,
  };
}

// ───────────── Resultados ─────────────

export async function getMetrics(ctx: OwnerContext, days: number): Promise<Metrics> {
  const supabase = await createUserClient();
  const { data, error } = await supabase.rpc("owner_metrics", {
    p_org: ctx.organization.id,
    p_location: ctx.location.id,
    p_days: days,
    p_tz: ctx.location.timezone,
  });
  if (error) throw error;
  return parseMetrics(data as Record<string, unknown>);
}

// ───────────── Cupones ─────────────

export interface CouponRow {
  id: string;
  title: string;
  description: string | null;
  audience: "all" | "welcome" | "birthday";
  ends_at: string | null;
  active: boolean;
  issued: number;
  redeemed: number;
}

export async function listCoupons(): Promise<CouponRow[]> {
  const supabase = await createUserClient();
  const [coupons, issued] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, title, description, audience, ends_at, active")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("customer_coupons").select("coupon_id, status").limit(20000),
  ]);
  if (coupons.error) throw coupons.error;
  const stats = new Map<string, { issued: number; redeemed: number }>();
  for (const r of issued.data ?? []) {
    const s = stats.get(r.coupon_id) ?? { issued: 0, redeemed: 0 };
    s.issued += 1;
    if (r.status === "redeemed") s.redeemed += 1;
    stats.set(r.coupon_id, s);
  }
  return (coupons.data ?? []).map((c) => ({
    ...c,
    audience: c.audience as CouponRow["audience"],
    issued: stats.get(c.id)?.issued ?? 0,
    redeemed: stats.get(c.id)?.redeemed ?? 0,
  }));
}
