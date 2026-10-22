import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

/**
 * Dirección pública de la app para construir enlaces y QR. Se toma de la petición en curso
 * (así nunca apunta a un dominio equivocado) y, fuera de una petición, de NEXT_PUBLIC_APP_URL.
 */
export async function appUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
      const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
      return `${h.get("x-forwarded-proto") ?? (local ? "http" : "https")}://${host}`;
    }
  } catch {
    /* fuera de una petición */
  }
  return env().NEXT_PUBLIC_APP_URL;
}
