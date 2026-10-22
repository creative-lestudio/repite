// Genera las imágenes de las tarjetas de Wallet (icono y logotipo) como base64 en src/server/wallet/assets.ts.
// Uso: node scripts/make-wallet-assets.mjs
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";

const icon = readFileSync("src/app/icon.svg", "utf8");
const { wordmark } = JSON.parse(readFileSync("src/components/brand/paths.json", "utf8"));
const [wx, wy, ww, wh] = wordmark.box;

const logoSvg = (w, h) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${wx} ${wy} ${ww} ${wh}" preserveAspectRatio="xMinYMid meet"><path d="${wordmark.d}" fill="#F6EDE6" fill-rule="evenodd"/></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
const out = {};

async function shot(name, w, h, svg) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="margin:0;background:transparent">${svg}</body>`);
  out[name] = (await page.screenshot({ omitBackground: true })).toString("base64");
}

for (const [name, size] of [
  ["icon.png", 29],
  ["icon@2x.png", 58],
  ["icon@3x.png", 87],
]) {
  await shot(name, size, size, icon.replace("<svg ", `<svg width="${size}" height="${size}" `));
}
// Logotipo: caja máxima de Apple 160×50 pt
const lh = 40;
const lw = Math.round((lh * ww) / wh);
await shot("logo.png", lw, lh, logoSvg(lw, lh));
await shot("logo@2x.png", lw * 2, lh * 2, logoSvg(lw * 2, lh * 2));
await shot("logo@3x.png", lw * 3, lh * 3, logoSvg(lw * 3, lh * 3));
await browser.close();

const body = Object.entries(out)
  .map(([k, v]) => `  "${k}": "${v}",`)
  .join("\n");
writeFileSync(
  "src/server/wallet/assets.ts",
  `// Generado por scripts/make-wallet-assets.mjs. No editar a mano.\nexport const WALLET_IMAGES: Record<string, string> = {\n${body}\n};\n`,
);
console.log("ok", Object.keys(out).join(", "));
