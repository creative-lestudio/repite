// Capturas de auditoría de todas las interfaces (móvil y escritorio). Uso: node scripts/dev/audit.mjs <carpeta>
import { chromium } from "@playwright/test";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const out = process.argv[2];
const base = "http://localhost:3000";
const browser = await chromium.launch();
const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "es-ES" };
const desktop = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, locale: "es-ES" };

async function go(page, url) {
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      return;
    } catch (e) {
      if (i === 2) throw e;
      await page.waitForTimeout(800);
    }
  }
}

async function shot(page, name, full = true) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
}

// Web comercial
for (const [label, ctx] of [
  ["m", mobile],
  ["d", desktop],
]) {
  const p = await browser.newPage(ctx);
  for (const [n, u] of [
    ["landing", "/"],
    ["sector", "/para/heladerias"],
    ["registro", "/registro"],
    ["entrar", "/entrar"],
  ]) {
    await go(p, base + u);
    // fuerza la aparición de las animaciones de entrada
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
    await shot(p, `${label}-${n}`);
  }
  await p.close();
}

// Cliente (móvil)
const c = await browser.newPage(mobile);
await go(c, `${base}/c/cafe-aurora`);
await shot(c, "c-registro");
const token = randomBytes(24).toString("base64url");
await admin.from("magic_links").insert({
  organization_id: "a0000000-0000-4000-8000-000000000001",
  customer_id: "a0000000-0000-4000-8000-0000000000e1",
  token_hash: createHash("sha256").update(token).digest("hex"),
  expires_at: new Date(Date.now() + 600000).toISOString(),
});
await go(c, `${base}/c/cafe-aurora/acceso?t=${token}`);
await shot(c, "c-tarjeta");
for (const [n, u] of [
  ["premios", "premios"],
  ["historial", "historial"],
  ["extra", "extra"],
  ["ajustes", "ajustes"],
]) {
  await go(c, `${base}/c/cafe-aurora/${u}`);
  await shot(c, `c-${n}`);
}

// Equipo (móvil/tablet)
const s = await browser.newPage({ ...mobile });
await go(s, `${base}/equipo/vincular?t=dev-device-cafe-aurora`);
await shot(s, "e-pin");
await s.getByRole("button", { name: /Lucía/ }).click();
for (const k of ["1", "2", "3", "4"]) await s.getByRole("button", { name: k, exact: true }).click();
await s.waitForTimeout(1500);
await shot(s, "e-inicio");
for (const [n, u] of [
  ["buscar", "/equipo/clientes"],
  ["escanear", "/equipo/escanear"],
  ["pendientes", "/equipo/pendientes"],
]) {
  await go(s, base + u);
  await shot(s, `e-${n}`);
}

// Dueño (escritorio y móvil)
for (const [label, ctx] of [
  ["d", desktop],
  ["m", mobile],
]) {
  const o = await browser.newPage(ctx);
  await go(o, `${base}/entrar`);
  await o.getByText("Tengo contraseña").click();
  await o.getByLabel("Tu correo").last().fill("demo@repite.app");
  await o.getByLabel("Contraseña").fill("repite-demo");
  await o.getByRole("button", { name: "Entrar", exact: true }).click();
  await o.waitForURL(/\/app/);
  for (const [n, u] of [
    ["inicio", "/app"],
    ["clientes", "/app/clientes"],
    ["programa", "/app/programa"],
    ["equipo", "/app/equipo"],
    ["qr", "/app/qr"],
    ["extras", "/app/extras"],
    ["ajustes", "/app/ajustes"],
    ["plan", "/app/plan"],
    ["marca", "/app/marca"],
  ]) {
    await go(o, base + u);
    await shot(o, `o${label}-${n}`);
  }
  await o.close();
}
await browser.close();
console.log("ok");
