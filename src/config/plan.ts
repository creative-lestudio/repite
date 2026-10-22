// Planes de Repite. Única fuente de verdad: la web pública, el panel y los límites leen de aquí.
// El límite de clientes también vive en la base de datos (app.customer_limit): si lo cambias aquí, cambia allí.
export type PlanId = "starter" | "basic" | "plus";

/** Nivel de personalización de la marca que incluye el plan. */
export type Customization = "color" | "logo" | "full";

export interface PlanSpec {
  id: PlanId;
  /** Precio mensual por moneda (0 = gratis). */
  price: { EUR: number; USD: number };
  /** null = sin límite */
  customers: number | null;
  staff: number | null;
  devices: number | null;
  customization: Customization;
  wallet: boolean;
  bonuses: boolean;
  /** Cupones activos a la vez (0 = no hay; null = sin límite). */
  coupons: number | null;
  /** Niveles VIP. */
  levels: boolean;
  /** Aviso en la pantalla de bloqueo al estar cerca del local. */
  proximity: boolean;
  /** Notificaciones al móvil: envíos al mes (0 = no incluidas; null = sin límite). */
  notifications: number | null;
  /** Segmentos avanzados (premio a punto, nivel VIP, frecuentes…). */
  advancedSegments: boolean;
  /** Guardar plantillas propias. */
  customTemplates: boolean;
  /** Muestra «Creado con Repite» en la tarjeta del cliente. */
  poweredBy: boolean;
}

export const PLANS: Record<PlanId, PlanSpec> = {
  starter: {
    id: "starter",
    price: { EUR: 0, USD: 0 },
    customers: 50,
    staff: 2,
    devices: 1,
    customization: "color",
    wallet: false,
    bonuses: false,
    coupons: 0,
    levels: false,
    proximity: false,
    notifications: 0,
    advancedSegments: false,
    customTemplates: false,
    poweredBy: true,
  },
  basic: {
    id: "basic",
    price: { EUR: 25, USD: 20 },
    customers: 100,
    staff: 5,
    devices: 2,
    customization: "logo",
    wallet: true,
    bonuses: true,
    coupons: 1,
    levels: false,
    proximity: false,
    notifications: 4,
    advancedSegments: false,
    customTemplates: false,
    poweredBy: false,
  },
  plus: {
    id: "plus",
    price: { EUR: 50, USD: 40 },
    customers: null,
    staff: null,
    devices: null,
    customization: "full",
    wallet: true,
    bonuses: true,
    coupons: null,
    levels: true,
    proximity: true,
    notifications: null,
    advancedSegments: true,
    customTemplates: true,
    poweredBy: false,
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "basic", "plus"];

export const PLAN = {
  trialDays: 30,
  /** Durante la prueba se disfruta todo lo de este plan. */
  trialPlan: "plus" as PlanId,
} as const;

export function formatPrice(currency: "EUR" | "USD", plan: PlanId, locale = "es-ES") {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(
    PLANS[plan].price[currency],
  );
}

/** Valor de una fila de la comparativa: sí/no, un número, «sin límite» o una clave de texto (`plans.values.<clave>`). */
export type Cell = boolean | number | "unlimited" | string;

export interface MatrixRow {
  key: string;
  starter: Cell;
  basic: Cell;
  plus: Cell;
  /** Aún no está disponible: se muestra con la etiqueta «Próximamente». */
  soon?: boolean;
}

export interface MatrixGroup {
  key: string;
  rows: MatrixRow[];
}

/** Comparativa de funciones por plan (web pública y panel). Las etiquetas están en `messages > plans.features`. */
export const MATRIX: MatrixGroup[] = [
  {
    key: "base",
    rows: [
      { key: "customers", starter: 50, basic: 100, plus: "unlimited" },
      { key: "staff", starter: 2, basic: 5, plus: "unlimited" },
      { key: "devices", starter: 1, basic: 2, plus: "unlimited" },
      { key: "qr", starter: true, basic: true, plus: true },
      { key: "csv", starter: true, basic: true, plus: true },
    ],
  },
  {
    key: "brand",
    rows: [
      { key: "nameColor", starter: true, basic: true, plus: true },
      { key: "logo", starter: false, basic: true, plus: true },
      { key: "icon", starter: false, basic: true, plus: true },
      { key: "noBadge", starter: false, basic: true, plus: true },
      { key: "font", starter: false, basic: false, plus: true },
      { key: "shapes", starter: false, basic: false, plus: true },
      { key: "cardStyles", starter: false, basic: false, plus: true },
      { key: "customCard", starter: false, basic: false, plus: true },
    ],
  },
  {
    key: "loyalty",
    rows: [
      { key: "wallet", starter: false, basic: true, plus: true },
      { key: "bonuses", starter: false, basic: true, plus: true },
      { key: "coupons", starter: false, basic: 1, plus: "unlimited" },
      { key: "levels", starter: false, basic: false, plus: true },
      { key: "proximity", starter: false, basic: false, plus: true },
      { key: "notifications", starter: false, basic: 4, plus: "unlimited" },
      { key: "segments", starter: false, basic: "basic", plus: "all" },
      { key: "templates", starter: false, basic: "repite", plus: "custom" },
      { key: "metrics", starter: "summary", basic: "summary", plus: "full" },
    ],
  },
  {
    key: "support",
    rows: [{ key: "support", starter: "guides", basic: "email", plus: "priority" }],
  },
];

/** Cuántas visitas extra al mes pagan el plan, con un ticket medio (para explicar el precio). */
export function breakEvenVisits(plan: PlanId, currency: "EUR" | "USD", ticket: number): number {
  return ticket > 0 ? Math.ceil(PLANS[plan].price[currency] / ticket) : 0;
}
