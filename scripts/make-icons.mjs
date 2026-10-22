// Genera los iconos PNG de la PWA a partir del mismo SVG de la marca (src/app/icon.svg).
// Uso: pnpm icons
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const svg = readFileSync("src/app/icon.svg", "utf8");
const inner = svg
  .replace(/^[\s\S]*?<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "")
  .replace(/<rect[^>]*\/>/, "");
const BLUE = "#2255D6";

function html(size, maskable) {
  // maskable: fondo azul a sangre y marca reducida para respetar la zona segura
  const mark = maskable ? `<g transform="translate(16 16) scale(0.72) translate(-16 -16)">${inner}</g>` : inner;
  const bg = maskable
    ? `<rect width="32" height="32" fill="${BLUE}"/>`
    : `<rect width="32" height="32" rx="9" fill="${BLUE}"/>`;
  return `<body style="margin:0;background:transparent"><svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">${bg}${mark}</svg></body>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, maskable] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, maskable));
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: !maskable });
}
await browser.close();
