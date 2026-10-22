import { expect, test } from "@playwright/test";

test.describe("web pública", () => {
  test("presenta el producto y lleva a crear cuenta", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Que tus clientes vuelvan");
    for (const id of ["como-funciona", "ventajas", "precio", "preguntas"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.getByText("30 días gratis").first()).toBeVisible();
    await page.getByRole("link", { name: "Empezar mi prueba gratuita" }).click();
    await expect(page).toHaveURL(/\/registro$/);
    await expect(page.getByRole("heading", { name: "Crea tu cuenta" })).toBeVisible();
  });

  test("las preguntas frecuentes se despliegan con el teclado", async ({ page }) => {
    await page.goto("/");
    const q = page.getByText("¿Mis clientes tienen que descargar una app?");
    await q.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Escanean el QR y su tarjeta se abre en el navegador/)).toBeVisible();
  });

  test("la demostración enseña la tarjeta y las páginas legales avisan de que son borrador", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Ver la tarjeta de demostración" }).click();
    await expect(page.getByRole("heading", { name: "Tu tarjeta de Café Aurora" })).toBeVisible();
    await page.goto("/legal/privacidad");
    await expect(page.getByText(/borrador pendiente de revisión legal/i)).toBeVisible();
  });

  test("tiene metadatos para buscadores y para compartir", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Repite/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /sellos/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    expect((await request.get("/robots.txt")).status()).toBe(200);
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
  });

  test("no hay scroll horizontal a 360 px en ninguna página pública", async ({ page }) => {
    for (const path of ["/", "/registro", "/entrar", "/legal/terminos"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
