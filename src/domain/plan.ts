export type EffectivePlan = "trial" | "free" | "pro";

/** Plan que aplica ahora mismo. Igual que app.effective_plan en la base de datos. */
export function effectivePlan(org: { plan: string; trialEndsAt: string | null }, now = new Date()): EffectivePlan {
  if (org.plan === "pro") return "pro";
  if (org.plan === "trial" && (!org.trialEndsAt || new Date(org.trialEndsAt) > now)) return "trial";
  return "free";
}

export function trialDaysLeft(trialEndsAt: string | null, now = new Date()): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now.getTime()) / 86_400_000));
}

export type UsageLevel = "ok" | "near" | "full";

/** «near» a partir del 80 % del límite; «full» al llegar. Sin límite siempre «ok». */
export function usageLevel(customers: number, limit: number | null): UsageLevel {
  if (limit === null) return "ok";
  if (customers >= limit) return "full";
  return customers >= Math.floor(limit * 0.8) ? "near" : "ok";
}
