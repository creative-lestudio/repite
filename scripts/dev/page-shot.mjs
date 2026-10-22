// Uso: node scripts/dev/page-shot.mjs <url> <salida.png> <ancho> [alto]  → captura de página completa
import { chromium } from "@playwright/test";

const [url, out, width, height] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height ?? 900) },
  deviceScaleFactor: 1,
  locale: "es-ES",
});
await page.goto(url);
await page.waitForTimeout(900);
// Recorre la página como una persona para que se activen las animaciones de entrada
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(900);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log("desbordamiento horizontal:", overflow);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
