import type { ZodError } from "zod";

/** Primer error de cada campo de un formulario: { campo: "claveDeError" }. */
export function zodFields(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[String(i.path[0])] ??= i.message;
  return fields;
}
