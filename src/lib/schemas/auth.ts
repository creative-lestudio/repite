import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("emailInvalid").max(160);
export const passwordSchema = z.string().min(8, "passwordShort").max(72);

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "passwordRequired") });
export const signupSchema = z.object({ email: emailSchema, password: passwordSchema });
export const magicLinkSchema = z.object({ email: emailSchema });

/** Solo rutas internas de /app para evitar redirecciones abiertas. */
export function safeNext(value: string | null | undefined): string {
  return value && /^\/app(\/[a-z0-9\-_/]*)?$/i.test(value) ? value : "/app";
}
