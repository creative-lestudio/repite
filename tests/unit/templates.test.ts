import { describe, expect, it } from "vitest";
import { cardView } from "@/domain/loyalty";
import { firstName, renderTemplate } from "@/domain/templates";

describe("renderTemplate", () => {
  it("sustituye variables", () => {
    expect(
      renderTemplate("Hola, {{nombre}}. Te esperamos en {{ local }}!", { nombre: "María", local: "Café Aurora" }),
    ).toBe("Hola, María. Te esperamos en Café Aurora!");
  });
  it("elimina variables vacías sin dejar espacios raros", () => {
    expect(renderTemplate("Hola {{nombre}} , ¿un {{pedido}}?", { nombre: "Ana" })).toBe("Hola Ana, ¿un?");
  });
});

describe("firstName", () => {
  it("devuelve el primer nombre", () => expect(firstName("  María López ")).toBe("María"));
});

describe("cardView", () => {
  it("calcula sellos restantes y premio cercano", () => {
    expect(cardView(7, 8)).toEqual({ filled: 7, total: 8, left: 1, nearReward: true });
    expect(cardView(12, 8).filled).toBe(8);
    expect(cardView(-1, 8).filled).toBe(0);
  });
});
