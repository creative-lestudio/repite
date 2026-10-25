// Planes de Repite. Única fuente de verdad: la web pública, el panel y los límites leen de aquí.
// El límite de clientes también vive en la base de datos (app.customer_limit): si lo cambias aquí, cambia allí.
export type PlanId = "starter" | "esencial" | "growth";

/** Nivel de personalización de la marca que incluye el plan. */
export type Customization = "color" | "logo" | "full";

export interface PlanSpec {
  id: PlanId;
  /** Precio mensual en euros, IVA no incluido (0 = gratis). */
  price: number;
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
  /** Resultados con detalle y comparación con el periodo anterior. */
  fullMetrics: boolean;
  /** Muestra «Creado con Repite» en la tarjeta del cliente. */
  poweredBy: boolean;
}

export const PLANS: Record<PlanId, PlanSpec> = {
  starter: {
    id: "starter",
    price: 0,
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
    fullMetrics: false,
    poweredBy: true,
  },
  esencial: {
    id: "esencial",
    price: 25,
    customers: null,
    staff: 5,
    devices: 2,
    customization: "full",
    wallet: true,
    bonuses: true,
    coupons: 0,
    levels: false,
    proximity: false,
    notifications: 0,
    advancedSegments: false,
    customTemplates: false,
    fullMetrics: false,
    poweredBy: false,
  },
  growth: {
    id: "growth",
    price: 49,
    customers: null,
    staff: 20,
    devices: 5,
    customization: "full",
    wallet: true,
    bonuses: true,
    coupons: null,
    levels: true,
    proximity: true,
    notifications: 20,
    advancedSegments: true,
    customTemplates: true,
    fullMetrics: true,
    poweredBy: false,
  },
};

export const PLAN_ORDER: PlanId[] = ["starter", "esencial", "growth"];

export const PLAN = {
  trialDays: 30,
  /** Durante la prueba (sin tarjeta) se disfruta todo lo de este plan; al acabar vuelve a Starter. */
  trialPlan: "growth" as PlanId,
} as const;

export function formatPrice(plan: PlanId, locale = "es-ES") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    PLANS[plan].price,
  );
}

/** Valor de una fila de la comparativa: sí/no, un número, «sin límite» o una clave de texto (`plans.values.<clave>`). */
export type Cell = boolean | number | "unlimited" | string;

export interface MatrixRow {
  key: string;
  starter: Cell;
  esencial: Cell;
  growth: Cell;
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
      { key: "customers", starter: 50, esencial: "unlimited", growth: "unlimited" },
      { key: "staff", starter: 2, esencial: 5, growth: 20 },
      { key: "devices", starter: 1, esencial: 2, growth: 5 },
      { key: "qr", starter: true, esencial: true, growth: true },
      { key: "csv", starter: true, esencial: true, growth: true },
    ],
  },
  {
    key: "brand",
    rows: [
      { key: "nameColor", starter: true, esencial: true, growth: true },
      { key: "logo", starter: false, esencial: true, growth: true },
      { key: "icon", starter: false, esencial: true, growth: true },
      { key: "noBadge", starter: false, esencial: true, growth: true },
      { key: "font", starter: false, esencial: true, growth: true },
      { key: "shapes", starter: false, esencial: true, growth: true },
      { key: "cardStyles", starter: false, esencial: true, growth: true },
      { key: "customCard", starter: false, esencial: true, growth: true },
    ],
  },
  {
    key: "loyalty",
    rows: [
      { key: "wallet", starter: false, esencial: true, growth: true, soon: true },
      { key: "bonuses", starter: false, esencial: true, growth: true },
      { key: "coupons", starter: false, esencial: false, growth: "unlimited" },
      { key: "levels", starter: false, esencial: false, growth: true },
      { key: "proximity", starter: false, esencial: false, growth: true, soon: true },
      { key: "notifications", starter: false, esencial: false, growth: 20 },
      { key: "segments", starter: false, esencial: false, growth: "all" },
      { key: "templates", starter: false, esencial: false, growth: "custom" },
      { key: "metrics", starter: "summary", esencial: "summary", growth: "full" },
    ],
  },
  {
    key: "support",
    rows: [{ key: "support", starter: "guides", esencial: "email", growth: "priority" }],
  },
];

/** Cuántas visitas extra al mes pagan el plan, con un ticket medio (para explicar el precio). */
export function breakEvenVisits(plan: PlanId, ticket: number): number {
  return ticket > 0 ? Math.ceil(PLANS[plan].price / ticket) : 0;
}
