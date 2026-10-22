// Notificaciones al móvil de los clientes: segmentos, variables y plantillas. Lógica pura.
import { z } from "zod";
import type { Level } from "./levels";

export const SEGMENT_TYPES = [
  "all",
  "new",
  "inactive",
  "birthday_month",
  "near_reward",
  "reward_ready",
  "frequent",
  "level",
  "has_coupon",
] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

/** Segmentos que incluye el plan Basic; el resto es de Plus. */
export const BASIC_SEGMENTS: SegmentType[] = ["all", "new", "inactive", "birthday_month"];

export const SEGMENT_DEFAULT_VALUE: Partial<Record<SegmentType, number>> = {
  new: 7,
  inactive: 30,
  near_reward: 1,
  frequent: 10,
  level: 1,
};

export interface Segment {
  type: SegmentType;
  /** Días (new/inactive), sellos que faltan (near_reward), visitas (frequent) o nº de nivel (level). */
  value?: number;
}

export const segmentSchema = z
  .object({ type: z.enum(SEGMENT_TYPES), value: z.coerce.number().int().min(1).max(3650).optional() })
  .transform((s): Segment => ({ type: s.type, value: s.value ?? SEGMENT_DEFAULT_VALUE[s.type] }));

export const needsValue = (t: SegmentType) => t in SEGMENT_DEFAULT_VALUE;

export function isSegmentAllowed(type: SegmentType, advanced: boolean): boolean {
  return advanced || BASIC_SEGMENTS.includes(type);
}

/** Segmento que entiende la base de datos: «level» se convierte en «frequent» con las visitas del nivel. */
export function toSqlSegment(seg: Segment, levels: Level[]): { type: string; value?: number } | null {
  if (seg.type !== "level") return { type: seg.type, value: seg.value };
  const level = levels[(seg.value ?? 1) - 1];
  return level ? { type: "frequent", value: level.visits } : null;
}

// ── Variables ──

export const VARIABLES = ["nombre", "local", "sellos", "faltan", "premio"] as const;
export type Variable = (typeof VARIABLES)[number];

export function renderNotification(text: string, vars: Partial<Record<Variable, string | number>>): string {
  return text
    .replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k as Variable] ?? "") : m))
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Datos de ejemplo para la vista previa. */
export const SAMPLE_VARS: Record<Variable, string | number> = {
  nombre: "María",
  local: "Café Aurora",
  sellos: 5,
  faltan: 3,
  premio: "Un café gratis",
};

export const TITLE_MAX = 40;
export const BODY_MAX = 160;

export const contentSchema = z.object({
  title: z.string().trim().min(1, "notifTitleRequired").max(TITLE_MAX),
  body: z.string().trim().min(1, "notifBodyRequired").max(BODY_MAX),
});

// ── Plantillas de Repite ──

export interface BuiltinTemplate {
  id: string;
  title: string;
  body: string;
  segment: Segment;
}

/** Los textos visibles (nombre de la plantilla) están en messages > owner.notifications.builtin. */
export const BUILTIN_TEMPLATES: BuiltinTemplate[] = [
  {
    id: "miss",
    title: "Te echamos de menos",
    body: "Hola {nombre}, hace tiempo que no te vemos por {local}. Ven esta semana y sigue sumando sellos.",
    segment: { type: "inactive", value: 30 },
  },
  {
    id: "birthday",
    title: "¡Feliz cumpleaños, {nombre}!",
    body: "En {local} tienes una sorpresa esperándote este mes. ¡Pásate a celebrarlo!",
    segment: { type: "birthday_month" },
  },
  {
    id: "almost",
    title: "Te falta poco",
    body: "{nombre}, te faltan solo {faltan} sellos para {premio}. ¡Te esperamos en {local}!",
    segment: { type: "near_reward", value: 1 },
  },
  {
    id: "reward",
    title: "Tu premio te espera",
    body: "{nombre}, tu {premio} está listo en {local}. Enseña tu tarjeta y es tuyo.",
    segment: { type: "reward_ready" },
  },
  {
    id: "welcome",
    title: "Gracias por unirte",
    body: "Bienvenido a {local}, {nombre}. Tu próxima visita ya suma. ¡Nos vemos pronto!",
    segment: { type: "new", value: 7 },
  },
  {
    id: "promo",
    title: "Hoy en {local}",
    body: "Escribe aquí tu promoción del día. ¡Te esperamos, {nombre}!",
    segment: { type: "all" },
  },
];

/** Inicio del mes en curso en la zona horaria del local (para contar los envíos del mes). */
export function monthStartISO(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  // Aproximación suficiente: primer día del mes a las 00:00 UTC (el desfase horario es de horas)
  return new Date(`${y}-${m}-01T00:00:00Z`).toISOString();
}
