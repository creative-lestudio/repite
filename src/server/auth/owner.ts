import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { asBusinessType, type BusinessType } from "@/domain/business-types";
import { createUserClient } from "@/lib/supabase/server";

export interface OwnerContext {
  userId: string;
  email: string;
  role: "owner" | "manager" | "staff";
  organization: {
    id: string;
    name: string;
    country: "ES" | "VE";
    currency: "EUR" | "USD";
    plan: string;
    trialEndsAt: string | null;
    onboarding: Record<string, boolean>;
  };
  location: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    locale: "es-ES" | "es-VE";
    address: string | null;
    brandColor: string | null;
    businessType: BusinessType;
    settings: Record<string, unknown>;
  };
}

/** Sesión del dueño o null. Todo pasa por RLS con el JWT del usuario. */
export const getOwnerContext = cache(async (): Promise<OwnerContext | null> => {
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select(
      "role, organization_id, location_id, organizations!inner(id, name, country, currency, plan, trial_ends_at, onboarding)",
    )
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  let q = supabase
    .from("locations")
    .select("id, name, slug, timezone, locale, address, brand_color, business_type, settings")
    .eq("organization_id", membership.organization_id)
    .is("deleted_at", null)
    .order("created_at")
    .limit(1);
  if (membership.location_id) q = q.eq("id", membership.location_id);
  const { data: location } = await q.maybeSingle();
  if (!location) return null;

  const org = membership.organizations;
  return {
    userId: user.id,
    email: user.email ?? "",
    role: membership.role as OwnerContext["role"],
    organization: {
      id: org.id,
      name: org.name,
      country: org.country as "ES" | "VE",
      currency: org.currency as "EUR" | "USD",
      plan: org.plan,
      trialEndsAt: org.trial_ends_at,
      onboarding: (org.onboarding ?? {}) as Record<string, boolean>,
    },
    location: {
      id: location.id,
      name: location.name,
      slug: location.slug,
      timezone: location.timezone,
      locale: location.locale as "es-ES" | "es-VE",
      address: location.address,
      brandColor: location.brand_color,
      businessType: asBusinessType(location.business_type),
      settings: (location.settings ?? {}) as Record<string, unknown>,
    },
  };
});

/** Para páginas del panel: exige sesión y una cuenta creada; si falta la cuenta, al asistente. */
export async function requireOwner(): Promise<OwnerContext> {
  const ctx = await getOwnerContext();
  if (!ctx) redirect("/app/empezar");
  return ctx;
}

/** Solo dueño o manager (el equipo con rol staff no entra a ajustes sensibles). */
export async function requireManager(): Promise<OwnerContext> {
  const ctx = await requireOwner();
  if (ctx.role === "staff") redirect("/app");
  return ctx;
}
