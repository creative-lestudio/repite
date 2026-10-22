// Marca del local: aplica colores, tipografía y estilo de tarjeta a toda la interfaz. Lógica pura.

export const DEFAULT_PRIMARY = "#FF3B2E";

export const FONTS = {
  jakarta: { label: "Moderna", stack: "var(--font-jakarta), var(--font-inter), ui-sans-serif, sans-serif" },
  inter: { label: "Neutra", stack: "var(--font-inter), ui-sans-serif, system-ui, sans-serif" },
  poppins: { label: "Redonda", stack: "var(--font-poppins), var(--font-inter), ui-sans-serif, sans-serif" },
  nunito: { label: "Amable", stack: "var(--font-nunito), var(--font-inter), ui-sans-serif, sans-serif" },
  space: { label: "Técnica", stack: "var(--font-space), var(--font-inter), ui-sans-serif, sans-serif" },
  playfair: { label: "Elegante", stack: "var(--font-playfair), Georgia, serif" },
  lora: { label: "Clásica", stack: "var(--font-lora), Georgia, serif" },
  dmserif: { label: "Con carácter", stack: "var(--font-dmserif), Georgia, serif" },
} as const;
export type FontKey = keyof typeof FONTS;
export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

export const STAMP_SHAPES = ["circle", "square", "hex", "star"] as const;
export type StampShape = (typeof STAMP_SHAPES)[number];
export const STAMP_MODES = ["icon", "number", "image"] as const;
export type StampMode = (typeof STAMP_MODES)[number];
export const CARD_STYLES = ["light", "dark", "brand"] as const;
export type CardStyle = (typeof CARD_STYLES)[number];

export interface Brand {
  primary: string;
  font: FontKey;
  stampShape: StampShape;
  stampMode: StampMode;
  cardStyle: CardStyle;
  /** Rutas en el bucket «brand» (o null). */
  logo: string | null;
  stampImage: string | null;
  cardBg: string | null;
}

export const DEFAULT_BRAND: Brand = {
  primary: DEFAULT_PRIMARY,
  font: "jakarta",
  stampShape: "circle",
  stampMode: "icon",
  cardStyle: "light",
  logo: null,
  stampImage: null,
  cardBg: null,
};

const HEX = /^#[0-9a-f]{6}$/i;
const pick = <T extends string>(v: unknown, list: readonly T[], fallback: T): T =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : fallback;
const path = (v: unknown) => (typeof v === "string" && /^[\w./-]{1,200}$/.test(v) && !v.includes("..") ? v : null);

/** Lee la marca guardada (jsonb + columnas antiguas), tolerando datos incompletos. */
export function parseBrand(json: unknown, primary?: string | null, logo?: string | null): Brand {
  const j = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  return {
    primary: HEX.test(primary ?? "") ? primary! : DEFAULT_PRIMARY,
    font: pick(j.font, FONT_KEYS, DEFAULT_BRAND.font),
    stampShape: pick(j.stampShape, STAMP_SHAPES, DEFAULT_BRAND.stampShape),
    stampMode: pick(j.stampMode, STAMP_MODES, DEFAULT_BRAND.stampMode),
    cardStyle: pick(j.cardStyle, CARD_STYLES, DEFAULT_BRAND.cardStyle),
    logo: path(logo),
    stampImage: path(j.stampImage),
    cardBg: path(j.cardBg),
  };
}

// ── Color ──

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (c: [number, number, number]) =>
  "#" +
  c
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mezcla `hex` con `other` (0 = hex, 1 = other). */
export function mix(hex: string, other: string, amount: number): string {
  const a = rgb(hex);
  const b = rgb(other);
  return toHex(a.map((v, i) => v + (b[i]! - v) * amount) as [number, number, number]);
}

/** Oscurece el color hasta que el texto blanco encima sea legible (AA, 4,5:1). */
export function actionColor(hex: string): string {
  let c = hex;
  for (let i = 0; i < 40 && contrast(c, "#ffffff") < 4.5; i++) c = mix(c, "#000000", 0.06);
  return c;
}

/** Texto que se lee sobre el color de marca: blanco o casi negro. */
export function onColor(hex: string): string {
  return contrast(hex, "#ffffff") >= contrast(hex, "#111111") ? "#ffffff" : "#111111";
}

export function themeVars(brand: Brand): Record<string, string> {
  const action = actionColor(brand.primary);
  return {
    "--brand": brand.primary,
    "--on-brand": onColor(brand.primary),
    "--primary": action,
    "--primary-hover": mix(action, "#000000", 0.25),
    "--primary-soft": mix(brand.primary, "#ffffff", 0.9),
    "--ring": action,
    "--font-display": FONTS[brand.font].stack,
    "--font-sans": FONTS[brand.font].stack,
  };
}

/** URL pública de una imagen de marca. */
export function brandImageUrl(supabaseUrl: string, p: string | null): string | null {
  return p ? `${supabaseUrl}/storage/v1/object/public/brand/${p}` : null;
}
