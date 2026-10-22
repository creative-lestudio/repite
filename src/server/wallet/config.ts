import "server-only";
import { planSpec, type EffectivePlan } from "@/domain/plan";
import { env } from "@/lib/env";

const b64 = (v: string) => Buffer.from(v, "base64").toString("utf8");

export interface AppleConfig {
  passTypeId: string;
  teamId: string;
  cert: string;
  key: string;
  passphrase?: string;
  wwdr: string;
}

export interface GoogleConfig {
  issuerId: string;
  clientEmail: string;
  privateKey: string;
}

/** Devuelve la configuración de Apple Wallet o null si falta algo (el botón no se muestra). */
export function appleConfig(): AppleConfig | null {
  const e = env();
  if (
    !e.APPLE_WALLET_PASS_TYPE_ID ||
    !e.APPLE_WALLET_TEAM_ID ||
    !e.APPLE_WALLET_CERT_PEM ||
    !e.APPLE_WALLET_KEY_PEM ||
    !e.APPLE_WALLET_WWDR_PEM
  )
    return null;
  return {
    passTypeId: e.APPLE_WALLET_PASS_TYPE_ID,
    teamId: e.APPLE_WALLET_TEAM_ID,
    cert: b64(e.APPLE_WALLET_CERT_PEM),
    key: b64(e.APPLE_WALLET_KEY_PEM),
    passphrase: e.APPLE_WALLET_KEY_PASSPHRASE || undefined,
    wwdr: b64(e.APPLE_WALLET_WWDR_PEM),
  };
}

export function googleConfig(): GoogleConfig | null {
  const e = env();
  if (!e.GOOGLE_WALLET_ISSUER_ID || !e.GOOGLE_WALLET_SERVICE_ACCOUNT) return null;
  try {
    const sa = JSON.parse(b64(e.GOOGLE_WALLET_SERVICE_ACCOUNT)) as { client_email?: string; private_key?: string };
    if (!sa.client_email || !sa.private_key) return null;
    return { issuerId: e.GOOGLE_WALLET_ISSUER_ID, clientEmail: sa.client_email, privateKey: sa.private_key };
  } catch {
    return null;
  }
}

/** Wallet disponible para un local: claves configuradas y plan que lo incluye. */
export function walletAvailability(plan: EffectivePlan) {
  const included = planSpec(plan).wallet;
  return { apple: included && appleConfig() !== null, google: included && googleConfig() !== null };
}
