import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { clientIp } from "./request";

/** Ventana fija en Postgres. Devuelve true si la petición está permitida. Si la BD falla, deja pasar. */
export async function rateLimit(bucket: string, windowSeconds: number, max: number, key?: string): Promise<boolean> {
  const id = key ?? (await clientIp());
  const { data, error } = await createServiceClient().rpc("rate_limit_hit", {
    p_key: `${bucket}:${id}`,
    p_window_seconds: windowSeconds,
    p_max: max,
  });
  if (error) {
    console.error("[rate-limit]", error.message);
    return true;
  }
  return data === true;
}
