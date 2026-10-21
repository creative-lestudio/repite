import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Lee .env.local para que las pruebas puedan actuar como "el equipo" directamente sobre la BD local.
function loadEnv() {
  const env: Record<string, string> = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {}
  return { ...env, ...process.env } as Record<string, string>;
}

const env = loadEnv();
export const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const AURORA = {
  slug: "cafe-aurora",
  locationId: "a0000000-0000-4000-8000-0000000000a1",
  organizationId: "a0000000-0000-4000-8000-000000000001",
  lucia: "a0000000-0000-4000-8000-0000000000d1",
};

/** Teléfono español aleatorio para no chocar con datos anteriores. */
export function randomPhone() {
  return `6${Math.floor(10_000_000 + Math.random() * 89_999_999)}`;
}

export async function customerIdByPhone(phone: string) {
  const { data } = await admin
    .from("customers")
    .select("id")
    .eq("organization_id", AURORA.organizationId)
    .eq("phone_e164", `+34${phone}`)
    .single();
  return data!.id as string;
}
