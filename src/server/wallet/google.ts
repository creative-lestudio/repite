import "server-only";
import { createSign } from "node:crypto";
import { actionColor } from "@/domain/brand";
import { stampRow, statusLine, WALLET_TEXT, type PassContent } from "@/domain/wallet";
import { env } from "@/lib/env";
import { googleConfig, type GoogleConfig } from "./config";

const b64url = (v: Buffer | string) => Buffer.from(v).toString("base64url");

/** JWT firmado con RS256 usando la clave de la cuenta de servicio. */
export function signJwt(claims: Record<string, unknown>, cfg: GoogleConfig): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(claims));
  const sig = createSign("RSA-SHA256").update(`${header}.${body}`).sign(cfg.privateKey);
  return `${header}.${body}.${b64url(sig)}`;
}

const strip = (id: string) => id.replace(/-/g, "");
export const googleClassId = (cfg: GoogleConfig, locationId: string) => `${cfg.issuerId}.loc_${strip(locationId)}`;
export const googleObjectId = (cfg: GoogleConfig, serial: string) => `${cfg.issuerId}.${strip(serial)}`;

export function googleLoyaltyClass(c: PassContent, cfg: GoogleConfig, locationId: string) {
  return {
    id: googleClassId(cfg, locationId),
    issuerName: c.locationName,
    programName: c.locationName,
    programLogo: {
      sourceUri: { uri: c.logoUrl ?? `${env().NEXT_PUBLIC_APP_URL}/icons/icon-512.png` },
      contentDescription: { defaultValue: { language: "es", value: c.locationName } },
    },
    hexBackgroundColor: actionColor(c.brandColor),
    reviewStatus: "UNDER_REVIEW",
    countryCode: "ES",
  };
}

export function googleLoyaltyObject(c: PassContent, cfg: GoogleConfig, locationId: string) {
  return {
    id: googleObjectId(cfg, c.serial),
    classId: googleClassId(cfg, locationId),
    state: "ACTIVE",
    accountName: c.customerName,
    loyaltyPoints: { label: WALLET_TEXT.stamps, balance: { string: `${c.filled}/${c.total}` } },
    secondaryLoyaltyPoints: { label: WALLET_TEXT.reward, balance: { string: c.rewardName } },
    textModulesData: [{ id: "row", header: statusLine(c), body: stampRow(c.filled, c.total) }],
    barcode: { type: "QR_CODE", value: c.qrUrl, alternateText: WALLET_TEXT.scanHint },
  };
}

/** Enlace «Añadir a Google Wallet» (clase y objeto van dentro del JWT). */
export function googleSaveUrl(c: PassContent, locationId: string, cfg: GoogleConfig = googleConfig()!): string {
  const jwt = signJwt(
    {
      iss: cfg.clientEmail,
      aud: "google",
      typ: "savetowallet",
      iat: Math.floor(Date.now() / 1000),
      origins: [env().NEXT_PUBLIC_APP_URL],
      payload: {
        loyaltyClasses: [googleLoyaltyClass(c, cfg, locationId)],
        loyaltyObjects: [googleLoyaltyObject(c, cfg, locationId)],
      },
    },
    cfg,
  );
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

async function accessToken(cfg: GoogleConfig): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    {
      iss: cfg.clientEmail,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    cfg,
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!res.ok) return null;
  return ((await res.json()) as { access_token?: string }).access_token ?? null;
}

/** Actualiza la tarjeta ya guardada en Google Wallet (si el cliente aún no la guardó, Google responde 404 y se ignora). */
export async function updateGoogleObject(c: PassContent, locationId: string): Promise<void> {
  const cfg = googleConfig();
  if (!cfg) return;
  const token = await accessToken(cfg);
  if (!token) return;
  const obj = googleLoyaltyObject(c, cfg, locationId);
  await fetch(`https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(obj.id)}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      loyaltyPoints: obj.loyaltyPoints,
      textModulesData: obj.textModulesData,
      state: "ACTIVE",
    }),
  });
}
