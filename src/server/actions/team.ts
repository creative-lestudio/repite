"use server";

import { revalidatePath } from "next/cache";
import { deviceSchema, idSchema, pinOnlySchema, staffSchema } from "@/lib/schemas/team";
import { createUserClient } from "@/lib/supabase/server";
import { requireManager } from "../auth/owner";
import { qrSvg } from "../qr";
import { addStaff, changeStaffPin, createDevice, setStaffActive } from "../repositories/team";
import { zodFields } from "@/lib/schemas/zod-fields";
import type { FormState } from "./owner";
import { appUrl } from "@/server/app-url";

async function audit(ctx: Awaited<ReturnType<typeof requireManager>>, action: string, entityId?: string) {
  const supabase = await createUserClient();
  await supabase
    .from("audit_log")
    .insert({
      organization_id: ctx.organization.id,
      actor_type: "user",
      actor_id: ctx.userId,
      action,
      entity: "staff",
      entity_id: entityId,
    })
    .then(
      () => {},
      () => {},
    );
}

export async function addStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireManager();
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: zodFields(parsed.error) };
  const id = await addStaff(ctx.organization.id, ctx.location.id, parsed.data.name, parsed.data.role, parsed.data.pin);
  await audit(ctx, "staff.add", id);
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function changePinAction(staffId: string, pin: string) {
  const ctx = await requireManager();
  const parsed = pinOnlySchema.safeParse({ pin });
  if (!parsed.success || !idSchema.safeParse(staffId).success) return { ok: false as const, error: "pinInvalid" };
  const ok = await changeStaffPin(ctx.organization.id, ctx.location.id, staffId, parsed.data.pin);
  if (!ok) return { ok: false as const, error: "generic" };
  await audit(ctx, "staff.pin_change", staffId);
  revalidatePath("/app/equipo");
  return { ok: true as const };
}

export async function setStaffActiveAction(staffId: string, active: boolean) {
  const ctx = await requireManager();
  if (!idSchema.safeParse(staffId).success) return { ok: false as const, error: "generic" };
  const ok = await setStaffActive(ctx.organization.id, ctx.location.id, staffId, active);
  if (!ok) return { ok: false as const, error: "generic" };
  await audit(ctx, active ? "staff.reactivate" : "staff.deactivate", staffId);
  revalidatePath("/app/equipo");
  return { ok: true as const };
}

export async function createDeviceAction(name: string) {
  const ctx = await requireManager();
  const parsed = deviceSchema.safeParse({ name });
  if (!parsed.success) return { ok: false as const, error: "generic" };
  const token = await createDevice(ctx.organization.id, ctx.location.id, parsed.data.name);
  const link = `${await appUrl()}/equipo/vincular?t=${token}`;
  await audit(ctx, "device.create");
  revalidatePath("/app/equipo");
  return { ok: true as const, link, qr: await qrSvg(link) };
}

export async function revokeDeviceAction(deviceId: string) {
  const ctx = await requireManager();
  if (!idSchema.safeParse(deviceId).success) return { ok: false as const, error: "generic" };
  const supabase = await createUserClient();
  const { error } = await supabase
    .from("staff_devices")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", deviceId);
  if (error) return { ok: false as const, error: "generic" };
  await audit(ctx, "device.revoke", deviceId);
  revalidatePath("/app/equipo");
  return { ok: true as const };
}
