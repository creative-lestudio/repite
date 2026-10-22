import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

// Cookies firmadas con HMAC-SHA256 (SESSION_SECRET): payload JSON en base64url + "." + firma.

function sign(data: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(data).digest("base64url");
}

export function seal<T extends object>(payload: T): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function unseal<T>(value: string | undefined): T | null {
  if (!value) return null;
  const [data, mac] = value.split(".");
  if (!data || !mac) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString()) as T;
  } catch {
    return null;
  }
}
