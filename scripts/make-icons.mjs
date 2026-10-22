// Genera los iconos PNG de la PWA a partir de la marca (src/app/icon.svg y src/components/brand/paths.json).
// Uso: pnpm icons
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const icon = readFileSync("src/app/icon.svg", "utf8");
const { mark } = JSON.parse(readFileSync("src/components/brand/paths.json", "utf8"));
const [bx, by, bw, bh] = mark.box;

// Versión «maskable»: fondo rojo a sangre y la R más pequeña para respetar la zona segura (≈ 66 %)
function maskable(size) {
  const scale = (100 * 0.42) / bh;
  const tw = bw * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FF3B2E"/><g transform="translate(${50 - tw / 2} 29) scale(${scale}) translate(${-bx} ${-by})"><path d="${mark.d}" fill="#F6EDE6" fill-rule="evenodd"/></g></svg>`;
}
const standard = (size) => icon.replace("<svg ", `<svg width="${size}" height="${size}" `);

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, isMask] of [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["icon-maskable-512.png", 512, true],
  ["apple-touch-icon.png", 180, true],
]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:transparent">${isMask ? maskable(size) : standard(size)}</body>`,
  );
  await page.screenshot({ path: `public/icons/${file}`, omitBackground: !isMask });
}
await browser.close();
