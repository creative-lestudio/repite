// Cálculos de la pantalla de resultados. Lógica pura; los números salen de public.owner_metrics.

export interface Metrics {
  days: number;
  visits: number;
  visitsPrev: number;
  activeCustomers: number;
  activeCustomersPrev: number;
  returningCustomers: number;
  repeatVisits: number;
  repeatVisitsPrev: number;
  newCustomers: number;
  newCustomersPrev: number;
  rewardsIssued: number;
  rewardsRedeemed: number;
  daily: { day: string; visits: number }[];
  byHour: { hour: number; visits: number }[];
}

/** % de clientes activos que ya habían venido antes (0–100). */
export function returnRate(m: Pick<Metrics, "activeCustomers" | "returningCustomers">): number {
  return m.activeCustomers > 0 ? Math.round((m.returningCustomers / m.activeCustomers) * 100) : 0;
}

/** Cambio porcentual frente al periodo anterior; null si no hay con qué comparar. */
export function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Ingresos estimados de las visitas de repetición (cada una a un ticket medio). */
export function estimatedRevenue(repeatVisits: number, ticket: number | null | undefined): number | null {
  return ticket && ticket > 0 ? Math.round(repeatVisits * ticket * 100) / 100 : null;
}

export function visitsPerCustomer(m: Pick<Metrics, "visits" | "activeCustomers">): number {
  return m.activeCustomers > 0 ? Math.round((m.visits / m.activeCustomers) * 10) / 10 : 0;
}

/** Hora con más visitas (null si no hay ninguna). */
export function peakHour(byHour: Metrics["byHour"]): number | null {
  let best: { hour: number; visits: number } | null = null;
  for (const h of byHour) if (h.visits > 0 && (!best || h.visits > best.visits)) best = h;
  return best?.hour ?? null;
}

export function parseMetrics(raw: Record<string, unknown>): Metrics {
  const n = (k: string) => Number(raw[k] ?? 0);
  return {
    days: n("days"),
    visits: n("visits"),
    visitsPrev: n("visits_prev"),
    activeCustomers: n("active_customers"),
    activeCustomersPrev: n("active_customers_prev"),
    returningCustomers: n("returning_customers"),
    repeatVisits: n("repeat_visits"),
    repeatVisitsPrev: n("repeat_visits_prev"),
    newCustomers: n("new_customers"),
    newCustomersPrev: n("new_customers_prev"),
    rewardsIssued: n("rewards_issued"),
    rewardsRedeemed: n("rewards_redeemed"),
    daily: (raw.daily as Metrics["daily"]) ?? [],
    byHour: (raw.by_hour as Metrics["byHour"]) ?? [],
  };
}
