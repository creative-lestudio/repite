import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/domain/csv";

describe("csvCell", () => {
  it("escapa comillas, saltos de línea y punto y coma", () => {
    expect(csvCell('di "hola"')).toBe('"di ""hola"""');
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });
  it("neutraliza fórmulas", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+34600")).toBe("'+34600");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });
  it("vacío para null/undefined y valores simples tal cual", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(12)).toBe("12");
    expect(csvCell(true)).toBe("true");
  });
});

describe("toCsv", () => {
  it("incluye BOM, cabecera y CRLF", () => {
    expect(toCsv(["a", "b"], [[1, "x;y"]])).toBe('﻿a;b\r\n1;"x;y"\r\n');
  });
});
