import { describe, expect, it } from "vitest";
import { estimateScenario } from "@/domain/estimator";

const base = {
  ticket: 10,
  marginPct: 50,
  extraVisits: 20,
  rewardCost: 2,
  rewardsPerMonth: 5,
  campaignCost: 0,
  subscription: 25,
};

describe("estimateScenario", () => {
  it("calcula ventas, margen, costes y resultado", () => {
    const r = estimateScenario(base);
    expect(r.extraSales).toBe(200);
    expect(r.extraMargin).toBe(100);
    expect(r.costs).toBe(35);
    expect(r.net).toBe(65);
    expect(r.breakEvenVisits).toBe(7);
  });
  it("sin visitas extra el resultado es negativo (no promete nada)", () => {
    expect(estimateScenario({ ...base, extraVisits: 0 }).net).toBe(-35);
  });
  it("sin margen no hay punto de equilibrio", () => {
    expect(estimateScenario({ ...base, marginPct: 0 }).breakEvenVisits).toBeNull();
  });
  it("ignora valores absurdos o no numéricos", () => {
    const r = estimateScenario({ ...base, ticket: Number.NaN, marginPct: 500, extraVisits: -3 });
    expect(r.extraSales).toBe(0);
    expect(r.extraMargin).toBe(0);
  });
});
