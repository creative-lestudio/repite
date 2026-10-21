import { expect, test } from "@playwright/test";
import { admin, AURORA, customerIdByPhone, randomPhone } from "./helpers";

test.describe("cliente", () => {
  test("se registra por QR, ve su tarjeta y recibe un sello nuevo animado", async ({ page }) => {
    const phone = randomPhone();
    await page.goto(`/c/${AURORA.slug}`);
    await expect(page.getByRole("heading", { name: "Tu tarjeta de Café Aurora" })).toBeVisible();

    // El consentimiento no viene marcado por defecto
    const consent = page.getByLabel(/quiero recibir mensajes/i);
    await expect(consent).not.toBeChecked();

    await page.getByLabel("Tu nombre").fill("Prueba E2E");
    await page.getByLabel("Tu WhatsApp").fill(phone);
    await page.getByLabel("Día").selectOption("14");
    await page.getByLabel("Mes").selectOption("3");
    await consent.check();
    await page.getByRole("button", { name: "Crear mi tarjeta" }).click();

    await expect(page.getByRole("heading", { name: "Hola, Prueba" })).toBeVisible();
    const card = page.getByRole("region", { name: /tarjeta de sellos: /i });
    await expect(card).toContainText("0 de 8 sellos");
    await expect(page.getByRole("img", { name: /código qr personal/i })).toBeVisible();

    // El equipo registra la visita (directamente en la BD) y la tarjeta se actualiza sola
    const customerId = await customerIdByPhone(phone);
    const { error } = await admin.rpc("register_visit", {
      p_location: AURORA.locationId,
      p_customer: customerId,
      p_staff: AURORA.lucia,
      p_idempotency_key: `e2e:${customerId}:1`,
    });
    expect(error).toBeNull();
    await expect(card).toContainText("1 de 8 sellos", { timeout: 12_000 });
    await expect(card.getByLabel("Sello 1, conseguido")).toHaveClass(/animate-stamp/);

    // Historial
    await page.getByRole("link", { name: "Historial" }).click();
    await expect(page.getByRole("heading", { name: "Tu historial" })).toBeVisible();
    await expect(page.getByText("Visita").first()).toBeVisible();

    // Sello extra por historia queda pendiente
    await page.getByRole("link", { name: "Sellos extra" }).click();
    await page.getByLabel(/tu usuario de instagram/i).fill("@prueba");
    await page.getByRole("button", { name: "Ya lo hice, pedir mi sello" }).first().click();
    await expect(page.getByText(/el equipo lo revisará pronto/i)).toBeVisible();

    // Darse de baja de mensajes
    await page.getByRole("link", { name: "Ajustes" }).click();
    await page.getByLabel(/recibo mensajes de café aurora/i).uncheck();
    await expect(page.getByText("Cambios guardados")).toBeVisible();
    const { data } = await admin.from("customers").select("marketing_consent").eq("id", customerId).single();
    expect(data?.marketing_consent).toBe(false);
  });

  test("un teléfono ya registrado no da acceso: se envía enlace por WhatsApp", async ({ page }) => {
    await page.goto(`/c/${AURORA.slug}`);
    await page.getByLabel("Tu nombre").fill("Suplantador");
    await page.getByLabel("Tu WhatsApp").fill("611 11 11 11"); // María, del seed
    await page.getByRole("button", { name: "Crear mi tarjeta" }).click();
    await expect(page.getByText("Ya tienes una tarjeta con este número")).toBeVisible();
    await expect(page.getByRole("heading", { name: /hola/i })).toHaveCount(0);
  });

  test("el enlace mágico abre la tarjeta y solo sirve una vez", async ({ page }) => {
    const { createHash, randomBytes } = await import("node:crypto");
    const token = randomBytes(24).toString("base64url");
    const { error } = await admin.from("magic_links").insert({
      organization_id: AURORA.organizationId,
      customer_id: "a0000000-0000-4000-8000-0000000000e2", // Javier
      token_hash: createHash("sha256").update(token).digest("hex"),
      expires_at: new Date(Date.now() + 600_000).toISOString(),
    });
    expect(error).toBeNull();
    await page.goto(`/c/${AURORA.slug}/acceso?t=${token}`);
    await expect(page.getByRole("heading", { name: "Hola, Javier" })).toBeVisible();

    await page.context().clearCookies();
    await page.goto(`/c/${AURORA.slug}/acceso?t=${token}`);
    await expect(page.getByText(/este enlace ya se usó o ha caducado/i)).toBeVisible();
  });

  test("validación amable de errores del formulario", async ({ page }) => {
    await page.goto(`/c/${AURORA.slug}`);
    await page.getByLabel("Tu WhatsApp").fill("123");
    await page.getByRole("button", { name: "Crear mi tarjeta" }).click();
    await expect(page.getByText("Escribe tu nombre para saber cómo llamarte.")).toBeVisible();
  });

  test("un local inexistente explica qué hacer", async ({ page }) => {
    await page.goto("/c/no-existe-este-local");
    await expect(page.getByText("No encontramos este local")).toBeVisible();
  });
});
