import { expect, test } from "@playwright/test";
import { admin, AURORA, clearRateLimits, DEV_DEVICE_TOKEN, seedCustomer } from "./helpers";

test.beforeEach(clearRateLimits);

test("acceso asistido: el equipo genera un QR de un solo uso que caduca en 15 minutos", async ({ page }) => {
  const name = `Acceso ${Date.now()}`;
  const { id } = await seedCustomer(name, 0);

  await page.goto(`/equipo/vincular?t=${DEV_DEVICE_TOKEN}`);
  await page.getByRole("button", { name: /lucía/i }).click();
  for (const d of "1234") await page.getByRole("button", { name: `Número ${d}` }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Atiende: Lucía")).toBeVisible();

  await page.goto(`/equipo/clientes/${id}`);
  await page.getByRole("button", { name: "Dar acceso en otro móvil" }).click();
  await expect(page.getByRole("img", { name: "Código QR de acceso a la tarjeta" })).toBeVisible();
  await expect(page.getByText(/caduca en 15 minutos/i)).toBeVisible();

  const { data: links } = await admin
    .from("magic_links")
    .select("expires_at, used_at, organization_id")
    .eq("customer_id", id);
  expect(links).toHaveLength(1);
  expect(links![0].used_at).toBeNull();
  expect(links![0].organization_id).toBe(AURORA.organizationId);
  const minutes = (new Date(links![0].expires_at).getTime() - Date.now()) / 60_000;
  expect(minutes).toBeGreaterThan(13);
  expect(minutes).toBeLessThanOrEqual(15);

  const { data: audit } = await admin
    .from("audit_log")
    .select("action, actor_type")
    .eq("entity_id", id)
    .eq("action", "customer.assisted_access");
  expect(audit).toHaveLength(1);
  expect(audit![0].actor_type).toBe("staff");
});

test("acceso asistido: otro negocio no puede pedirlo para un cliente ajeno", async ({ page }) => {
  // Cliente de Panadería Sol, abierto desde la tablet de Café Aurora
  const { data: sol } = await admin
    .from("customers")
    .select("id")
    .eq("organization_id", "b0000000-0000-4000-8000-000000000001")
    .limit(1);
  test.skip(!sol?.length, "la semilla no tiene clientes de Sol");
  await page.goto(`/equipo/vincular?t=${DEV_DEVICE_TOKEN}`);
  await page.getByRole("button", { name: /lucía/i }).click();
  for (const d of "1234") await page.getByRole("button", { name: `Número ${d}` }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Atiende: Lucía")).toBeVisible();
  await page.goto(`/equipo/clientes/${sol![0].id}`);
  // La ficha de otro negocio no se abre ni ofrece generar accesos (la página responde con el 404 de la aplicación)
  await expect(page.getByRole("button", { name: "Dar acceso en otro móvil" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Registrar visita" })).toHaveCount(0);
  const { count } = await admin
    .from("magic_links")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", sol![0].id);
  expect(count).toBe(0);
});
