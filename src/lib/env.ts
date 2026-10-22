import "server-only";
import { z } from "zod";

// Variables de servidor validadas al arrancar. Ver .env.example
const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  CRON_SECRET: z.string().min(16).optional(),
  MESSAGING_PROVIDER: z.enum(["mock", "whatsapp"]).default("mock"),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  AI_PROVIDER: z.enum(["template", "claude"]).default("template"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),
  // Tarjetas en Wallet (opcional: si faltan, el botón no aparece). Ver docs/WALLET.md
  APPLE_WALLET_PASS_TYPE_ID: z.string().optional(),
  APPLE_WALLET_TEAM_ID: z.string().optional(),
  APPLE_WALLET_CERT_PEM: z.string().optional(), // certificado del Pass Type ID, PEM en base64
  APPLE_WALLET_KEY_PEM: z.string().optional(), // clave privada, PEM en base64
  APPLE_WALLET_KEY_PASSPHRASE: z.string().optional(),
  APPLE_WALLET_WWDR_PEM: z.string().optional(), // certificado intermedio de Apple (WWDR), PEM en base64
  GOOGLE_WALLET_ISSUER_ID: z.string().optional(),
  GOOGLE_WALLET_SERVICE_ACCOUNT: z.string().optional(), // JSON de la cuenta de servicio en base64
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;
export function env(): Env {
  if (!cached) cached = schema.parse(process.env);
  return cached;
}
