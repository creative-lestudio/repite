import { describe, expect, it } from "vitest";
import { PLANS } from "@/config/plan";
import {
  allowsCustomization,
  effectivePlan,
  hasRoom,
  planFor,
  planSpec,
  trialDaysLeft,
  usageLevel,
} from "@/domain/plan";

const now = new Date("2026-10-22T10:00:00Z");

describe("effectivePlan", () => {
  it("basic y plus son ellos mismos", () => {
    expect(effectivePlan({ plan: "basic", trialEndsAt: null }, now)).toBe("basic");
    expect(effectivePlan({ plan: "plus", trialEndsAt: null }, now)).toBe("plus");
  });
  it("prueba en curso", () =>
    expect(effectivePlan({ plan: "trial", trialEndsAt: "2026-11-01T00:00:00Z" }, now)).toBe("trial"));
  it("prueba caducada pasa a starter", () =>
    expect(effectivePlan({ plan: "trial", trialEndsAt: "2026-10-01T00:00:00Z" }, now)).toBe("starter"));
  it("starter y cancelado son starter", () => {
    expect(effectivePlan({ plan: "starter", trialEndsAt: null }, now)).toBe("starter");
    expect(effectivePlan({ plan: "cancelled", trialEndsAt: null }, now)).toBe("starter");
  });
});

describe("funciones por plan", () => {
  it("los límites crecen con el plan", () => {
    expect(PLANS.starter.customers).toBe(50);
    expect(PLANS.basic.customers).toBe(100);
    expect(PLANS.plus.customers).toBeNull();
    expect(PLANS.basic.price).toEqual({ EUR: 25, USD: 20 });
    expect(PLANS.plus.price).toEqual({ EUR: 50, USD: 40 });
  });

  it("la prueba da todo lo de plus", () => {
    expect(planSpec("trial")).toEqual(PLANS.plus);
  });

  it("la personalización se desbloquea por niveles", () => {
    expect(allowsCustomization("starter", "color")).toBe(true);
    expect(allowsCustomization("starter", "logo")).toBe(false);
    expect(allowsCustomization("basic", "logo")).toBe(true);
    expect(allowsCustomization("basic", "full")).toBe(false);
    expect(allowsCustomization("plus", "full")).toBe(true);
    expect(allowsCustomization("trial", "full")).toBe(true);
  });

  it("indica qué plan desbloquea cada nivel", () => {
    expect(planFor("logo")).toBe("basic");
    expect(planFor("full")).toBe("plus");
  });

  it("solo starter muestra «Creado con Repite» y sin Wallet", () => {
    expect(PLANS.starter.poweredBy).toBe(true);
    expect(PLANS.basic.poweredBy).toBe(false);
    expect(PLANS.starter.wallet).toBe(false);
    expect(PLANS.basic.wallet).toBe(true);
  });
});

describe("trialDaysLeft", () => {
  it("cuenta días hacia arriba y nunca baja de 0", () => {
    expect(trialDaysLeft("2026-10-23T09:00:00Z", now)).toBe(1);
    expect(trialDaysLeft("2026-10-01T00:00:00Z", now)).toBe(0);
    expect(trialDaysLeft(null, now)).toBe(0);
  });
});

describe("usageLevel y hasRoom", () => {
  it("avisa al 80 % y al llegar al límite", () => {
    expect(usageLevel(39, 50)).toBe("ok");
    expect(usageLevel(40, 50)).toBe("near");
    expect(usageLevel(50, 50)).toBe("full");
    expect(usageLevel(10_000, null)).toBe("ok");
  });
  it("cabe uno más mientras no se llegue al límite", () => {
    expect(hasRoom(1, 2)).toBe(true);
    expect(hasRoom(2, 2)).toBe(false);
    expect(hasRoom(999, null)).toBe(true);
  });
});
