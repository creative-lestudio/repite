import { expect, test, type Page } from "@playwright/test";
import { admin, clearRateLimits, seedCustomer } from "./helpers";

test.beforeEach(clearRateLimits);

async function login(page: Page) {
  await page.goto("/entrar");
  await page.getByText("Tengo contraseña").click();
  await page.getByLabel("Tu correo").last().fill("demo@repite.app");
  await page.getByLabel("Contraseña").fill("repite-demo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
}

test("derechos del cliente: el dueño descarga sus datos y los borra", async ({ page }) => {
  const name = `Derechos ${Date.now()}`;
  const seeded = await seedCustomer(name, 1);
  const id = typeof seeded === "string" ? seeded : seeded.id;
  await admin.from("customers").update({ marketing_consent: true, consent_source: "qr_signup" }).eq("id", id);

  await login(page);
  await page.goto(`/app/clientes/${id}`);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("Permiso dado")).toBeVisible();

  const res = await page.request.get(`/app/clientes/${id}/datos`);
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.cliente.nombre).toBe(name);
  expect(json.consentimientos.length).toBeGreaterThan(0);

  const erase = page.getByRole("button", { name: "Borrar los datos de este cliente" });
  await expect(erase).toBeDisabled();
  await page.getByLabel("Entiendo que no se puede deshacer").check();
  await erase.click();
  await expect(page).toHaveURL(/\/app\/clientes$/);

  const { data } = await admin.from("customers").select("name, deleted_at, marketing_consent").eq("id", id).single();
  expect(data?.name).toBe("Cliente eliminado");
  expect(data?.deleted_at).not.toBeNull();
  expect(data?.marketing_consent).toBe(false);
});
