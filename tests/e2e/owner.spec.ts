import { expect, test, type Page } from "@playwright/test";
import { admin, AURORA } from "./helpers";

async function login(page: Page, email: string, password: string) {
  await page.goto("/entrar");
  await page.getByLabel("Tu correo").first().fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/app/);
}

// Abre el menú en móvil (en escritorio la barra lateral siempre está visible)
async function go(page: Page, name: string | RegExp) {
  const menu = page.getByRole("button", { name: "Abrir el menú" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name }).first().click();
}

test.describe("dueño: cuenta demo", () => {
  test("ve su panel, busca un cliente, añade una nota y exporta el CSV", async ({ page }) => {
    await login(page, "demo@repite.app", "repite-demo");
    await expect(page.getByRole("heading", { name: "Hola, Café Aurora" })).toBeVisible();
    await expect(page.getByText("Tu local de un vistazo")).toBeVisible();

    await go(page, "Clientes");
    await page.getByLabel("Buscar por nombre o teléfono").fill("María");
    await page.getByRole("button", { name: "Buscar" }).click();
    await page.getByRole("link", { name: /maría lópez/i }).click();
    await expect(page.getByRole("heading", { name: "María López" })).toBeVisible();
    await expect(page.getByText("flat white con avena")).toBeVisible();

    const note = `Nota del dueño ${Date.now()}`;
    await page.getByLabel("Nueva nota").fill(note);
    await page.getByRole("button", { name: "Añadir nota" }).click();
    await expect(page.getByText(note)).toBeVisible();

    const res = await page.request.get("/app/clientes/exportar");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const csv = await res.text();
    expect(csv).toContain("María López");
    expect(csv).not.toContain("Cliente de Sol"); // aislamiento entre cuentas
  });

  test("las rutas del panel piden entrar", async ({ page }) => {
    await page.goto("/app/clientes");
    await expect(page).toHaveURL(/\/entrar\?siguiente=/);
  });

  test("contraseña incorrecta explica qué hacer", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByLabel("Tu correo").first().fill("demo@repite.app");
    await page.getByLabel("Contraseña").fill("incorrecta");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByText(/no coinciden/)).toBeVisible();
  });
});

test.describe("dueño: cuenta nueva", () => {
  test("completa el alta, configura equipo y QR, y no ve datos de otra cuenta", async ({ page }) => {
    test.setTimeout(90_000);
    const id = Date.now().toString(36);
    const email = `dueno-${id}@example.com`;

    await page.goto("/registro");
    await page.getByLabel("Tu correo").fill(email);
    await page.getByLabel("Elige una contraseña").fill("una-clave-segura-1");
    await page.getByRole("button", { name: "Crear mi cuenta" }).click();

    // Asistente: negocio, local y premio en una pantalla
    await expect(page.getByRole("heading", { name: "Vamos a crear tu tarjeta de sellos" })).toBeVisible();
    // El tipo de negocio adapta ejemplos y valores por defecto
    await page.locator("label").filter({ hasText: "Heladería" }).click();
    await expect(page.getByLabel("Heladería")).toBeChecked();
    await expect(page.getByLabel("Nombre del negocio")).toHaveAttribute("placeholder", "Heladería Polo Norte");
    await expect(page.getByLabel("Sellos para ganar el premio")).toHaveValue("10");
    await expect(page.getByLabel("Premio", { exact: true })).toHaveAttribute("placeholder", "Un helado gratis");
    await page.getByLabel("Nombre del negocio").fill(`Tostadores ${id}`);
    await page.getByLabel("Nombre del local").fill(`Tostadores ${id}`);
    await expect(page.getByLabel("Enlace de tu tarjeta")).toHaveValue(`tostadores-${id}`);
    await page.getByLabel("Premio", { exact: true }).fill("Un helado de regalo");
    await page.getByRole("button", { name: "Crear mi tarjeta" }).click();

    await expect(page.getByRole("heading", { name: `Hola, Tostadores ${id}` })).toBeVisible();
    await expect(page.getByText("Para empezar a sumar clientes")).toBeVisible();
    await expect(page.getByText(/te quedan 30 días|Te quedan 3\d días/i)).toBeVisible();
    await expect(page.getByText("Todavía no tienes clientes")).toBeVisible();

    // Aislamiento: no hay clientes y la ficha de otra cuenta da 404
    await go(page, "Clientes");
    await expect(page.getByText("Aún no hay clientes")).toBeVisible();
    const res = await page.goto("/app/clientes/a0000000-0000-4000-8000-0000000000e1");
    expect(res?.status()).toBe(404);

    // Equipo: alta con PIN y tablet
    await page.goto("/app/equipo");
    await page.getByLabel("Nombre", { exact: true }).fill("Sofía");
    await page.getByLabel("PIN", { exact: true }).fill("2468");
    await page.getByRole("button", { name: "Añadir empleado" }).click();
    await expect(page.getByText("Sofía")).toBeVisible();
    await page.getByRole("button", { name: "Vincular una tablet" }).click();
    const link = await page.locator("p.font-mono").innerText();
    expect(link).toContain("/equipo/vincular?t=");

    // La tablet vinculada con ese enlace permite entrar con el PIN de Sofía
    const tablet = await page
      .context()
      .browser()!
      .newContext({ viewport: { width: 820, height: 1180 } });
    const tp = await tablet.newPage();
    await tp.goto(link.replace(/^https?:\/\/[^/]+/, "http://localhost:3000"));
    // Con un solo empleado la tablet va directa a su PIN
    await expect(tp.getByRole("heading", { name: "PIN de Sofía" })).toBeVisible();
    for (const d of "2468") await tp.getByRole("button", { name: `Número ${d}` }).click();
    await tp.getByRole("button", { name: "Entrar" }).click();
    await expect(tp.getByText("Atiende: Sofía")).toBeVisible();
    await tablet.close();

    // QR y material: los PDF se descargan
    await page.goto("/app/qr");
    await expect(page.getByRole("img", { name: /código qr de/i })).toBeVisible();
    for (const formato of ["a4", "a6"]) {
      const pdf = await page.request.get(`/app/qr/pdf?formato=${formato}`);
      expect(pdf.status()).toBe(200);
      expect(pdf.headers()["content-type"]).toBe("application/pdf");
      expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    }

    // Ajustes y programa se guardan
    await page.goto("/app/ajustes");
    await page.getByLabel("Dirección").fill("Calle del Tueste 5, Madrid");
    await page.getByRole("button", { name: "Guardar ajustes" }).click();
    await expect(page.getByText("Ajustes guardados")).toBeVisible();
    await page.goto("/app/programa");
    await page.getByLabel("Sellos para ganar el premio").fill("12");
    await page.getByRole("button", { name: "Guardar programa" }).click();
    await expect(page.getByText("Programa guardado")).toBeVisible();

    // La tarjeta pública del nuevo local ya funciona
    await page.context().clearCookies();
    await page.goto(`/c/tostadores-${id}`);
    await expect(page.getByRole("heading", { name: new RegExp(`Tu tarjeta de Tostadores ${id}`) })).toBeVisible();
    await expect(page.getByText(/un helado de regalo/i)).toBeVisible();
    const { data: loc } = await admin.from("locations").select("business_type").eq("slug", `tostadores-${id}`).single();
    expect(loc?.business_type).toBe("heladeria");

    // Limpieza del usuario de prueba
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    const user = data.users.find((u) => u.email === email);
    expect(user).toBeTruthy();
    void AURORA;
  });
});
