// Capturas reales del producto para la web pública (panel del dueño y tarjeta del cliente).
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

const desktop = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
  locale: "es-ES",
});
await desktop.goto(`${base}/entrar`);
await desktop.getByLabel("Tu correo").first().fill("demo@repite.app");
await desktop.getByLabel("Contraseña").fill("repite-demo");
await desktop.getByRole("button", { name: "Entrar", exact: true }).click();
await desktop.waitForURL("**/app");
await desktop.goto(`${base}/app/clientes`);
await desktop.getByText("María López").waitFor();
await desktop.locator("main").screenshot({ path: `${out}/panel.png` });
await desktop.goto(`${base}/app`);
await desktop.getByText("Tu local de un vistazo").waitFor();
await desktop.screenshot({ path: `${out}/panel-inicio.png` });

const phone = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, locale: "es-ES" });
const token = randomBytes(24).toString("base64url");
await admin.from("magic_links").insert({
  organization_id: "a0000000-0000-4000-8000-000000000001",
  customer_id: "a0000000-0000-4000-8000-0000000000e1",
  token_hash: createHash("sha256").update(token).digest("hex"),
  expires_at: new Date(Date.now() + 600000).toISOString(),
});
await phone.goto(`${base}/c/cafe-aurora/acceso?t=${token}`);
await phone.getByText("Hola, María").waitFor();
await phone.waitForTimeout(800);
await phone.screenshot({ path: `${out}/tarjeta.png` });
await browser.close();
