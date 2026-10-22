import { chromium } from "@playwright/test";

const out = process.argv[2];
const base = "http://localhost:3000";
const browser = await chromium.launch();
for (const [label, width, height] of [
  ["movil", 360, 780],
  ["tablet", 820, 1180],
]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1.5, locale: "es-ES" });
  await page.goto(`${base}/equipo/vincular?t=dev-device-cafe-aurora`);
  await page.screenshot({ path: `${out}/staff-${label}-who.png` });
  await page.getByRole("button", { name: /lucía/i }).click();
  for (const d of "12") await page.getByRole("button", { name: `Número ${d}` }).click();
  await page.screenshot({ path: `${out}/staff-${label}-pin.png` });
  for (const d of "34") await page.getByRole("button", { name: `Número ${d}` }).click();
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText("Atiende: Lucía").waitFor();
  await page.screenshot({ path: `${out}/staff-${label}-home.png`, fullPage: true });
  await page.goto(`${base}/equipo/clientes/a0000000-0000-4000-8000-0000000000e4`);
  await page.screenshot({ path: `${out}/staff-${label}-customer.png`, fullPage: true });
  await page.close();
}
await browser.close();
