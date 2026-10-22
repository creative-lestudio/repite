import "server-only";
import { env } from "@/lib/env";

export interface PushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

/** Web Push disponible solo si están las claves VAPID. */
export function pushConfig(): PushConfig | null {
  const e = env();
  if (!e.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) return null;
  return {
    publicKey: e.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey: e.VAPID_PRIVATE_KEY,
    subject: e.VAPID_SUBJECT || "mailto:hola@repite.app",
  };
}
