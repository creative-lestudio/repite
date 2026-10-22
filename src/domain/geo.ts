// Coordenadas del local (aviso por cercanía). Lógica pura.

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Lee «40.4168» / «40,4168»; null si está vacío o fuera de rango. */
export function parseCoord(raw: string | null | undefined, kind: "lat" | "lng"): number | null {
  const v = Number((raw ?? "").trim().replace(",", "."));
  if (!(raw ?? "").trim() || !Number.isFinite(v)) return null;
  const max = kind === "lat" ? 90 : 180;
  return Math.abs(v) <= max ? Math.round(v * 1e6) / 1e6 : null;
}

/** Acepta «40.4168, -3.7038» pegado desde Google Maps. */
export function parsePair(raw: string): Coords | null {
  const m = /^\s*(-?\d+(?:[.,]\d+)?)\s*[,;]\s*(-?\d+(?:[.,]\d+)?)\s*$/.exec(
    raw.replace(/(\d),(\d)/g, "$1.$2").replace(/\s+/g, " "),
  );
  if (!m) return null;
  const latitude = parseCoord(m[1], "lat");
  const longitude = parseCoord(m[2], "lng");
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
}

/** Interpreta la respuesta de Nominatim (OpenStreetMap) a una búsqueda de dirección. */
export function parseGeocode(json: unknown): Coords | null {
  if (!Array.isArray(json) || json.length === 0) return null;
  const first = json[0] as { lat?: string; lon?: string };
  const latitude = parseCoord(first.lat, "lat");
  const longitude = parseCoord(first.lon, "lng");
  return latitude !== null && longitude !== null ? { latitude, longitude } : null;
}
