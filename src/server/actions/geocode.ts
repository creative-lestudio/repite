"use server";

import { z } from "zod";
import { parseGeocode, type Coords } from "@/domain/geo";
import { requireManager } from "../auth/owner";
import { rateLimit } from "../rate-limit";

/** Busca las coordenadas de una dirección con OpenStreetMap (Nominatim). Solo para el dueño y con límite de uso. */
export async function geocodeAddressAction(
  address: string,
): Promise<{ ok: true; coords: Coords } | { ok: false; error: string }> {
  const ctx = await requireManager();
  const parsed = z.string().trim().min(5).max(200).safeParse(address);
  if (!parsed.success) return { ok: false, error: "addressTooShort" };
  if (!(await rateLimit("geocode", 3600, 20, ctx.userId))) return { ok: false, error: "rateLimited" };
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", parsed.data);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    const res = await fetch(url, {
      headers: { "user-agent": "Repite/1.0 (sistema de fidelizacion)", accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, error: "generic" };
    const coords = parseGeocode(await res.json());
    return coords ? { ok: true, coords } : { ok: false, error: "addressNotFound" };
  } catch {
    return { ok: false, error: "generic" };
  }
}
