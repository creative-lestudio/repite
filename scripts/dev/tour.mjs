// Capturas del recorrido completo (cliente + equipo) a tamaño móvil, para enseñar el producto.
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
const ctx = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: "es-ES" };

// Cliente: María (3 sellos)
const client = await browser.newPage(ctx);
await client.goto(`${base}/c/cafe-aurora`);
await client.screenshot({ path: `${out}/1-cliente-registro.png` });
const token = randomBytes(24).toString("base64url");
await admin.from("magic_links").insert({
  organization_id: "a0000000-0000-4000-8000-000000000001",
  customer_id: "a0000000-0000-4000-8000-0000000000e1",
  token_hash: createHash("sha256").update(token).digest("hex"),
  expires_at: new Date(Date.now() + 600000).toISOString(),
});
await client.goto(`${base}/c/cafe-aurora/acceso?t=${token}`);
await client.waitForTimeout(600);
await client.screenshot({ path: `${out}/2-cliente-tarjeta.png` });
await client.getByRole("button", { name: "Mostrar mi código" }).click();
await client.screenshot({ path: `${out}/3-cliente-codigo.png`, fullPage: true });
await client.goto(`${base}/c/cafe-aurora/extra`);
await client.screenshot({ path: `${out}/4-cliente-sellos-extra.png` });

// Equipo
const staff = await browser.newPage(ctx);
await staff.goto(`${base}/equipo/vincular?t=dev-device-cafe-aurora`);
await staff.screenshot({ path: `${out}/5-equipo-quien-eres.png` });
await staff.getByRole("button", { name: /lucía/i }).click();
for (const d of "12") await staff.getByRole("button", { name: `Número ${d}` }).click();
await staff.screenshot({ path: `${out}/6-equipo-pin.png` });
for (const d of "34") await staff.getByRole("button", { name: `Número ${d}` }).click();
await staff.getByRole("button", { name: "Entrar" }).click();
await staff.getByText("Atiende: Lucía").waitFor();
await staff.goto(`${base}/equipo/clientes/a0000000-0000-4000-8000-0000000000e1`);
await staff.getByRole("button", { name: "Registrar visita" }).click();
await staff.getByText(/Visita registrada/).waitFor();
await staff.screenshot({ path: `${out}/7-equipo-ficha-visita-registrada.png` });

// El cliente ve el sello nuevo estamparse
await client.goto(`${base}/c/cafe-aurora`);
await client.waitForTimeout(300);
await client.screenshot({ path: `${out}/8-cliente-sello-nuevo.png` });

await staff.goto(`${base}/equipo`);
await staff.screenshot({ path: `${out}/9-equipo-inicio.png`, fullPage: true });
await browser.close();
