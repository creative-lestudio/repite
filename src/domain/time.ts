/** Partes de fecha/hora de un instante en una zona horaria IANA. */
export function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Diferencia (ms) entre la hora local de la zona y UTC en ese instante. */
function offsetMs(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instante en que empezó el día local (00:00) en la zona horaria dada. */
export function startOfDayInZone(now: Date, timeZone: string): Date {
  const p = zonedParts(now, timeZone);
  const guess = Date.UTC(p.year, p.month - 1, p.day);
  // Dos pasadas para cubrir cambios de horario
  let ts = guess - offsetMs(new Date(guess), timeZone);
  ts = guess - offsetMs(new Date(ts), timeZone);
  return new Date(ts);
}

/** Fecha local YYYY-MM-DD en la zona horaria dada. */
export function localDate(now: Date, timeZone: string): string {
  const p = zonedParts(now, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
