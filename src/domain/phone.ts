export type Country = "ES" | "VE";

/**
 * Normaliza un teléfono a E.164 usando el país del local como pista.
 * ES: 9 dígitos (6xx, 7xx, 8xx, 9xx) → +34 · VE: 04xx-xxx-xxxx o 4xx-xxx-xxxx → +58
 * Devuelve null si no parece un número válido.
 */
export function normalizePhone(raw: string, country: Country): string | null {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;

  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    if (trimmed.startsWith("00")) digits = digits.slice(2);
    return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
  }

  if (country === "ES") {
    if (/^34[6-9]\d{8}$/.test(digits)) return `+${digits}`;
    if (/^[6-9]\d{8}$/.test(digits)) return `+34${digits}`;
    return null;
  }

  // Venezuela
  if (/^58[24]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[24]\d{9}$/.test(digits)) return `+58${digits.slice(1)}`;
  if (/^[24]\d{9}$/.test(digits)) return `+58${digits}`;
  return null;
}

/** Muestra el teléfono de forma legible y parcialmente oculto: +34 ••• ••• 111 */
export function maskPhone(e164: string): string {
  const last = e164.slice(-3);
  const cc = e164.startsWith("+58") ? "+58" : e164.startsWith("+34") ? "+34" : e164.slice(0, 3);
  return `${cc} ••• ••• ${last}`;
}
