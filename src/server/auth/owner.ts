import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { asBusinessType, type BusinessType } from "@/domain/business-types";
import { parseBrand, type Brand } from "@/domain/brand";
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
    brand: Brand;
    businessType: BusinessType;
    settings: Record<string, unknown>;
  };
}

/** Sesión del dueño o null. Todo pasa por RLS con el JWT del usuario. */
export const getOwnerContext = cache(async (): Promise<OwnerContext | null> => {
  const supabase = await createUserClient();
  // getClaims valida el JWT en local cuando es posible: evita un viaje a Supabase Auth por petición
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) return null;

  // Membresía, organización y locales en una sola consulta
  const { data: membership } = await supabase
    .from("memberships")
    .select(
      "role, organization_id, location_id, organizations!inner(id, name, country, currency, plan, trial_ends_at, onboarding, locations(id, name, slug, timezone, locale, address, brand_color, logo_path, brand, business_type, settings, created_at, deleted_at))",
    )
    .eq("user_id", claims.sub)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;

  const location = [...(membership.organizations.locations ?? [])]
    .filter((l) => !l.deleted_at && (!membership.location_id || l.id === membership.location_id))
    .sort((x, y) => x.created_at.localeCompare(y.created_at))[0];
  if (!location) return null;

  const org = membership.organizations;
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
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
      brand: parseBrand(location.brand, location.brand_color, location.logo_path),
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
