import { describe, expect, it } from "vitest";
import { slugify } from "@/domain/slug";

describe("slugify", () => {
  it.each([
    ["Café Aurora", "cafe-aurora"],
    ["  Panadería  Sol!! ", "panaderia-sol"],
    ["Pasta & Pizza", "pasta-y-pizza"],
    ["Ñandú Café", "nandu-cafe"],
    ["La Esquina — Centro", "la-esquina-centro"],
  ])("%s → %s", (input, expected) => expect(slugify(input)).toBe(expected));

  it("devuelve vacío si es demasiado corto", () => {
    expect(slugify("ab")).toBe("");
    expect(slugify("!!")).toBe("");
  });

  it("recorta a 50 caracteres sin guion final", () => {
    const s = slugify("a".repeat(49) + " bbbb");
    expect(s.length).toBeLessThanOrEqual(50);
    expect(s.endsWith("-")).toBe(false);
  });
});
