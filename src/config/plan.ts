// Plan único de Repite. Los precios son un punto de partida y se cambian aquí (web pública y panel los leen de este archivo).
export const PLAN = {
  trialDays: 30,
  prices: { EUR: 19, USD: 19 },
} as const;

export function formatPrice(currency: "EUR" | "USD", locale = "es-ES") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(
    PLAN.prices[currency],
  );
}
