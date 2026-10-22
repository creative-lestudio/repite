import { describe, expect, it } from "vitest";
import { asBusinessType, BUSINESS_PRESETS, BUSINESS_TYPES, isBusinessType } from "@/domain/business-types";

describe("business types", () => {
  it("todos los tipos tienen preset completo", () => {
    for (const t of BUSINESS_TYPES) {
      expect(BUSINESS_PRESETS[t].stamps).toBeGreaterThanOrEqual(3);
      expect(BUSINESS_PRESETS[t].fallbackWord["es-ES"]).toBeTruthy();
      expect(BUSINESS_PRESETS[t].fallbackWord["es-VE"]).toBeTruthy();
    }
  });
  it("valida y normaliza", () => {
    expect(isBusinessType("heladeria")).toBe(true);
    expect(isBusinessType("peluqueria")).toBe(false);
    expect(asBusinessType("restaurante")).toBe("restaurante");
    expect(asBusinessType(undefined)).toBe("otro");
    expect(asBusinessType("raro")).toBe("otro");
  });
});
