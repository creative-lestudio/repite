import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Token opaco para cookies y enlaces (256 bits, base64url). En la BD solo se guarda su hash. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
