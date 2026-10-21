export const locales = ["es-ES", "es-VE"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es-ES";
export const LOCALE_COOKIE = "repite_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
