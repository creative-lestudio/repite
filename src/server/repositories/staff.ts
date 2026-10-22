import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

// Consultas del panel del equipo. organizationId/locationId salen SIEMPRE de la tablet vinculada.

export interface CustomerHit {
  id: string;
  name: string;
  phone_e164: string;
  last_visit_at: string | null;
}

/** Busca por nombre o por dígitos del teléfono. Limpia la consulta para la sintaxis de PostgREST. */
export async function searchCustomers(organizationId: string, query: string, limit = 20): Promise<CustomerHit[]> {
  const clean = query
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .trim()
    .slice(0, 60);
  const digits = query.replace(/\D/g, "");
  let q = createServiceClient()
    .from("customers")
    .select("id, name, phone_e164, last_visit_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("last_visit_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (digits.length >= 3) q = q.like("phone_e164", `%${digits}%`);
  else if (clean.length >= 2) q = q.ilike("name", `%${clean}%`);
  else return [];
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function findCustomerByQrToken(organizationId: string, token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const { data, error } = await createServiceClient()
    .from("customers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("qr_token", token)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export interface Note {
  id: string;
  text: string;
  pinned: boolean;
  created_at: string;
  author: string | null;
}

export async function getCustomerNotes(organizationId: string, customerId: string): Promise<Note[]> {
  const { data, error } = await createServiceClient()
    .from("customer_notes")
    .select("id, text, pinned, created_at, staff_members(display_name)")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    text: n.text,
    pinned: n.pinned,
    created_at: n.created_at,
    author: n.staff_members?.display_name ?? null,
  }));
}

export async function addCustomerNote(
  organizationId: string,
  customerId: string,
  staffId: string,
  text: string,
  pinned: boolean,
) {
  const { error } = await createServiceClient().from("customer_notes").insert({
    organization_id: organizationId,
    customer_id: customerId,
    author_staff_id: staffId,
    text,
    pinned,
  });
  if (error) throw error;
}

export async function setUsualOrder(organizationId: string, customerId: string, usualOrder: string | null) {
  const { error } = await createServiceClient()
    .from("customers")
    .update({ usual_order: usualOrder })
    .eq("organization_id", organizationId)
    .eq("id", customerId);
  if (error) throw error;
}

export interface DayVisit {
  event_id: string;
  customer_id: string;
  customer_name: string;
  staff_name: string | null;
  created_at: string;
  undone: boolean;
}

export async function getDayVisits(locationId: string, since: Date): Promise<DayVisit[]> {
  const { data, error } = await createServiceClient().rpc("staff_day_visits", {
    p_location: locationId,
    p_since: since.toISOString(),
  });
  if (error) throw error;
  return (data ?? []) as unknown as DayVisit[];
}

export interface PendingBonus {
  event_id: string;
  customer_id: string;
  customer_name: string;
  type: "bonus_story" | "bonus_review";
  evidence: { handle?: string; note?: string } | null;
  created_at: string;
}

export async function getPendingBonuses(locationId: string): Promise<PendingBonus[]> {
  const { data, error } = await createServiceClient().rpc("staff_pending_bonuses", { p_location: locationId });
  if (error) throw error;
  return (data ?? []) as unknown as PendingBonus[];
}

/** Comprueba que un evento pertenece al local de la tablet antes de deshacerlo o validarlo. */
export async function eventBelongsToLocation(eventId: string, locationId: string) {
  const { data, error } = await createServiceClient()
    .from("stamp_events")
    .select("id")
    .eq("id", eventId)
    .eq("location_id", locationId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function rewardBelongsToOrganization(rewardId: string, organizationId: string) {
  const { data, error } = await createServiceClient()
    .from("rewards")
    .select("id")
    .eq("id", rewardId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
