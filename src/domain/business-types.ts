/** Tipos de negocio con los que Repite adapta iconos, ejemplos y vocabulario. «otro» sirve para cualquier local. */
export const BUSINESS_TYPES = ["cafeteria", "panaderia", "takeaway", "restaurante", "heladeria", "otro"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const DEFAULT_BUSINESS_TYPE: BusinessType = "otro";

export function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === "string" && (BUSINESS_TYPES as readonly string[]).includes(value);
}

export function asBusinessType(value: unknown): BusinessType {
  return isBusinessType(value) ? value : DEFAULT_BUSINESS_TYPE;
}

type Locale = "es-ES" | "es-VE";

export const BUSINESS_PRESETS: Record<
  BusinessType,
  {
    /** Sellos necesarios sugeridos al crear el programa. */
    stamps: number;
    /** Palabra que sustituye a «lo de siempre» cuando no sabemos qué pide el cliente («¿te apetece un …?»). */
    fallbackWord: Record<Locale, string>;
  }
> = {
  cafeteria: { stamps: 8, fallbackWord: { "es-ES": "café", "es-VE": "cafecito" } },
  panaderia: { stamps: 8, fallbackWord: { "es-ES": "pan", "es-VE": "pancito" } },
  takeaway: { stamps: 8, fallbackWord: { "es-ES": "plato", "es-VE": "plato" } },
  restaurante: { stamps: 8, fallbackWord: { "es-ES": "buen plato", "es-VE": "buen plato" } },
  heladeria: { stamps: 10, fallbackWord: { "es-ES": "helado", "es-VE": "helado" } },
  otro: { stamps: 8, fallbackWord: { "es-ES": "detalle", "es-VE": "detalle" } },
};

/** Sectores con página propia en la web pública (el resto cae en «otro»). */
export const LANDING_SECTORS = [
  "cafeteria",
  "panaderia",
  "takeaway",
  "heladeria",
] as const satisfies readonly BusinessType[];
export type LandingSector = (typeof LANDING_SECTORS)[number];

/** Dirección pública de cada sector: /para/<slug> */
export const SECTOR_SLUGS: Record<LandingSector, string> = {
  cafeteria: "cafeterias",
  panaderia: "panaderias",
  takeaway: "takeaway",
  heladeria: "heladerias",
};

export function sectorFromSlug(slug: string): LandingSector | null {
  const hit = (Object.entries(SECTOR_SLUGS) as [LandingSector, string][]).find(([, s]) => s === slug);
  return hit ? hit[0] : null;
}
