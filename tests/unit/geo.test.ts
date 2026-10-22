import { describe, expect, it } from "vitest";
import { parseCoord, parseGeocode, parsePair } from "@/domain/geo";

describe("coordenadas del local", () => {
  it("lee números con punto o coma y rechaza fuera de rango", () => {
    expect(parseCoord("40,4168", "lat")).toBe(40.4168);
    expect(parseCoord(" -3.7038 ", "lng")).toBe(-3.7038);
    expect(parseCoord("95", "lat")).toBeNull();
    expect(parseCoord("", "lat")).toBeNull();
    expect(parseCoord("abc", "lng")).toBeNull();
  });

  it("acepta la pareja pegada desde Google Maps", () => {
    expect(parsePair("40.4168, -3.7038")).toEqual({ latitude: 40.4168, longitude: -3.7038 });
    expect(parsePair("10,4806; -66,9036")).toEqual({ latitude: 10.4806, longitude: -66.9036 });
    expect(parsePair("hola")).toBeNull();
  });

  it("interpreta la respuesta de Nominatim", () => {
    expect(parseGeocode([{ lat: "40.41", lon: "-3.70" }])).toEqual({ latitude: 40.41, longitude: -3.7 });
    expect(parseGeocode([])).toBeNull();
    expect(parseGeocode({})).toBeNull();
  });
});
