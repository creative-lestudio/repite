/** «Café Aurora · Centro» → «cafe-aurora-centro». Solo a-z, 0-9 y guiones, entre 3 y 50 caracteres. */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return base.length >= 3 ? base : "";
}

export const COUNTRY_DEFAULTS = {
  ES: { currency: "EUR", timezone: "Europe/Madrid", locale: "es-ES" },
  VE: { currency: "USD", timezone: "America/Caracas", locale: "es-VE" },
} as const;
