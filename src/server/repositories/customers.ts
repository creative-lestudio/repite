import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";
import { toBusinessError } from "../errors";

// Todas las funciones reciben organizationId de una sesión o local ya validados y filtran por él.

export interface CustomerRow {
  id: string;
  organization_id: string;
  name: string;
  phone_e164: string;
  birthday: string | null;
  locale: string;
  marketing_consent: boolean;
  qr_token: string;
  usual_order: string | null;
  last_visit_at: string | null;
}

const COLUMNS =
  "id, organization_id, name, phone_e164, birthday, locale, marketing_consent, qr_token, usual_order, last_visit_at";

export async function findCustomerByPhone(organizationId: string, phone: string) {
  const { data, error } = await createServiceClient()
    .from("customers")
    .select(COLUMNS)
    .eq("organization_id", organizationId)
    .eq("phone_e164", phone)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as CustomerRow | null;
}

export async function getCustomer(organizationId: string, customerId: string) {
  const { data, error } = await createServiceClient()
    .from("customers")
    .select(COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as CustomerRow | null;
}

export async function createCustomer(input: {
  organizationId: string;
  locationId: string;
  name: string;
  phone: string;
  birthday: string | null;
  locale: Locale;
  consent: boolean;
}) {
  const { data, error } = await createServiceClient()
    .from("customers")
    .insert({
      organization_id: input.organizationId,
      first_location_id: input.locationId,
      name: input.name,
      phone_e164: input.phone,
      birthday: input.birthday,
      locale: input.locale,
      marketing_consent: input.consent,
      consent_at: input.consent ? new Date().toISOString() : null,
      consent_source: input.consent ? "qr_signup" : null,
    })
    .select(COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") return { duplicate: true as const };
    throw error;
  }
  await audit(input.organizationId, data.id, "customer.signup", { consent: input.consent });
  return { duplicate: false as const, customer: data as CustomerRow };
}

export async function updateCustomerPreferences(
  organizationId: string,
  customerId: string,
  prefs: { locale?: Locale; marketingConsent?: boolean },
) {
  const patch: { locale?: string; marketing_consent?: boolean; consent_at?: string; consent_source?: string } = {};
  if (prefs.locale) patch.locale = prefs.locale;
  if (prefs.marketingConsent !== undefined) {
    patch.marketing_consent = prefs.marketingConsent;
    patch.consent_at = new Date().toISOString();
    patch.consent_source = prefs.marketingConsent ? "customer_preferences" : "customer_opt_out";
  }
  const { error } = await createServiceClient()
    .from("customers")
    .update(patch)
    .eq("organization_id", organizationId)
    .eq("id", customerId);
  if (error) throw error;
  if (prefs.marketingConsent !== undefined) {
    await audit(organizationId, customerId, prefs.marketingConsent ? "consent.grant" : "consent.revoke");
  }
}

export interface CardState {
  program: {
    id: string;
    stamps_required: number;
    reward_name: string;
    reward_description: string | null;
    reward_expiry_days: number | null;
    bonus_story_enabled: boolean;
    bonus_review_enabled: boolean;
  } | null;
  balance: number;
  rewards: { id: string; reward_name: string; expires_at: string | null; created_at: string }[];
  pending_bonuses: { id: string; type: "bonus_story" | "bonus_review"; created_at: string }[];
  review_bonus_given: boolean;
  last_visit_at: string | null;
}

export async function getCardState(customerId: string, locationId: string): Promise<CardState> {
  const { data, error } = await createServiceClient().rpc("customer_card", {
    p_customer: customerId,
    p_location: locationId,
  });
  if (error) throw toBusinessError(error) ?? error;
  const state = data as unknown as Partial<CardState>;
  return {
    program: state.program ?? null,
    balance: state.balance ?? 0,
    rewards: state.rewards ?? [],
    pending_bonuses: state.pending_bonuses ?? [],
    review_bonus_given: state.review_bonus_given ?? false,
    last_visit_at: state.last_visit_at ?? null,
  };
}

export interface HistoryItem {
  id: string;
  type: "visit" | "bonus_story" | "bonus_review" | "reward_issued" | "redeem" | "adjust";
  quantity: number;
  validation_status: "pending" | "approved" | "rejected";
  created_at: string;
  reverses_event_id: string | null;
}

export async function getCustomerHistory(organizationId: string, customerId: string, limit = 50) {
  const { data, error } = await createServiceClient()
    .from("stamp_events")
    .select("id, type, quantity, validation_status, created_at, reverses_event_id")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as HistoryItem[];
}

async function audit(organizationId: string, customerId: string, action: string, data?: Record<string, unknown>) {
  await createServiceClient()
    .from("audit_log")
    .insert({
      organization_id: organizationId,
      actor_type: "customer",
      actor_id: customerId,
      action,
      entity: "customer",
      entity_id: customerId,
      data: (data ?? null) as never,
    });
}
