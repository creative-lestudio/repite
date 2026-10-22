/** Extrae el token de un QR personal de Repite (…/equipo/q/<32 hex>) o null si no lo es. */
export function parseCustomerQr(text: string): string | null {
  const m = text.trim().match(/\/equipo\/q\/([a-f0-9]{32})(?:[/?#]|$)/);
  return m ? m[1] : null;
}
