import { describe, expect, it } from "vitest";
import { effectivePlan, trialDaysLeft, usageLevel } from "@/domain/plan";

const now = new Date("2026-10-22T10:00:00Z");

describe("effectivePlan", () => {
  it("pro siempre es pro", () => expect(effectivePlan({ plan: "pro", trialEndsAt: null }, now)).toBe("pro"));
  it("prueba en curso", () =>
    expect(effectivePlan({ plan: "trial", trialEndsAt: "2026-11-01T00:00:00Z" }, now)).toBe("trial"));
  it("prueba caducada pasa a gratis", () =>
    expect(effectivePlan({ plan: "trial", trialEndsAt: "2026-10-01T00:00:00Z" }, now)).toBe("free"));
  it("gratis y cancelado son gratis", () => {
    expect(effectivePlan({ plan: "free", trialEndsAt: null }, now)).toBe("free");
    expect(effectivePlan({ plan: "cancelled", trialEndsAt: null }, now)).toBe("free");
  });
});

describe("trialDaysLeft", () => {
  it("cuenta días hacia arriba y nunca baja de 0", () => {
    expect(trialDaysLeft("2026-10-23T09:00:00Z", now)).toBe(1);
    expect(trialDaysLeft("2026-10-01T00:00:00Z", now)).toBe(0);
    expect(trialDaysLeft(null, now)).toBe(0);
  });
});

describe("usageLevel", () => {
  it("avisa al 80 % y al llegar al límite", () => {
    expect(usageLevel(39, 50)).toBe("ok");
    expect(usageLevel(40, 50)).toBe("near");
    expect(usageLevel(50, 50)).toBe("full");
    expect(usageLevel(500, null)).toBe("ok");
  });
});
