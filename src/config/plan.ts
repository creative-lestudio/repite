// Planes de Repite. Los precios son un punto de partida y se cambian aquí (web pública y panel los leen de este archivo).
// El límite de clientes del plan Gratis también está en la base de datos (app.customer_limit): si lo cambias aquí, cambia allí.
export const PLAN = {
  trialDays: 30,
  freeCustomerLimit: 50,
  prices: { EUR: 19, USD: 19 },
} as const;

export function formatPrice(currency: "EUR" | "USD", locale = "es-ES") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(
    PLAN.prices[currency],
  );
}
