// Capturas de la sección de precios de la web y de la pantalla de plan del panel.
import { chromium } from "@playwright/test";

const out = process.argv[2];
const base = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, locale: "es-ES" });
await page.goto(base);
await page.locator("#precio").screenshot({ path: `${out}/precios.png` });
await page.goto(`${base}/entrar`);
await page.getByLabel("Tu correo").first().fill("demo@repite.app");
await page.getByLabel("Contraseña").fill("repite-demo");
await page.getByRole("button", { name: "Entrar", exact: true }).click();
await page.waitForURL("**/app");
await page.goto(`${base}/app/plan`);
await page.getByText("Tu plan ahora").waitFor();
await page.screenshot({ path: `${out}/plan-panel.png`, fullPage: true });
await browser.close();
