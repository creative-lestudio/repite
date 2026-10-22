"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";
import { normalizePhone } from "@/domain/phone";
import { firstName, renderTemplate } from "@/domain/templates";
import { birthdayToDate, bonusSchema, preferencesSchema, signupSchema } from "@/lib/schemas/customer";
import {
  createMagicLink,
  endCustomerSession,
  getCustomerFromSession,
  startCustomerSession,
} from "../auth/customer-session";
import { BusinessError, type ActionResult } from "../errors";
import { sendTransactional } from "../messaging";
import { rateLimit } from "../rate-limit";
import {
  createCustomer,
  findCustomerByPhone,
  getCardState,
  updateCustomerPreferences,
} from "../repositories/customers";
import { ledger } from "../repositories/ledger";
import { deletePushSubscription, savePushSubscription } from "../repositories/notifications";
import { getLocationBySlug } from "../repositories/locations";
import { getTemplate } from "../repositories/templates";
import { planSpec, type EffectivePlan } from "@/domain/plan";
import { appUrl } from "@/server/app-url";

export type SignupState = ActionResult | { ok: false; error: "phoneExists"; masked?: string } | null;

async function setLocaleCookieIfMissing(locale: string) {
  const store = await cookies();
  if (!store.get(LOCALE_COOKIE)) {
    store.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 400, sameSite: "lax" });
  }
}

async function sendAccessLink(
  slug: string,
  customer: { id: string; name: string; phone_e164: string; locale: string },
) {
  const location = (await getLocationBySlug(slug))!;
  const token = await createMagicLink(location.organizationId, customer.id);
  const link = `${await appUrl()}/c/${slug}/acceso?t=${token}`;
  const template = await getTemplate(location.organizationId, "magic_link", customer.locale);
  await sendTransactional({
    organizationId: location.organizationId,
    locationId: location.id,
    customerId: customer.id,
    to: customer.phone_e164,
    locale: customer.locale,
    body: renderTemplate(template, { nombre: firstName(customer.name), local: location.name, enlace: link }),
  });
}

export async function signUpAction(slug: string, _prev: SignupState, formData: FormData): Promise<SignupState> {
  const location = await getLocationBySlug(slug);
  if (!location) return { ok: false, error: "location_not_found" };
  if (!(await rateLimit("signup", 600, 10))) return { ok: false, error: "rateLimited" };

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "form", fields };
  }
  const input = parsed.data;
  const phone = normalizePhone(input.phone, location.country);
  if (!phone) return { ok: false, error: "form", fields: { phone: "phoneInvalid" } };

  const existing = await findCustomerByPhone(location.organizationId, phone);
  if (existing) {
    // No iniciamos sesión con solo conocer un teléfono: enviamos un enlace al WhatsApp del titular.
    if (await rateLimit("access-link", 3600, 3, phone)) await sendAccessLink(slug, existing);
    return { ok: false, error: "phoneExists" };
  }

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : location.locale;
  const result = await createCustomer({
    organizationId: location.organizationId,
    locationId: location.id,
    name: input.name,
    phone,
    birthday: birthdayToDate(input.birthDay, input.birthMonth),
    locale,
    consent: input.consent,
  });
  if ("limitReached" in result && result.limitReached) return { ok: false, error: "customer_limit_reached" };
  if (result.duplicate) return { ok: false, error: "phoneExists" };

  await startCustomerSession(location.organizationId, result.customer.id);
  await setLocaleCookieIfMissing(locale);
  redirect(`/c/${slug}?bienvenida=1`);
}

export type AccessState = { ok: true } | { ok: false; error: string } | null;

export async function requestAccessLinkAction(
  slug: string,
  _prev: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const location = await getLocationBySlug(slug);
  if (!location) return { ok: false, error: "location_not_found" };
  if (!(await rateLimit("access-link-ip", 600, 5))) return { ok: false, error: "rateLimited" };
  const phone = normalizePhone(String(formData.get("phone") ?? ""), location.country);
  if (!phone) return { ok: false, error: "phoneInvalid" };
  const customer = await findCustomerByPhone(location.organizationId, phone);
  // Misma respuesta exista o no el número, para no revelar quién es cliente.
  if (customer && (await rateLimit("access-link", 3600, 3, phone))) await sendAccessLink(slug, customer);
  return { ok: true };
}

export type BonusState = { ok: true } | { ok: false; error: string } | null;

export async function requestBonusAction(slug: string, _prev: BonusState, formData: FormData): Promise<BonusState> {
  const location = await getLocationBySlug(slug);
  if (!location) return { ok: false, error: "location_not_found" };
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return { ok: false, error: "sessionExpired" };
  if (!planSpec(location.plan).bonuses) return { ok: false, error: "generic" };
  if (!(await rateLimit("bonus", 3600, 10, customer.id))) return { ok: false, error: "rateLimited" };

  const parsed = bonusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "generic" };
  try {
    await ledger.requestBonus(
      location.id,
      customer.id,
      parsed.data.type,
      parsed.data.handle ? { handle: parsed.data.handle } : {},
      `bonus:${customer.id}:${parsed.data.type}:${crypto.randomUUID()}`,
    );
    return { ok: true };
  } catch (e) {
    if (e instanceof BusinessError) return { ok: false, error: e.code };
    throw e;
  }
}

export async function updatePreferencesAction(
  slug: string,
  prefs: { locale?: string; marketingConsent?: boolean },
): Promise<ActionResult> {
  const location = await getLocationBySlug(slug);
  if (!location) return { ok: false, error: "location_not_found" };
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return { ok: false, error: "sessionExpired" };
  const parsed = preferencesSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false, error: "generic" };

  await updateCustomerPreferences(location.organizationId, customer.id, parsed.data);
  if (parsed.data.locale) {
    (await cookies()).set(LOCALE_COOKIE, parsed.data.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
    });
  }
  return { ok: true };
}

export async function signOutAction(slug: string) {
  const location = await getLocationBySlug(slug);
  if (location) await endCustomerSession(location.organizationId);
  redirect(`/c/${slug}`);
}

/** Quita de la tarjeta lo que el plan del local no incluye (los datos siguen guardados). */
function forPlan<T extends { levels: unknown[] }>(state: T, plan: EffectivePlan): T {
  return planSpec(plan).levels ? state : { ...state, levels: [] };
}

/** Estado actual de la tarjeta (para refrescar la PWA y animar sellos nuevos). */
export async function getCardStateAction(slug: string) {
  const location = await getLocationBySlug(slug);
  if (!location) return null;
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return null;
  return forPlan(await getCardState(customer.id, location.id), location.plan);
}

const pushSub = z.object({
  endpoint: z.string().url().max(600),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(5).max(100) }),
});

/** Guarda la suscripción de avisos web de este móvil. */
export async function subscribePushAction(slug: string, subscription: unknown) {
  const location = await getLocationBySlug(slug);
  if (!location) return { ok: false as const, error: "location_not_found" };
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return { ok: false as const, error: "sessionExpired" };
  if (planSpec(location.plan).notifications === 0) return { ok: false as const, error: "generic" };
  const parsed = pushSub.safeParse(subscription);
  if (!parsed.success) return { ok: false as const, error: "generic" };
  if (!(await rateLimit("push-sub", 3600, 20, customer.id))) return { ok: false as const, error: "rateLimited" };
  await savePushSubscription(location.organizationId, customer.id, {
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
  });
  return { ok: true as const };
}

export async function unsubscribePushAction(slug: string, endpoint: string) {
  const location = await getLocationBySlug(slug);
  if (!location) return { ok: false as const };
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return { ok: false as const };
  await deletePushSubscription(customer.id, String(endpoint).slice(0, 600));
  return { ok: true as const };
}
