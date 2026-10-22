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

export const AURORA_PROGRAM = "a0000000-0000-4000-8000-0000000000c1";
export const DEV_DEVICE_TOKEN = "dev-device-cafe-aurora";

/** Crea un cliente nuevo en Café Aurora con `stamps` sellos antiguos (fuera del intervalo mínimo). */
export async function seedCustomer(name: string, stamps = 0) {
  const phone = `+34${randomPhone()}`;
  const { data, error } = await admin
    .from("customers")
    .insert({ organization_id: AURORA.organizationId, name, phone_e164: phone, marketing_consent: true })
    .select("id, qr_token")
    .single();
  if (error) throw error;
  if (stamps > 0) {
    const old = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const rows = Array.from({ length: stamps }, (_, i) => ({
      organization_id: AURORA.organizationId,
      customer_id: data.id,
      location_id: AURORA.locationId,
      program_id: AURORA_PROGRAM,
      type: "visit",
      quantity: 1,
      idempotency_key: `e2e-seed:${data.id}:${i}`,
      created_at: old,
    }));
    const { error: e2 } = await admin.from("stamp_events").insert(rows);
    if (e2) throw e2;
  }
  return { id: data.id as string, qrToken: data.qr_token as string, phone };
}
