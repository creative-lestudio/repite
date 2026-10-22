// Niveles VIP por número de visitas. Lógica pura.

export interface Level {
  name: string;
  /** Visitas totales necesarias para alcanzar el nivel. */
  visits: number;
  /** Ventaja del nivel (texto libre, opcional). */
  perk: string;
}

export const MAX_LEVELS = 3;

/** Lee los niveles guardados: descarta los inválidos y los ordena por visitas. */
export function parseLevels(raw: unknown): Level[] {
  if (!Array.isArray(raw)) return [];
  const out: Level[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const l = item as Record<string, unknown>;
    const name = typeof l.name === "string" ? l.name.trim().slice(0, 24) : "";
    const visits = Number(l.visits);
    if (!name || !Number.isInteger(visits) || visits < 1 || visits > 10_000) continue;
    out.push({ name, visits, perk: typeof l.perk === "string" ? l.perk.trim().slice(0, 80) : "" });
  }
  return out.sort((a, b) => a.visits - b.visits).slice(0, MAX_LEVELS);
}

/** Nivel más alto alcanzado con ese número de visitas (null si aún no llega al primero). */
export function currentLevel(levels: Level[], visits: number): Level | null {
  let best: Level | null = null;
  for (const l of levels) if (visits >= l.visits) best = l;
  return best;
}

/** Siguiente nivel y cuántas visitas faltan (null si ya está en el más alto). */
export function nextLevel(levels: Level[], visits: number): { level: Level; missing: number } | null {
  const next = levels.find((l) => visits < l.visits);
  return next ? { level: next, missing: next.visits - visits } : null;
}
