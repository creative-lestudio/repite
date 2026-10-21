import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import type { Locale } from "@/i18n/config";
import type { Country } from "@/domain/phone";

export interface LocationSettings {
  stamp_cooldown_hours?: number;
  message_min_days?: number;
  opportunity_hour?: number;
  tone?: string;
  contact_whatsapp?: string;
  instagram_handle?: string;
  google_review_url?: string;
  opening_hours?: string;
}

export interface PublicLocation {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  address: string | null;
  timezone: string;
  locale: Locale;
  logoPath: string | null;
  brandColor: string | null;
  settings: LocationSettings;
  country: Country;
  currency: "EUR" | "USD";
  orgStatus: string;
}

/** Local público por slug (para /c/[slug]). Se cachea durante la petición. */
export const getLocationBySlug = cache(async (slug: string): Promise<PublicLocation | null> => {
  const { data, error } = await createServiceClient()
    .from("locations")
    .select(
      "id, organization_id, name, slug, address, timezone, locale, logo_path, brand_color, settings, organizations!inner(country, currency, status, deleted_at)",
    )
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const org = data.organizations;
  if (org.deleted_at || org.status !== "active") return null;
  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    slug: data.slug,
    address: data.address,
    timezone: data.timezone,
    locale: data.locale as Locale,
    logoPath: data.logo_path,
    brandColor: data.brand_color,
    settings: (data.settings ?? {}) as LocationSettings,
    country: org.country as Country,
    currency: org.currency as "EUR" | "USD",
    orgStatus: org.status,
  };
});

export interface ProgramSummary {
  id: string;
  stamps_required: number;
  reward_name: string;
}

/** Programa activo del local (el propio o el de la organización), igual que app.active_program. */
export const getActiveProgram = cache(async (location: PublicLocation): Promise<ProgramSummary | null> => {
  const { data, error } = await createServiceClient()
    .from("loyalty_programs")
    .select("id, stamps_required, reward_name, location_id, created_at")
    .eq("organization_id", location.organizationId)
    .eq("active", true)
    .is("deleted_at", null)
    .or(`location_id.eq.${location.id},location_id.is.null`)
    .order("location_id", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, stamps_required: data.stamps_required, reward_name: data.reward_name } : null;
});
