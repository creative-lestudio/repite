import { expect, test, type Page } from "@playwright/test";
import { admin, AURORA, customerIdByPhone, DEV_DEVICE_TOKEN, randomPhone, clearRateLimits } from "./helpers";

test.beforeEach(clearRateLimits);

async function ownerLogin(page: Page) {
  await page.goto("/entrar");
  await page.getByText("Tengo contraseña").click();
  await page.getByLabel("Tu correo").last().fill("demo@repite.app");
  await page.getByLabel("Contraseña").fill("repite-demo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
}

async function staffSignIn(page: Page) {
  await page.goto(`/equipo/vincular?t=${DEV_DEVICE_TOKEN}`);
  await page.getByRole("button", { name: /lucía/i }).click();
  for (const d of "1234") await page.getByRole("button", { name: `Número ${d}` }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Atiende: Lucía")).toBeVisible();
}

test("cupón: el dueño lo crea, el cliente lo ve y el equipo lo canjea", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Cupón E2E ${Date.now().toString(36)}`;
  const phone = randomPhone();
  const owner = await (await browser.newContext()).newPage();
  const client = await (await browser.newContext()).newPage();
  const staff = await (await browser.newContext()).newPage();

  try {
    // El dueño (Plus) crea el cupón
    await ownerLogin(owner);
    await owner.goto("/app/cupones");
    await expect(owner.getByRole("heading", { name: "Cupones", level: 1 })).toBeVisible();
    await owner.getByLabel("Qué regalas").fill(title);
    await owner.getByRole("button", { name: "Crear cupón" }).click();
    await expect(owner.getByText("Cupón creado")).toBeVisible();
    await expect(owner.getByText(title)).toBeVisible();

    // Un cliente se apunta y ve el cupón en su tarjeta y en Premios
    await client.goto(`/c/${AURORA.slug}`);
    await client.getByLabel("Tu nombre").fill("Cliente Cupón");
    await client.getByLabel("Tu WhatsApp").fill(phone);
    await client.getByRole("button", { name: "Crear mi tarjeta" }).click();
    await expect(client.getByRole("heading", { name: "Hola, Cliente" })).toBeVisible();
    await expect(client.getByText("Tienes un cupón")).toBeVisible();
    await client.getByRole("link", { name: /ver mis cupones/i }).click();
    await expect(client.getByText(title)).toBeVisible();

    // El equipo lo canjea desde la ficha
    const customerId = await customerIdByPhone(phone);
    await staffSignIn(staff);
    await staff.goto(`/equipo/clientes/${customerId}`);
    await expect(staff.getByRole("heading", { name: "Cupones del cliente" })).toBeVisible();
    await staff.getByRole("button", { name: "Canjear cupón" }).click();
    await staff.getByRole("button", { name: "Sí, canjear" }).click();
    await expect(staff.getByText("Cupón canjeado")).toBeVisible();

    // Ya no aparece como disponible
    await client.reload();
    await expect(client.getByText("Tienes un cupón")).toHaveCount(0);
  } finally {
    await admin
      .from("coupons")
      .update({ active: false, deleted_at: new Date().toISOString() })
      .eq("organization_id", AURORA.organizationId)
      .eq("title", title);
  }
});

test("niveles VIP: el dueño Plus los guarda", async ({ page }) => {
  try {
    await ownerLogin(page);
    await page.goto("/app/programa");
    await expect(page.getByRole("group", { name: "Niveles VIP" })).toBeVisible();
    await page.getByLabel("Nivel 1").fill("Plata");
    await page.getByLabel("Visitas").first().fill("10");
    await page.getByLabel("Ventaja (opcional)").first().fill("Postre gratis");
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page.getByText(/guardado|guardada/i).first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByLabel("Nivel 1")).toHaveValue("Plata");
    await expect(page.getByLabel("Visitas").first()).toHaveValue("10");
  } finally {
    await admin.from("loyalty_programs").update({ levels: [] }).eq("organization_id", AURORA.organizationId);
  }
});

test("aviso por cercanía: el dueño Plus guarda las coordenadas de su local", async ({ page }) => {
  try {
    await ownerLogin(page);
    await page.goto("/app/ajustes");
    await expect(page.getByRole("heading", { name: "Aviso al pasar cerca del local" })).toBeVisible();
    await page.getByLabel("Latitud").fill("40.4168");
    await page.getByLabel("Longitud").fill("-3.7038");
    await page.getByRole("button", { name: /guardar/i }).click();
    await expect(page.getByText(/guardado|guardada/i).first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByLabel("Latitud")).toHaveValue("40.4168");
    await expect(page.getByLabel("Longitud")).toHaveValue("-3.7038");
  } finally {
    await admin.from("locations").update({ latitude: null, longitude: null }).eq("id", AURORA.locationId);
  }
});
