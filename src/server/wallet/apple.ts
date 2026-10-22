import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { connect } from "node:http2";
import { PKPass } from "passkit-generator";
import { env } from "@/lib/env";
import { hexToRgb, stampRow, statusLine, WALLET_TEXT, type PassContent } from "@/domain/wallet";
import { createServiceClient } from "@/lib/supabase/server";
import { WALLET_IMAGES } from "./assets";
import { appleConfig, type AppleConfig } from "./config";

/** Token que Wallet devuelve en cada petición de actualización: se deriva del número de serie, sin guardarlo. */
export function appleAuthToken(serial: string): string {
  return createHmac("sha256", env().SESSION_SECRET).update(`wallet:${serial}`).digest("hex");
}

export function isValidAppleAuth(header: string | null, serial: string): boolean {
  const given = header?.replace(/^ApplePass\s+/i, "") ?? "";
  const expected = appleAuthToken(serial);
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

export function appleWebServiceUrl(): string {
  return `${env().NEXT_PUBLIC_APP_URL}/api/wallet/apple`;
}

/** Genera el archivo .pkpass con el estado actual de la tarjeta. */
export async function buildApplePass(content: PassContent, cfg: AppleConfig = appleConfig()!): Promise<Buffer> {
  const images = Object.fromEntries(Object.entries(WALLET_IMAGES).map(([n, b64]) => [n, Buffer.from(b64, "base64")]));
  const pass = new PKPass(
    images,
    { wwdr: cfg.wwdr, signerCert: cfg.cert, signerKey: cfg.key, signerKeyPassphrase: cfg.passphrase },
    {
      formatVersion: 1,
      passTypeIdentifier: cfg.passTypeId,
      teamIdentifier: cfg.teamId,
      organizationName: content.locationName,
      description: `Tarjeta de sellos de ${content.locationName}`,
      serialNumber: content.serial,
      authenticationToken: appleAuthToken(content.serial),
      webServiceURL: appleWebServiceUrl(),
      backgroundColor: hexToRgb(content.brandColor),
      foregroundColor: "rgb(255, 255, 255)",
      labelColor: "rgb(255, 255, 255)",
      logoText: content.locationName,
    },
  );
  pass.type = "storeCard";
  pass.headerFields.push({
    key: "balance",
    label: WALLET_TEXT.stamps,
    value: `${content.filled}/${content.total}`,
    changeMessage: "Llevas %@ sellos",
  });
  pass.primaryFields.push({ key: "row", label: statusLine(content), value: stampRow(content.filled, content.total) });
  pass.secondaryFields.push(
    { key: "reward", label: WALLET_TEXT.reward, value: content.rewardName },
    { key: "name", label: "Cliente", value: content.customerName, textAlignment: "PKTextAlignmentRight" },
  );
  pass.setBarcodes({
    message: content.qrUrl,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: WALLET_TEXT.scanHint,
  });
  return pass.getAsBuffer();
}

/** Avisa a los dispositivos que guardaron la tarjeta: Wallet pedirá la versión nueva. */
export async function pushApplePassUpdate(customerId: string, locationId: string): Promise<void> {
  const cfg = appleConfig();
  if (!cfg) return;
  const db = createServiceClient();
  const { data: regs } = await db
    .from("wallet_registrations")
    .update({ updated_at: new Date().toISOString() })
    .eq("customer_id", customerId)
    .eq("location_id", locationId)
    .select("push_token");
  if (!regs?.length) return;

  const client = connect("https://api.push.apple.com", { cert: cfg.cert, key: cfg.key, passphrase: cfg.passphrase });
  client.on("error", () => {});
  try {
    await Promise.all(
      regs.map(
        (r) =>
          new Promise<void>((resolve) => {
            const req = client.request({
              ":method": "POST",
              ":path": `/3/device/${r.push_token}`,
              "apns-topic": cfg.passTypeId,
              "apns-push-type": "background",
            });
            req.on("response", () => resolve());
            req.on("error", () => resolve());
            req.setTimeout(8000, () => {
              req.close();
              resolve();
            });
            req.end("{}");
          }),
      ),
    );
  } finally {
    client.close();
  }
}
