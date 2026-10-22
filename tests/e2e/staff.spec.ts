import { expect, test, type Page } from "@playwright/test";
import { admin, AURORA, DEV_DEVICE_TOKEN, seedCustomer, clearRateLimits } from "./helpers";

test.beforeEach(clearRateLimits);

async function signIn(page: Page, pin = "1234") {
  await page.goto(`/equipo/vincular?t=${DEV_DEVICE_TOKEN}`);
  await page.getByRole("button", { name: /lucía/i }).click();
  for (const d of pin) await page.getByRole("button", { name: `Número ${d}` }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Atiende: Lucía")).toBeVisible();
}

test.describe("equipo", () => {
  test("una tablet sin vincular no puede entrar", async ({ page }) => {
    await page.goto("/equipo");
    await expect(page.getByText("Vincula esta tablet")).toBeVisible();
    await page.goto("/equipo/vincular?t=token-que-no-existe-123456");
    await expect(page.getByText("Vincula esta tablet")).toBeVisible();
  });

  test("PIN incorrecto avisa de los intentos que quedan", async ({ page }) => {
    await page.goto(`/equipo/vincular?t=${DEV_DEVICE_TOKEN}`);
    await page.getByRole("button", { name: /mateo/i }).click();
    for (const d of "0000") await page.getByRole("button", { name: `Número ${d}` }).click();
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/PIN incorrecto\. Te quedan \d intentos?\./)).toBeVisible();
    // El PIN correcto restablece el contador
    for (const d of "5678") await page.getByRole("button", { name: `Número ${d}` }).click();
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Atiende: Mateo")).toBeVisible();
  });

  test("registra visita, impide duplicarla y la deshace", async ({ page }) => {
    const name = `Visita ${Date.now().toString(36)}`;
    const c = await seedCustomer(name, 2);
    await signIn(page);
    await page.getByLabel("Buscar cliente").fill(name);
    await page.getByRole("link", { name }).click();

    await page.getByRole("button", { name: "Registrar visita" }).click();
    await expect(page.getByText("Visita registrada: 3 de 8 sellos")).toBeVisible();

    await page.getByRole("button", { name: "Registrar visita" }).click();
    await expect(page.getByText(/ya sumó un sello hace poco/)).toBeVisible();

    await page.getByRole("link", { name: "Volver al inicio" }).click();
    const row = page.getByRole("listitem").filter({ hasText: name });
    await row.getByRole("button", { name: "Deshacer" }).click();
    await expect(page.getByText("Visita deshecha")).toBeVisible();
    await expect(row.getByText("Deshecha")).toBeVisible();

    const { data } = await admin
      .from("stamp_events")
      .select("quantity")
      .eq("customer_id", c.id)
      .eq("validation_status", "approved");
    expect(data!.reduce((s, e) => s + e.quantity, 0)).toBe(2);
  });

  test("al completar la tarjeta se emite un premio y se canjea", async ({ page }) => {
    const c = await seedCustomer("Premio Equipo E2E", 7);
    await signIn(page);
    await page.goto(`/equipo/q/${c.qrToken}`); // como si escaneara su QR
    await expect(page.getByRole("heading", { name: "Premio Equipo E2E" })).toBeVisible();
    await page.getByRole("button", { name: "Registrar visita" }).click();
    await expect(page.getByText("¡Tarjeta completa! Premio ya tiene su premio.")).toBeVisible();

    await page.getByRole("button", { name: "Canjear premio" }).click();
    await page.getByRole("button", { name: "Sí, canjear" }).click();
    await expect(page.getByText("Premio canjeado")).toBeVisible();
    const { data } = await admin.from("rewards").select("status").eq("customer_id", c.id).single();
    expect(data!.status).toBe("redeemed");
  });

  test("valida un sello extra y añade una nota", async ({ page }) => {
    const name = `Extra ${Date.now().toString(36)}`;
    const c = await seedCustomer(name, 1);
    const { error } = await admin.rpc("request_bonus", {
      p_location: AURORA.locationId,
      p_customer: c.id,
      p_type: "bonus_story",
      p_evidence: { handle: "@extra_e2e" },
      p_idempotency_key: `e2e-bonus:${c.id}`,
    });
    expect(error).toBeNull();
    await signIn(page);
    await page.getByRole("link", { name: /pendientes/i }).click();
    const item = page.getByRole("listitem").filter({ hasText: name });
    await expect(item.getByText("Usuario: @extra_e2e")).toBeVisible();
    await item.getByRole("button", { name: "Aprobar" }).click();
    await expect(page.getByText("Sello extra aprobado")).toBeVisible();

    await page.goto(`/equipo/clientes/${c.id}`);
    await expect(page.getByText("2 de 8 sellos")).toBeVisible();
    await page.getByRole("button", { name: "Añadir nota" }).click();
    await page.getByLabel("Nueva nota").fill("Prefiere leche de avena");
    await page.getByRole("button", { name: "Añadir nota" }).click();
    await expect(page.getByText("Prefiere leche de avena")).toBeVisible();
  });

  test("no abre fichas de otra cuenta", async ({ page }) => {
    const { data } = await admin.from("customers").select("id").eq("name", "Cliente de Sol").single();
    await signIn(page);
    await page.goto(`/equipo/clientes/${data!.id}`);
    await expect(page.getByText("No encontramos esta página")).toBeVisible();
    await expect(page.getByText("Cliente de Sol")).toHaveCount(0);
  });
});
