"use server";

import { redirect } from "next/navigation";
import { loginSchema, magicLinkSchema, safeNext } from "@/lib/schemas/auth";
import { createUserClient } from "@/lib/supabase/server";
import { rateLimit } from "../rate-limit";
import { appUrl } from "@/server/app-url";

export type AuthState = { ok: false; error: string; fields?: Record<string, string> } | { ok: true; sent: true } | null;

function fieldErrors(error: import("zod").ZodError) {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[String(i.path[0])] ??= i.message;
  return fields;
}

export async function loginAction(next: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await rateLimit("login", 600, 20))) return { ok: false, error: "rateLimited" };
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: fieldErrors(parsed.error) };
  const supabase = await createUserClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: "loginFailed" };
  redirect(safeNext(next));
}

export async function signUpOwnerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await rateLimit("owner-signup", 3600, 10))) return { ok: false, error: "rateLimited" };
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: fieldErrors(parsed.error) };
  const supabase = await createUserClient();
  // Sin contraseña: un enlace al correo crea la cuenta (o entra si ya existía)
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${await appUrl()}/auth/callback?siguiente=/app/empezar`,
    },
  });
  if (error) {
    console.error("signUpOwner: signInWithOtp", error.status, error.code, error.message);
    const limited = error.status === 429 || /rate.?limit/i.test(`${error.code} ${error.message}`);
    return { ok: false, error: limited ? "emailRateLimit" : "generic" };
  }
  return { ok: true, sent: true };
}

export async function magicLinkAction(next: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await rateLimit("magic-owner", 3600, 6))) return { ok: false, error: "rateLimited" };
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: fieldErrors(parsed.error) };
  const supabase = await createUserClient();
  // Entrar y registrarse son lo mismo: si el correo no tiene cuenta, se crea al abrir el enlace
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${await appUrl()}/auth/callback?siguiente=${encodeURIComponent(safeNext(next))}`,
    },
  });
  return { ok: true, sent: true };
}

export async function googleSignInAction(next: string) {
  if (!(await rateLimit("google-owner", 600, 20))) redirect("/entrar?error=enlace");
  const supabase = await createUserClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await appUrl()}/auth/callback?siguiente=${encodeURIComponent(safeNext(next))}`,
    },
  });
  if (error || !data.url) redirect("/entrar?error=enlace");
  redirect(data.url);
}

export async function signOutOwnerAction() {
  const supabase = await createUserClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
