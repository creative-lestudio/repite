"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { noteSchema, pinSchema, usualOrderSchema, uuid } from "@/lib/schemas/staff";
import { createServiceClient } from "@/lib/supabase/server";
import {
  endStaffSession,
  getDevice,
  getStaffSession,
  startStaffSession,
  type StaffSession,
} from "../auth/staff-session";
import { BusinessError } from "../errors";
import { rateLimit } from "../rate-limit";
import { ledger, type CardSnapshot } from "../repositories/ledger";
import {
  addCustomerNote,
  eventBelongsToLocation,
  rewardBelongsToOrganization,
  searchCustomers,
  setUsualOrder,
  type CustomerHit,
} from "../repositories/staff";

type Fail = { ok: false; error: string; values?: Record<string, string | number> };
type Ok<T> = { ok: true; data: T };

async function withStaff<T>(fn: (s: StaffSession) => Promise<Ok<T> | Fail>): Promise<Ok<T> | Fail> {
  const session = await getStaffSession();
  if (!session) return { ok: false, error: "staffSessionExpired" };
  try {
    return await fn(session);
  } catch (e) {
    if (e instanceof BusinessError) {
      const values: Record<string, string | number> = {};
      if (e.code === "cooldown" && typeof e.detail.next_allowed_at === "string") {
        values.time = new Intl.DateTimeFormat("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: session.device.location.timezone,
        }).format(new Date(e.detail.next_allowed_at));
      }
      if (typeof e.detail.minutes === "number") values.minutes = e.detail.minutes;
      return { ok: false, error: e.code, values };
    }
    throw e;
  }
}

// ───────────── Acceso ─────────────

export type PinResult =
  | { ok: true }
  | { ok: false; reason: "wrong_pin"; attemptsLeft: number }
  | { ok: false; reason: "locked"; until: string }
  | { ok: false; reason: "not_found" | "inactive" | "no_device" | "rate_limited" };

export async function signInStaffAction(input: { staffId: string; pin: string }): Promise<PinResult> {
  const device = await getDevice();
  if (!device) return { ok: false, reason: "no_device" };
  const parsed = pinSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "wrong_pin", attemptsLeft: 5 };
  if (!(await rateLimit("pin", 600, 30, device.id))) return { ok: false, reason: "rate_limited" };

  const { data, error } = await createServiceClient().rpc("verify_staff_pin", {
    p_location: device.location.id,
    p_staff: parsed.data.staffId,
    p_pin: parsed.data.pin,
  });
  if (error) throw error;
  const r = data as { ok: boolean; reason?: string; attempts_left?: number; locked_until?: string };
  if (r.ok) {
    await startStaffSession(device.id, parsed.data.staffId);
    await createServiceClient().from("audit_log").insert({
      organization_id: device.organizationId,
      actor_type: "staff",
      actor_id: parsed.data.staffId,
      action: "staff.sign_in",
      entity: "staff_device",
      entity_id: device.id,
    });
    return { ok: true };
  }
  if (r.reason === "locked") return { ok: false, reason: "locked", until: r.locked_until! };
  if (r.reason === "wrong_pin") return { ok: false, reason: "wrong_pin", attemptsLeft: r.attempts_left ?? 0 };
  return { ok: false, reason: (r.reason as "not_found" | "inactive") ?? "not_found" };
}

export async function signOutStaffAction() {
  await endStaffSession();
  redirect("/equipo");
}

// ───────────── Clientes ─────────────

export async function searchCustomersAction(query: string): Promise<Ok<CustomerHit[]> | Fail> {
  return withStaff(async (s) => ({
    ok: true,
    data: await searchCustomers(s.device.organizationId, String(query ?? "")),
  }));
}

export async function registerVisitAction(customerId: string, idempotencyKey: string) {
  return withStaff<CardSnapshot & { rewards_issued?: number; event_id: string }>(async (s) => {
    const id = uuid.parse(customerId);
    const key = `visit:${s.device.id}:${uuid.parse(idempotencyKey)}`;
    const data = await ledger.registerVisit(s.device.location.id, id, s.staffId, key);
    revalidatePath("/equipo", "layout");
    return { ok: true, data };
  });
}

export async function undoVisitAction(eventId: string) {
  return withStaff<CardSnapshot>(async (s) => {
    const id = uuid.parse(eventId);
    if (!(await eventBelongsToLocation(id, s.device.location.id))) return { ok: false, error: "event_not_found" };
    const data = await ledger.undoVisit(id, s.staffId);
    revalidatePath("/equipo", "layout");
    return { ok: true, data };
  });
}

export async function redeemRewardAction(rewardId: string, idempotencyKey: string) {
  return withStaff<CardSnapshot>(async (s) => {
    const id = uuid.parse(rewardId);
    if (!(await rewardBelongsToOrganization(id, s.device.organizationId)))
      return { ok: false, error: "reward_not_found" };
    const data = await ledger.redeemReward(id, s.device.location.id, s.staffId, `redeem:${uuid.parse(idempotencyKey)}`);
    revalidatePath("/equipo", "layout");
    return { ok: true, data };
  });
}

export async function validateBonusAction(eventId: string, approve: boolean) {
  return withStaff<CardSnapshot & { rewards_issued: number }>(async (s) => {
    const id = uuid.parse(eventId);
    if (!(await eventBelongsToLocation(id, s.device.location.id))) return { ok: false, error: "event_not_found" };
    const data = await ledger.validateBonus(id, s.staffId, approve === true);
    revalidatePath("/equipo", "layout");
    return { ok: true, data };
  });
}

export async function addNoteAction(input: { customerId: string; text: string; pinned?: boolean }) {
  return withStaff<null>(async (s) => {
    const parsed = noteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "noteInvalid" };
    await addCustomerNote(
      s.device.organizationId,
      parsed.data.customerId,
      s.staffId,
      parsed.data.text,
      parsed.data.pinned,
    );
    revalidatePath(`/equipo/clientes/${parsed.data.customerId}`);
    return { ok: true, data: null };
  });
}

export async function setUsualOrderAction(input: { customerId: string; usualOrder: string }) {
  return withStaff<null>(async (s) => {
    const parsed = usualOrderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "generic" };
    await setUsualOrder(s.device.organizationId, parsed.data.customerId, parsed.data.usualOrder);
    revalidatePath(`/equipo/clientes/${parsed.data.customerId}`);
    return { ok: true, data: null };
  });
}
