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
  it("esencial y growth son ellos mismos", () => {
    expect(effectivePlan({ plan: "esencial", trialEndsAt: null }, now)).toBe("esencial");
    expect(effectivePlan({ plan: "growth", trialEndsAt: null }, now)).toBe("growth");
  });
  it("los nombres antiguos ya no existen: caen en starter", () => {
    expect(effectivePlan({ plan: "basic", trialEndsAt: null }, now)).toBe("starter");
    expect(effectivePlan({ plan: "plus", trialEndsAt: null }, now)).toBe("starter");
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
  it("los límites y precios (en euros, IVA no incluido)", () => {
    expect(PLANS.starter.customers).toBe(50);
    expect(PLANS.esencial.customers).toBeNull();
    expect(PLANS.growth.customers).toBeNull();
    expect(PLANS.starter.price).toBe(0);
    expect(PLANS.esencial.price).toBe(25);
    expect(PLANS.growth.price).toBe(49);
    expect(PLANS.growth.staff).toBe(20);
  });

  it("la prueba da todo lo de growth", () => {
    expect(planSpec("trial")).toEqual(PLANS.growth);
  });

  it("cupones, niveles, notificaciones y métricas completas son de growth", () => {
    for (const p of ["starter", "esencial"] as const) {
      expect(PLANS[p].coupons).toBe(0);
      expect(PLANS[p].levels).toBe(false);
      expect(PLANS[p].notifications).toBe(0);
      expect(PLANS[p].fullMetrics).toBe(false);
    }
    expect(PLANS.growth.coupons).toBeNull();
    expect(PLANS.growth.levels).toBe(true);
    expect(PLANS.growth.notifications).toBe(20);
    expect(PLANS.growth.fullMetrics).toBe(true);
  });

  it("la personalización se desbloquea por niveles", () => {
    expect(allowsCustomization("starter", "color")).toBe(true);
    expect(allowsCustomization("starter", "logo")).toBe(false);
    expect(allowsCustomization("esencial", "logo")).toBe(true);
    expect(allowsCustomization("esencial", "full")).toBe(true);
    expect(allowsCustomization("growth", "full")).toBe(true);
    expect(allowsCustomization("trial", "full")).toBe(true);
  });

  it("indica qué plan desbloquea cada nivel", () => {
    expect(planFor("logo")).toBe("esencial");
    expect(planFor("full")).toBe("esencial");
  });

  it("solo starter muestra «Creado con Repite» y sin Wallet", () => {
    expect(PLANS.starter.poweredBy).toBe(true);
    expect(PLANS.esencial.poweredBy).toBe(false);
    expect(PLANS.starter.wallet).toBe(false);
    expect(PLANS.esencial.wallet).toBe(true);
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
