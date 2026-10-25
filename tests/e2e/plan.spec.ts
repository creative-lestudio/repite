import { expect, test } from "@playwright/test";
import { admin, clearRateLimits } from "./helpers";

test.beforeEach(clearRateLimits);

test("el plan Starter no deja crear el cliente 51 y lo explica con amabilidad", async ({ page }) => {
  test.setTimeout(60_000);
  const id = Date.now().toString(36);
  const slug = `limite-${id}`;

  const { data: org, error } = await admin
    .from("organizations")
    .insert({ name: `Límite ${id}`, country: "ES", currency: "EUR", plan: "starter" })
    .select("id")
    .single();
  expect(error).toBeNull();
  const { error: e2 } = await admin.from("locations").insert({ organization_id: org!.id, name: `Límite ${id}`, slug });
  expect(e2).toBeNull();
  const { error: e3 } = await admin
    .from("loyalty_programs")
    .insert({ organization_id: org!.id, stamps_required: 8, reward_name: "Un café gratis" });
  expect(e3).toBeNull();
  const rows = Array.from({ length: 50 }, (_, i) => ({
    organization_id: org!.id,
    name: `Cliente ${i + 1}`,
    phone_e164: `+3465${id.length}${String(i).padStart(5, "0")}`.slice(0, 12),
  }));
  const { error: e4 } = await admin.from("customers").insert(rows);
  expect(e4).toBeNull();

  await page.goto(`/c/${slug}`);
  await page.getByLabel("Tu nombre").fill("Cliente cincuenta y uno");
  await page.getByLabel("Tu WhatsApp").fill("612345678");
  await page.getByRole("button", { name: "Crear mi tarjeta" }).click();
  await expect(page.getByText(/ha llegado a su límite de tarjetas/)).toBeVisible();

  // Los 50 clientes existentes no se han tocado
  const { count } = await admin
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org!.id);
  expect(count).toBe(50);
});

test("Starter muestra «Creado con Repite», sin sellos extra, y limita la marca al color", async ({ page }) => {
  const id = Date.now().toString(36);
  const slug = `starter-${id}`;
  const { data: org } = await admin
    .from("organizations")
    .insert({ name: `Starter ${id}`, country: "ES", currency: "EUR", plan: "starter" })
    .select("id")
    .single();
  // Guarda un diseño de Esencial: con Starter solo debe aplicarse el color
  await admin.from("locations").insert({
    organization_id: org!.id,
    name: `Starter ${id}`,
    slug,
    brand_color: "#2E8B57",
    brand: { font: "playfair", stampShape: "star", cardStyle: "dark" },
  });
  await admin
    .from("loyalty_programs")
    .insert({ organization_id: org!.id, stamps_required: 8, reward_name: "Un café gratis" });

  await page.goto(`/c/${slug}`);
  await expect(page.getByText("Tarjeta creada con Repite")).toBeVisible();
  const themed = page.locator("[style*='--brand']").first();
  await expect(themed).toHaveAttribute("style", /#2E8B57/i);
  await expect(themed).not.toHaveAttribute("style", /playfair/);

  // Un local Growth (Café Aurora) no muestra la etiqueta
  await page.goto("/c/cafe-aurora");
  await expect(page.getByText("Tarjeta creada con Repite")).toHaveCount(0);
});
