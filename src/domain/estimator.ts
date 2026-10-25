// Estimador de escenarios HIPOTÉTICOS: el dueño pone sus propias cifras y ve qué saldría.
// No predice resultados: las visitas extra son una hipótesis suya, no un dato de Repite.

export interface ScenarioInput {
  /** Ticket medio por visita (€). */
  ticket: number;
  /** Margen sobre cada venta (0–100 %). */
  marginPct: number;
  /** Visitas extra al mes que supone (hipótesis). */
  extraVisits: number;
  /** Coste de cada premio para el local (€). */
  rewardCost: number;
  /** Premios entregados al mes. */
  rewardsPerMonth: number;
  /** Coste de campañas al mes (€). */
  campaignCost: number;
  /** Cuota mensual del plan (€, IVA no incluido). */
  subscription: number;
}

export interface ScenarioResult {
  extraSales: number;
  extraMargin: number;
  costs: number;
  net: number;
  /** Visitas extra al mes necesarias para cubrir los costes; null si no hay margen por visita. */
  breakEvenVisits: number | null;
}

const clamp = (n: number, min: number, max: number) => (Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);

export function estimateScenario(input: ScenarioInput): ScenarioResult {
  const ticket = clamp(input.ticket, 0, 10_000);
  const margin = clamp(input.marginPct, 0, 100) / 100;
  const visits = clamp(input.extraVisits, 0, 1_000_000);
  const costs =
    clamp(input.rewardCost, 0, 10_000) * clamp(input.rewardsPerMonth, 0, 1_000_000) +
    clamp(input.campaignCost, 0, 1_000_000) +
    clamp(input.subscription, 0, 100_000);
  const extraSales = visits * ticket;
  const extraMargin = extraSales * margin;
  const perVisit = ticket * margin;
  return {
    extraSales,
    extraMargin,
    costs,
    net: extraMargin - costs,
    breakEvenVisits: perVisit > 0 ? Math.ceil(costs / perVisit) : null,
  };
}
