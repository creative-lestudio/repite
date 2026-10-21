import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { getCustomer, type CustomerRow } from "../repositories/customers";
import { userAgent } from "../request";
import { randomToken, sha256 } from "./tokens";

// El cliente final no tiene cuenta: su tarjeta vive en una cookie httpOnly por organización.
// En la BD solo guardamos el hash del token (customer_sessions).

const MAX_AGE_DAYS = 400; // máximo que aceptan los navegadores

export function customerCookieName(organizationId: string) {
  return `rc_${organizationId.replaceAll("-", "").slice(0, 16)}`;
}

export async function startCustomerSession(organizationId: string, customerId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + MAX_AGE_DAYS * 86_400_000);
  const { error } = await createServiceClient()
    .from("customer_sessions")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      token_hash: sha256(token),
      user_agent: await userAgent(),
      expires_at: expires.toISOString(),
    });
  if (error) throw error;
  (await cookies()).set(customerCookieName(organizationId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

/** Cliente de la sesión actual para esta organización, o null. */
export const getCustomerFromSession = cache(async (organizationId: string): Promise<CustomerRow | null> => {
  const token = (await cookies()).get(customerCookieName(organizationId))?.value;
  if (!token) return null;
  const { data, error } = await createServiceClient()
    .from("customer_sessions")
    .select("customer_id, expires_at, revoked_at")
    .eq("token_hash", sha256(token))
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.revoked_at || new Date(data.expires_at) < new Date()) return null;
  return getCustomer(organizationId, data.customer_id);
});

export async function endCustomerSession(organizationId: string) {
  const store = await cookies();
  const name = customerCookieName(organizationId);
  const token = store.get(name)?.value;
  if (token) {
    await createServiceClient()
      .from("customer_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", sha256(token));
  }
  store.delete(name);
}

/** Enlace mágico de un solo uso, válido 30 minutos. Devuelve el token en claro para enviarlo. */
export async function createMagicLink(organizationId: string, customerId: string): Promise<string> {
  const token = randomToken(24);
  const { error } = await createServiceClient()
    .from("magic_links")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      token_hash: sha256(token),
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
  if (error) throw error;
  return token;
}

/** Consume el enlace (una sola vez) y devuelve el customer_id, o null si no vale. */
export async function consumeMagicLink(organizationId: string, token: string): Promise<string | null> {
  const { data, error } = await createServiceClient()
    .from("magic_links")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", sha256(token))
    .eq("organization_id", organizationId)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("customer_id")
    .maybeSingle();
  if (error) throw error;
  return data?.customer_id ?? null;
}
