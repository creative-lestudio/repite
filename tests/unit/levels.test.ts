import { describe, expect, it } from "vitest";
import { currentLevel, nextLevel, parseLevels } from "@/domain/levels";

const levels = parseLevels([
  { name: "Oro", visits: 25, perk: "Postre gratis" },
  { name: "Plata", visits: 10, perk: "" },
  { name: "", visits: 5 },
  { name: "Roto", visits: -3 },
  "basura",
]);

describe("niveles VIP", () => {
  it("descarta los inválidos y ordena por visitas", () => {
    expect(levels.map((l) => l.name)).toEqual(["Plata", "Oro"]);
    expect(parseLevels(null)).toEqual([]);
  });
  it("calcula el nivel actual", () => {
    expect(currentLevel(levels, 3)).toBeNull();
    expect(currentLevel(levels, 10)?.name).toBe("Plata");
    expect(currentLevel(levels, 99)?.name).toBe("Oro");
  });
  it("calcula cuánto falta para el siguiente", () => {
    expect(nextLevel(levels, 4)).toMatchObject({ level: { name: "Plata" }, missing: 6 });
    expect(nextLevel(levels, 12)).toMatchObject({ level: { name: "Oro" }, missing: 13 });
    expect(nextLevel(levels, 30)).toBeNull();
  });
});
