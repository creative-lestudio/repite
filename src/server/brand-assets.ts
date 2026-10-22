import "server-only";
import type { CSSProperties } from "react";
import { brandImageUrl, themeVars, type Brand } from "@/domain/brand";

export interface BrandAssets {
  logoUrl: string | null;
  stampImageUrl: string | null;
  cardBgUrl: string | null;
}

export function brandAssets(brand: Brand): BrandAssets {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return {
    logoUrl: brandImageUrl(base, brand.logo),
    stampImageUrl: brandImageUrl(base, brand.stampImage),
    cardBgUrl: brandImageUrl(base, brand.cardBg),
  };
}

export function brandStyle(brand: Brand): CSSProperties {
  return { ...themeVars(brand), fontFamily: "var(--font-sans)" } as CSSProperties;
}
