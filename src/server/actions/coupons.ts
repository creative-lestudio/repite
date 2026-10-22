"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasRoom, planSpec } from "@/domain/plan";
import { createUserClient } from "@/lib/supabase/server";
import { requireManager } from "../auth/owner";

type Result = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

const couponSchema = z.object({
  title: z.string().trim().min(2, "couponTitleRequired").max(80),
  description: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
  audience: z.enum(["all", "welcome", "birthday"]),
  endsAt: z
    .string()
    .trim()
    .transform((v) => v || null)
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "dateInvalid"),
});

async function activeCount() {
  const { count } = await (
    await createUserClient()
  )
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("active", true)
    .is("deleted_at", null);
  return count ?? 0;
}

export async function createCouponAction(_prev: Result | null, formData: FormData): Promise<Result> {
  const ctx = await requireManager();
  const limit = planSpec(ctx.organization.effectivePlan).coupons;
  if (limit === 0) return { ok: false, error: "planRequired" };
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[String(i.path[0])] ??= i.message;
    return { ok: false, error: "form", fields };
  }
  if (!hasRoom(await activeCount(), limit)) return { ok: false, error: "couponPlanLimit" };
  const v = parsed.data;
  const { error } = await (await createUserClient()).from("coupons").insert({
    organization_id: ctx.organization.id,
    title: v.title,
    description: v.description,
    audience: v.audience,
    // Vale hasta el final del día elegido
    ends_at: v.endsAt ? new Date(`${v.endsAt}T23:59:59`).toISOString() : null,
  });
  if (error) throw error;
  revalidatePath("/app/cupones");
  return { ok: true };
}

export async function setCouponActiveAction(id: string, active: boolean): Promise<Result> {
  const ctx = await requireManager();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "generic" };
  if (active && !hasRoom(await activeCount(), planSpec(ctx.organization.effectivePlan).coupons))
    return { ok: false, error: "couponPlanLimit" };
  const { error } = await (await createUserClient()).from("coupons").update({ active }).eq("id", id);
  if (error) throw error;
  revalidatePath("/app/cupones");
  return { ok: true };
}

export async function deleteCouponAction(id: string): Promise<Result> {
  await requireManager();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "generic" };
  const { error } = await (
    await createUserClient()
  )
    .from("coupons")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/app/cupones");
  return { ok: true };
}
