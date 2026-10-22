import { describe, expect, it } from "vitest";
import { localDate, startOfDayInZone } from "@/domain/time";

describe("startOfDayInZone", () => {
  it("Madrid en verano (UTC+2)", () => {
    expect(startOfDayInZone(new Date("2026-07-10T15:00:00Z"), "Europe/Madrid").toISOString()).toBe(
      "2026-07-09T22:00:00.000Z",
    );
  });
  it("Madrid en invierno (UTC+1)", () => {
    expect(startOfDayInZone(new Date("2026-01-10T00:30:00Z"), "Europe/Madrid").toISOString()).toBe(
      "2026-01-09T23:00:00.000Z",
    );
  });
  it("Caracas (UTC-4), de noche en UTC sigue siendo el día anterior en local", () => {
    expect(startOfDayInZone(new Date("2026-03-11T02:00:00Z"), "America/Caracas").toISOString()).toBe(
      "2026-03-10T04:00:00.000Z",
    );
  });
  it("día del cambio de hora en Madrid", () => {
    expect(startOfDayInZone(new Date("2026-03-29T12:00:00Z"), "Europe/Madrid").toISOString()).toBe(
      "2026-03-28T23:00:00.000Z",
    );
  });
});

describe("localDate", () => {
  it("usa la fecha local", () => {
    expect(localDate(new Date("2026-03-11T02:00:00Z"), "America/Caracas")).toBe("2026-03-10");
    expect(localDate(new Date("2026-03-11T02:00:00Z"), "Europe/Madrid")).toBe("2026-03-11");
  });
});
