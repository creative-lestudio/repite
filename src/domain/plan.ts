import { PLAN, PLANS, type Customization, type PlanId, type PlanSpec } from "@/config/plan";

export type EffectivePlan = "trial" | PlanId;

/** Plan que aplica ahora mismo. Igual que app.effective_plan en la base de datos. */
export function effectivePlan(org: { plan: string; trialEndsAt: string | null }, now = new Date()): EffectivePlan {
  if (org.plan === "esencial" || org.plan === "growth") return org.plan;
  if (org.plan === "trial" && (!org.trialEndsAt || new Date(org.trialEndsAt) > now)) return "trial";
  return "starter";
}

/** Funciones y límites del plan efectivo (la prueba equivale al plan completo). */
export function planSpec(plan: EffectivePlan): PlanSpec {
  return PLANS[plan === "trial" ? PLAN.trialPlan : plan];
}

const LEVELS: Customization[] = ["color", "logo", "full"];

/** ¿El plan incluye al menos este nivel de personalización? */
export function allowsCustomization(plan: EffectivePlan, level: Customization): boolean {
  return LEVELS.indexOf(planSpec(plan).customization) >= LEVELS.indexOf(level);
}

/** Primer plan de pago que incluye un nivel de personalización (para sugerir la mejora). */
export function planFor(level: Customization): PlanId {
  return level === "color" ? "starter" : "esencial";
}

export function trialDaysLeft(trialEndsAt: string | null, now = new Date()): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86_400_000));
}

export type UsageLevel = "ok" | "near" | "full";

/** «near» a partir del 80 % del límite; «full» al llegar. Sin límite siempre «ok». */
export function usageLevel(used: number, limit: number | null): UsageLevel {
  if (limit === null) return "ok";
  if (used >= limit) return "full";
  return used >= Math.floor(limit * 0.8) ? "near" : "ok";
}

/** ¿Cabe uno más? */
export function hasRoom(used: number, limit: number | null): boolean {
  return limit === null || used < limit;
}
