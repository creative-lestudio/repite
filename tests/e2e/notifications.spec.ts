import { expect, test, type Page } from "@playwright/test";
import { admin, AURORA, clearRateLimits, randomPhone } from "./helpers";

test.beforeEach(clearRateLimits);

async function ownerLogin(page: Page, email = "demo@repite.app") {
  await page.goto("/entrar");
  await page.getByText("Tengo contraseña").click();
  await page.getByLabel("Tu correo").last().fill(email);
  await page.getByLabel("Contraseña").fill("repite-demo");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
}

test("notificaciones: el dueño Growth envía un aviso y el cliente lo ve en su tarjeta", async ({ browser }) => {
  test.setTimeout(120_000);
  const title = `Aviso E2E ${Date.now().toString(36)}`;
  const owner = await (await browser.newContext()).newPage();
  const client = await (await browser.newContext()).newPage();

  try {
    // Un cliente nuevo da permiso para recibir comunicaciones
    await client.goto(`/c/${AURORA.slug}`);
    await client.getByLabel("Tu nombre").fill("Cliente Aviso");
    await client.getByLabel("Tu WhatsApp").fill(randomPhone());
    await client.getByLabel(/quiero recibir mensajes/i).check();
    await client.getByRole("button", { name: "Crear mi tarjeta" }).click();
    await expect(client.getByRole("heading", { name: "Hola, Cliente" })).toBeVisible();

    // El dueño redacta a partir de una plantilla y lo envía a todos
    await ownerLogin(owner);
    await owner.goto("/app/notificaciones");
    await expect(owner.getByRole("heading", { name: "Notificaciones", level: 1 })).toBeVisible();
    await owner.getByRole("button", { name: "Promoción del día" }).click();
    await owner.getByLabel("Título").fill(title);
    await owner.getByLabel("Texto").fill("Hoy 2x1 en cafés, {nombre}.");
    await expect(owner.getByText(/clientes cumplen este segmento/)).toBeVisible();
    await owner.getByRole("button", { name: "Enviar", exact: true }).click();
    await owner.getByRole("button", { name: "Sí, enviar" }).click();
    await expect(owner.getByText("Notificación enviada")).toBeVisible();
    await expect(owner.getByText(title)).toBeVisible();
    await expect(owner.getByText("Enviada").first()).toBeVisible({ timeout: 30_000 });

    // El cliente lo ve en su tarjeta, con su nombre en el texto
    await client.reload();
    await expect(client.getByText(title)).toBeVisible();
    await expect(client.getByText("Hoy 2x1 en cafés, Cliente.")).toBeVisible();
  } finally {
    await admin.from("notifications").delete().eq("organization_id", AURORA.organizationId).eq("title", title);
  }
});

test("notificaciones: Starter ve la invitación a mejorar y Growth los segmentos avanzados", async ({ page }) => {
  await ownerLogin(page, "sol@repite.app");
  await page.goto("/app/notificaciones");
  await expect(page.getByText("Las notificaciones están incluidas en Growth")).toBeVisible();

  await page.context().clearCookies();
  await ownerLogin(page);
  await page.goto("/app/notificaciones");
  const option = page.getByRole("option", { name: /A pocos sellos del premio/ });
  await expect(option).toBeEnabled();
});
