import { describe, expect, it } from "vitest";
import { maskPhone, normalizePhone } from "@/domain/phone";

describe("normalizePhone", () => {
  it.each([
    ["611 11 11 11", "ES", "+34611111111"],
    ["+34 611111111", "ES", "+34611111111"],
    ["0034611111111", "ES", "+34611111111"],
    ["34611111111", "ES", "+34611111111"],
    ["0412-123-4567", "VE", "+584121234567"],
    ["4121234567", "VE", "+584121234567"],
    ["+58 412 1234567", "VE", "+584121234567"],
    ["0212 555 1234", "VE", "+582125551234"],
    ["+58 412 1234567", "ES", "+584121234567"],
  ] as const)("%s (%s) → %s", (raw, country, expected) => {
    expect(normalizePhone(raw, country)).toBe(expected);
  });

  it.each([
    ["123", "ES"],
    ["511111111", "ES"],
    ["0312 1234567", "VE"],
    ["", "ES"],
    ["abc", "VE"],
  ] as const)("rechaza %s (%s)", (raw, country) => {
    expect(normalizePhone(raw, country)).toBeNull();
  });
});

describe("maskPhone", () => {
  it("oculta el número salvo los últimos 3 dígitos", () => {
    expect(maskPhone("+34611111234")).toBe("+34 ••• ••• 234");
  });
});
