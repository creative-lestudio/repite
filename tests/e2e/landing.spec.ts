import { expect, test } from "@playwright/test";
import { clearRateLimits } from "./helpers";

test.beforeEach(clearRateLimits);

test.describe("web pública", () => {
  test("presenta el producto y lleva a crear cuenta", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Hacemos que tus clientes");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("vuelvan");
    for (const id of ["como-funciona", "negocios", "ventajas", "precio", "preguntas"]) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
    await expect(page.getByRole("heading", { name: "Starter", exact: true })).toBeVisible();
    await expect(page.getByText("Probar 30 días gratis").first()).toBeVisible();
    await page.locator("#precio").getByRole("link", { name: "Empezar gratis" }).click();
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
    await page.getByRole("link", { name: "Ver una tarjeta de ejemplo" }).click();
    await expect(page.getByRole("heading", { name: "Tu tarjeta de Café Aurora" })).toBeVisible();
    await page.goto("/legal/privacidad");
    await expect(page.getByText(/borrador pendiente de revisión legal/i)).toBeVisible();
  });

  test("tiene metadatos para buscadores y para compartir", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Repite/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Wallet/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
    expect((await request.get("/robots.txt")).status()).toBe(200);
    expect((await request.get("/sitemap.xml")).status()).toBe(200);
    expect((await request.get("/opengraph-image")).headers()["content-type"]).toContain("image/png");
  });

  test("no hay scroll horizontal a 360 px en ninguna página pública", async ({ page }) => {
    for (const path of [
      "/",
      "/registro",
      "/entrar",
      "/legal/terminos",
      "/para/cafeterias",
      "/para/restaurantes",
      "/para/heladerias",
    ]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("el selector de sector cambia la tarjeta de ejemplo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Heladerías" }).click();
    await expect(page.getByRole("tab", { name: "Heladerías" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText("Polo Norte").first()).toBeVisible();
    await expect(page.getByText("Un helado gratis").first()).toBeVisible();
    await page.getByRole("tab", { name: "Restaurantes" }).click();
    await expect(page.getByText("La Cocina de Marta").first()).toBeVisible();
  });

  test("hay una página para cada sector y las desconocidas dan 404", async ({ page }) => {
    const casos: [string, RegExp][] = [
      ["/para/cafeterias", /tarjeta de sellos para tu cafetería/i],
      ["/para/restaurantes", /fideliza a los clientes de tu restaurante/i],
      ["/para/heladerias", /vuelvan a tu heladería/i],
    ];
    for (const [ruta, titulo] of casos) {
      await page.goto(ruta);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(titulo);
      await expect(page.getByRole("heading", { name: "Ideas de premio" })).toBeVisible();
    }
    const res = await page.goto("/para/peluquerias-de-marte");
    expect(res?.status()).toBe(404);
  });

  test("las secciones aparecen al hacer scroll y el botón fijo sale tras la portada", async ({ page }) => {
    await page.goto("/");
    const sticky = page.getByTestId("sticky-cta");
    await expect(sticky).toHaveClass(/translate-y-full/); // en la portada no estorba
    await page.locator("#como-funciona").scrollIntoViewIfNeeded();
    await page.getByRole("heading", { name: "El cliente escanea tu QR" }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("heading", { name: "El cliente escanea tu QR" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "El cliente escanea tu QR" }).locator("xpath=ancestor::li[1]"),
    ).toHaveCSS("opacity", "1");
    await expect(sticky).toHaveClass(/translate-y-0/);
  });
});
