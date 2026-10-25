"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Json } from "@/lib/supabase/database.types";
import { parseCoord } from "@/domain/geo";
import { parseLevels } from "@/domain/levels";
import { planSpec } from "@/domain/plan";
import { COUNTRY_DEFAULTS } from "@/domain/slug";
import { businessSchema, programSchema, settingsSchema } from "@/lib/schemas/owner";
import { createUserClient } from "@/lib/supabase/server";
import { requireManager, requireOwner } from "../auth/owner";
import { zodFields } from "@/lib/schemas/zod-fields";
import { toBusinessError } from "../errors";
import { addOwnerNote } from "../repositories/owner";

const asJson = (v: unknown) => v as NonNullable<Json>;

export type FormState =
  { ok: true; message?: string } | { ok: false; error: string; fields?: Record<string, string> } | null;

/** Alta del negocio: organización + primer local + programa de sellos, en una sola pantalla. */
export async function createBusinessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = businessSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: zodFields(parsed.error) };
  const v = parsed.data;
  const d = COUNTRY_DEFAULTS[v.country];

  const supabase = await createUserClient();
  const { data, error } = await supabase.rpc("create_organization_with_owner", {
    p_name: v.businessName,
    p_country: v.country,
    p_currency: d.currency,
    p_location_name: v.locationName,
    p_slug: v.slug,
    p_timezone: d.timezone,
    p_locale: d.locale,
    p_business_type: v.businessType,
  });
  if (error) {
    const biz = toBusinessError(error);
    if (biz?.code === "slug_taken") return { ok: false, error: "form", fields: { slug: "slug_taken" } };
    if (biz?.code === "already_has_organization") redirect("/app");
    if (biz) return { ok: false, error: biz.code };
    throw error;
  }
  const { organization_id } = data as { organization_id: string; location_id: string };

  const { error: pErr } = await supabase.from("loyalty_programs").insert({
    organization_id,
    stamps_required: v.stamps,
    reward_name: v.rewardName,
  });
  if (pErr) throw pErr;
  await supabase
    .from("organizations")
    .update({ onboarding: { account: true, location: true, program: true } })
    .eq("id", organization_id);
  redirect("/app");
}

/** Marca un paso del asistente como hecho (por ejemplo «qr» al descargar el material). */
export async function markOnboardingStepAction(step: "qr" | "team") {
  const ctx = await requireOwner();
  const supabase = await createUserClient();
  await supabase
    .from("organizations")
    .update({ onboarding: { ...ctx.organization.onboarding, [step]: true } })
    .eq("id", ctx.organization.id);
  revalidatePath("/app");
}

// ───────────── Programa de fidelidad ─────────────

export async function saveProgramAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireManager();
  const parsed = programSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: zodFields(parsed.error) };
  const v = parsed.data;
  const supabase = await createUserClient();
  const bonuses = planSpec(ctx.organization.effectivePlan).bonuses;

  const row = {
    stamps_required: v.stamps,
    reward_name: v.rewardName,
    reward_description: v.rewardDescription,
    reward_expiry_days: v.expiryDays,
    bonus_story_enabled: bonuses && v.bonusStory,
    bonus_review_enabled: false, // sin incentivos por reseñas (D-006)
    // Los niveles VIP son de Growth: con otro plan se conservan los guardados
    ...(planSpec(ctx.organization.effectivePlan).levels
      ? {
          levels: asJson(
            parseLevels(
              [1, 2, 3].map((n) => ({
                name: v[`level${n}Name` as "level1Name"],
                visits: Number(v[`level${n}Visits` as "level1Visits"]),
                perk: v[`level${n}Perk` as "level1Perk"],
              })),
            ),
          ),
        }
      : {}),
  };
  const { data: existing } = await supabase
    .from("loyalty_programs")
    .select("id")
    .eq("active", true)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("loyalty_programs").update(row).eq("id", existing.id)
    : await supabase.from("loyalty_programs").insert({ ...row, organization_id: ctx.organization.id });
  if (error) throw error;

  await supabase
    .from("audit_log")
    .insert({
      organization_id: ctx.organization.id,
      actor_type: "user",
      actor_id: ctx.userId,
      action: "program.save",
      entity: "loyalty_program",
      data: row,
    })
    .then(
      () => {},
      () => {},
    );
  revalidatePath("/app", "layout");
  return { ok: true };
}

// ───────────── Clientes ─────────────

export async function addOwnerNoteAction(customerId: string, text: string) {
  const ctx = await requireOwner();
  const clean = text.trim();
  if (!/^[0-9a-f-]{36}$/.test(customerId) || clean.length < 1 || clean.length > 1000)
    return { ok: false as const, error: "noteInvalid" };
  await addOwnerNote(ctx.organization.id, ctx.userId, customerId, clean);
  revalidatePath(`/app/clientes/${customerId}`);
  return { ok: true as const };
}

// ───────────── Ajustes ─────────────

export async function saveSettingsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await requireManager();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: zodFields(parsed.error) };
  const v = parsed.data;
  const settings = {
    ...ctx.location.settings,
    stamp_cooldown_hours: v.cooldownHours,
    message_min_days: v.messageGapDays,
    contact_whatsapp: v.whatsapp,
    instagram_handle: v.instagram,
    google_review_url: v.reviewUrl,
    opening_hours: v.openingHours,
    average_ticket: v.averageTicket,
  };
  // Coordenadas del local: solo se guardan con un plan que incluye el aviso por cercanía
  const lat = parseCoord(v.latitude, "lat");
  const lng = parseCoord(v.longitude, "lng");
  const wantsCoords = v.latitude !== "" || v.longitude !== "";
  if (planSpec(ctx.organization.effectivePlan).proximity && wantsCoords && (lat === null || lng === null))
    return { ok: false, error: "form", fields: { latitude: "coordsInvalid" } };
  const coords = planSpec(ctx.organization.effectivePlan).proximity
    ? { latitude: wantsCoords ? lat : null, longitude: wantsCoords ? lng : null }
    : {};
  const supabase = await createUserClient();
  const { error } = await supabase
    .from("locations")
    .update({
      ...coords,
      name: v.name,
      address: v.address,
      locale: v.locale,
      timezone: v.timezone,
      business_type: v.businessType,
      settings,
    })
    .eq("id", ctx.location.id);
  if (error) throw error;
  revalidatePath("/app", "layout");
  return { ok: true };
}
