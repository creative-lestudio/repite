// Contenido de las tarjetas de Wallet (iOS y Android). Lógica pura: sin acceso a servidor.

export const WALLET_TEXT = {
  stamps: "Sellos",
  reward: "Premio",
  rewardReady: "¡Premio listo!",
  rewardReadyValue: "Enséñalo en el local",
  scanHint: "Enseña este código para sumar sellos",
  moreToGo: (n: number) => (n === 1 ? "Te falta 1 sello" : `Te faltan ${n} sellos`),
} as const;

/** «●●●○○○○○»: sellos conseguidos y por conseguir. Con más de 12 se acorta a «7 / 15». */
export function stampRow(filled: number, total: number): string {
  const f = Math.max(0, Math.min(filled, total));
  if (total > 12) return `${f} / ${total}`;
  return "●".repeat(f) + "○".repeat(total - f);
}

export interface PassContent {
  serial: string;
  locationName: string;
  customerName: string;
  rewardName: string;
  total: number;
  filled: number;
  rewardsReady: number;
  qrUrl: string;
  /** Color de marca del local en #RRGGBB (por defecto el de Repite). */
  brandColor: string;
  /** URL del logotipo del local (null: el de Repite). */
  logoUrl?: string | null;
}

export function passSerial(locationId: string, customerId: string): string {
  return `${locationId}_${customerId}`;
}

export function parseSerial(serial: string): { locationId: string; customerId: string } | null {
  const m = /^([0-9a-f-]{36})_([0-9a-f-]{36})$/i.exec(serial);
  return m ? { locationId: m[1]!, customerId: m[2]! } : null;
}

/** Texto de estado: premio listo o cuántos sellos faltan. */
export function statusLine(c: Pick<PassContent, "filled" | "total" | "rewardsReady">): string {
  return c.rewardsReady > 0 ? WALLET_TEXT.rewardReady : WALLET_TEXT.moreToGo(Math.max(0, c.total - c.filled));
}

export function hexToRgb(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "rgb(255, 59, 46)";
  const n = parseInt(m[1]!, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}
