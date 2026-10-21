import type { Locale } from "./config";
import base from "../../messages/es-ES.json";

type Messages = typeof base;

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const current = out[key];
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object"
        ? deepMerge(current as Record<string, unknown>, value as Record<string, unknown>)
        : value;
  }
  return out as T;
}

// es-VE solo contiene las diferencias respecto a es-ES
export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === "es-ES") return base;
  const overrides = (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>;
  return deepMerge(base, overrides);
}
