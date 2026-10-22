import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { toBusinessError } from "../errors";

// Envoltorios de las funciones transaccionales del libro de sellos (ver supabase/migrations/*_ledger_functions.sql).

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (createServiceClient().rpc as any)(fn, args);
  if (error) throw toBusinessError(error) ?? error;
  return data as T;
}

export interface CardSnapshot {
  balance: number;
  stamps_required: number;
  rewards_available: number;
}

export const ledger = {
  registerVisit: (locationId: string, customerId: string, staffId: string, idempotencyKey: string) =>
    call<CardSnapshot & { event_id: string; duplicate: boolean; rewards_issued?: number }>("register_visit", {
      p_location: locationId,
      p_customer: customerId,
      p_staff: staffId,
      p_idempotency_key: idempotencyKey,
    }),
  undoVisit: (eventId: string, staffId: string) =>
    call<CardSnapshot>("undo_visit", { p_event: eventId, p_staff: staffId }),
  requestBonus: (
    locationId: string,
    customerId: string,
    type: "bonus_story" | "bonus_review",
    evidence: Record<string, unknown>,
    idempotencyKey: string,
  ) =>
    call<{ event_id: string | null }>("request_bonus", {
      p_location: locationId,
      p_customer: customerId,
      p_type: type,
      p_evidence: evidence,
      p_idempotency_key: idempotencyKey,
    }),
  validateBonus: (eventId: string, staffId: string, approve: boolean) =>
    call<CardSnapshot & { rewards_issued: number }>("validate_bonus", {
      p_event: eventId,
      p_staff: staffId,
      p_approve: approve,
    }),
  redeemCoupon: (customerCouponId: string, locationId: string, staffId: string) =>
    call<{ customer_id: string; title: string }>("redeem_coupon", {
      p_customer_coupon: customerCouponId,
      p_location: locationId,
      p_staff: staffId,
    }),
  redeemReward: (rewardId: string, locationId: string, staffId: string, idempotencyKey: string) =>
    call<CardSnapshot>("redeem_reward", {
      p_reward: rewardId,
      p_location: locationId,
      p_staff: staffId,
      p_idempotency_key: idempotencyKey,
    }),
};
