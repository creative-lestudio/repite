import { describe, expect, it } from "vitest";
import { estimatedRevenue, parseMetrics, pctChange, peakHour, returnRate, visitsPerCustomer } from "@/domain/metrics";

describe("resultados", () => {
  it("tasa de retorno", () => {
    expect(returnRate({ activeCustomers: 10, returningCustomers: 7 })).toBe(70);
    expect(returnRate({ activeCustomers: 0, returningCustomers: 0 })).toBe(0);
  });

  it("cambio frente al periodo anterior", () => {
    expect(pctChange(120, 100)).toBe(20);
    expect(pctChange(50, 100)).toBe(-50);
    expect(pctChange(10, 0)).toBeNull();
  });

  it("ingresos estimados solo con ticket medio", () => {
    expect(estimatedRevenue(28, 7)).toBe(196);
    expect(estimatedRevenue(28, null)).toBeNull();
    expect(estimatedRevenue(28, 0)).toBeNull();
  });

  it("visitas por cliente y hora punta", () => {
    expect(visitsPerCustomer({ visits: 34, activeCustomers: 6 })).toBe(5.7);
    expect(
      peakHour([
        { hour: 9, visits: 3 },
        { hour: 10, visits: 8 },
        { hour: 11, visits: 8 },
      ]),
    ).toBe(10);
    expect(peakHour([{ hour: 9, visits: 0 }])).toBeNull();
  });

  it("lee la respuesta de la base de datos", () => {
    const m = parseMetrics({ days: 30, visits: 5, active_customers: 2, daily: [{ day: "2026-10-01", visits: 1 }] });
    expect(m.visits).toBe(5);
    expect(m.activeCustomers).toBe(2);
    expect(m.daily).toHaveLength(1);
    expect(m.byHour).toEqual([]);
  });
});
