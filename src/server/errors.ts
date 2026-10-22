import type { PostgrestError } from "@supabase/supabase-js";

/** Códigos de negocio que lanzan las funciones Postgres (app.fail) y que tienen texto en messages > errors. */
export const BUSINESS_ERRORS = [
  "cooldown",
  "location_not_found",
  "customer_not_found",
  "no_active_program",
  "already_undone",
  "undo_window_passed",
  "reward_already_redeemed",
  "reward_not_available",
  "reward_not_found",
  "bonus_already_pending",
  "bonus_review_already_given",
  "bonus_disabled",
  "already_validated",
  "event_not_found",
  "invalid_pin",
  "slug_taken",
  "already_has_organization",
  "not_authenticated",
  "customer_limit_reached",
  "coupon_not_found",
  "coupon_already_redeemed",
  "coupon_expired",
] as const;
export type BusinessErrorCode = (typeof BUSINESS_ERRORS)[number];

export class BusinessError extends Error {
  constructor(
    public readonly code: BusinessErrorCode,
    public readonly detail: Record<string, unknown> = {},
  ) {
    super(code);
  }
}

/** Convierte un error de PostgREST en BusinessError si es un error de negocio conocido. */
export function toBusinessError(error: PostgrestError): BusinessError | null {
  if (error.code !== "P0001") return null;
  const code = BUSINESS_ERRORS.find((c) => c === error.message);
  if (!code) return null;
  let detail: Record<string, unknown> = {};
  try {
    detail = error.details ? JSON.parse(error.details) : {};
  } catch {
    detail = {};
  }
  return new BusinessError(code, detail);
}

/** Resultado de una Server Action: o datos, o una clave de errores.* lista para traducir. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; values?: Record<string, string | number>; fields?: Record<string, string> };
