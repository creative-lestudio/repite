import { describe, expect, it } from "vitest";
import { parseCustomerQr } from "@/domain/qr";

const token = "0123456789abcdef0123456789abcdef";

describe("parseCustomerQr", () => {
  it("acepta la URL del QR personal", () => {
    expect(parseCustomerQr(`https://repite.app/equipo/q/${token}`)).toBe(token);
    expect(parseCustomerQr(`http://localhost:3000/equipo/q/${token}?x=1`)).toBe(token);
  });
  it("rechaza otros códigos", () => {
    expect(parseCustomerQr("https://repite.app/c/cafe-aurora")).toBeNull();
    expect(parseCustomerQr(`https://repite.app/equipo/q/${token}extra`)).toBeNull();
    expect(parseCustomerQr("hola")).toBeNull();
  });
});
