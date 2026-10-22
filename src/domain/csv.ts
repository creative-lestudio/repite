/** Una celda de CSV segura: comillas escapadas y protección contra fórmulas de Excel (= + - @). */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV con separador «;» (Excel en español) y BOM UTF-8 para que se vean bien las tildes. */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
