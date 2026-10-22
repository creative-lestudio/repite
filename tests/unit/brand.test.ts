import { describe, expect, it } from "vitest";
import { actionColor, contrast, DEFAULT_BRAND, onColor, parseBrand, themeVars } from "@/domain/brand";

describe("marca del local", () => {
  it("el color de acción siempre cumple AA con texto blanco", () => {
    for (const c of ["#FFD60A", "#FF3B2E", "#7A0D12", "#00C2A8", "#FFFFFF", "#111111"]) {
      expect(contrast(actionColor(c), "#ffffff")).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("no toca un color que ya es legible", () => {
    expect(actionColor("#7A0D12")).toBe("#7A0D12");
  });

  it("elige texto claro u oscuro sobre el color de marca", () => {
    expect(onColor("#FFD60A")).toBe("#111111");
    expect(onColor("#7A0D12")).toBe("#ffffff");
  });

  it("lee marcas incompletas o manipuladas sin fallar", () => {
    expect(parseBrand(null)).toEqual(DEFAULT_BRAND);
    const b = parseBrand(
      { font: "comic", stampShape: "star", cardBg: "../../etc/passwd", stampImage: "a/b.png" },
      "rojo",
      "x/logo.png",
    );
    expect(b.font).toBe("jakarta");
    expect(b.stampShape).toBe("star");
    expect(b.cardBg).toBeNull();
    expect(b.stampImage).toBe("a/b.png");
    expect(b.primary).toBe(DEFAULT_BRAND.primary);
    expect(b.logo).toBe("x/logo.png");
  });

  it("genera variables CSS con tipografía y colores", () => {
    const v = themeVars({ ...DEFAULT_BRAND, primary: "#FFD60A", font: "playfair" });
    expect(v["--brand"]).toBe("#FFD60A");
    expect(v["--font-display"]).toContain("--font-playfair");
    expect(contrast(v["--primary"]!, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });
});
