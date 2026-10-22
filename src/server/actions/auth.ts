"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { loginSchema, magicLinkSchema, safeNext, signupSchema } from "@/lib/schemas/auth";
import { createUserClient } from "@/lib/supabase/server";
import { rateLimit } from "../rate-limit";

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
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: fieldErrors(parsed.error) };
  const supabase = await createUserClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${env().NEXT_PUBLIC_APP_URL}/auth/callback?siguiente=/app/empezar` },
  });
  if (error) {
    return { ok: false, error: /registered|already/i.test(error.message) ? "emailTaken" : "generic" };
  }
  // Con la confirmación por correo activada (producción) no hay sesión todavía
  if (!data.session) return { ok: true, sent: true };
  redirect("/app/empezar");
}

export async function magicLinkAction(next: string, _prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await rateLimit("magic-owner", 3600, 6))) return { ok: false, error: "rateLimited" };
  const parsed = magicLinkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "form", fields: fieldErrors(parsed.error) };
  const supabase = await createUserClient();
  // shouldCreateUser: false → solo para cuentas existentes; misma respuesta exista o no
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${env().NEXT_PUBLIC_APP_URL}/auth/callback?siguiente=${encodeURIComponent(safeNext(next))}`,
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
      redirectTo: `${env().NEXT_PUBLIC_APP_URL}/auth/callback?siguiente=${encodeURIComponent(safeNext(next))}`,
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
