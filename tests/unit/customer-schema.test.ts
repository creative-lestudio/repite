import { describe, expect, it } from "vitest";
import { birthdayToDate, signupSchema } from "@/lib/schemas/customer";

describe("signupSchema", () => {
  it("acepta registro mínimo sin cumpleaños ni consentimiento", () => {
    const r = signupSchema.safeParse({ name: " Ana ", phone: "611111111", birthDay: "", birthMonth: "" });
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({ name: "Ana", consent: false, birthDay: undefined });
  });
  it("el consentimiento solo es true si se marca", () => {
    expect(signupSchema.parse({ name: "A", phone: "611111111", consent: "on" }).consent).toBe(true);
  });
  it("rechaza cumpleaños incompleto o imposible", () => {
    expect(signupSchema.safeParse({ name: "A", phone: "611111111", birthDay: "3", birthMonth: "" }).success).toBe(
      false,
    );
    expect(signupSchema.safeParse({ name: "A", phone: "611111111", birthDay: "31", birthMonth: "2" }).success).toBe(
      false,
    );
    expect(signupSchema.safeParse({ name: "A", phone: "611111111", birthDay: "29", birthMonth: "2" }).success).toBe(
      true,
    );
  });
  it("rechaza nombre vacío", () => {
    expect(signupSchema.safeParse({ name: "  ", phone: "611111111" }).success).toBe(false);
  });
});

describe("birthdayToDate", () => {
  it("usa el año 2000", () => expect(birthdayToDate(5, 3)).toBe("2000-03-05"));
  it("null si falta algo", () => expect(birthdayToDate(undefined, 3)).toBeNull());
});
