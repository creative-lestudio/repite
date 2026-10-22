import { describe, expect, it } from "vitest";
import {
  BUILTIN_TEMPLATES,
  contentSchema,
  isSegmentAllowed,
  monthStartISO,
  renderNotification,
  SAMPLE_VARS,
  segmentSchema,
  toSqlSegment,
} from "@/domain/notifications";

describe("notificaciones", () => {
  it("rellena las variables y deja las desconocidas", () => {
    expect(
      renderNotification("Hola {nombre}, te faltan {faltan} en {local} {raro}", {
        nombre: "Ana",
        faltan: 2,
        local: "Aurora",
      }),
    ).toBe("Hola Ana, te faltan 2 en Aurora {raro}");
  });

  it("todas las plantillas de Repite caben en los límites y se rellenan con datos de ejemplo", () => {
    for (const t of BUILTIN_TEMPLATES) {
      expect(
        contentSchema.safeParse({
          title: renderNotification(t.title, SAMPLE_VARS),
          body: renderNotification(t.body, SAMPLE_VARS),
        }).success,
      ).toBe(true);
      expect(segmentSchema.safeParse(t.segment).success).toBe(true);
    }
  });

  it("valida el contenido", () => {
    expect(contentSchema.safeParse({ title: "", body: "x" }).success).toBe(false);
    expect(contentSchema.safeParse({ title: "x".repeat(41), body: "x" }).success).toBe(false);
    expect(contentSchema.safeParse({ title: "Hola", body: "x".repeat(161) }).success).toBe(false);
  });

  it("segmentos: valores por defecto y permisos por plan", () => {
    expect(segmentSchema.parse({ type: "inactive" })).toEqual({ type: "inactive", value: 30 });
    expect(segmentSchema.parse({ type: "all" })).toEqual({ type: "all", value: undefined });
    expect(segmentSchema.safeParse({ type: "inventado" }).success).toBe(false);
    expect(isSegmentAllowed("inactive", false)).toBe(true);
    expect(isSegmentAllowed("near_reward", false)).toBe(false);
    expect(isSegmentAllowed("near_reward", true)).toBe(true);
  });

  it("el nivel se traduce a visitas", () => {
    const levels = [{ name: "Plata", visits: 10, perk: "" }];
    expect(toSqlSegment({ type: "level", value: 1 }, levels)).toEqual({ type: "frequent", value: 10 });
    expect(toSqlSegment({ type: "level", value: 2 }, levels)).toBeNull();
    expect(toSqlSegment({ type: "inactive", value: 5 }, levels)).toEqual({ type: "inactive", value: 5 });
  });

  it("inicio de mes", () => {
    expect(monthStartISO(new Date("2026-10-22T10:00:00Z"), "Europe/Madrid")).toBe("2026-10-01T00:00:00.000Z");
  });
});
