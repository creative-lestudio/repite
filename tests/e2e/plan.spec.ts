import { expect, test } from "@playwright/test";
import { admin } from "./helpers";

test("el plan Gratis no deja crear el cliente 51 y lo explica con amabilidad", async ({ page }) => {
  test.setTimeout(60_000);
  const id = Date.now().toString(36);
  const slug = `limite-${id}`;

  const { data: org, error } = await admin
    .from("organizations")
    .insert({ name: `Límite ${id}`, country: "ES", currency: "EUR", plan: "free" })
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
