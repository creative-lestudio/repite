import { chromium } from "@playwright/test";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const out = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2, locale: "es-ES" });
await page.goto("http://localhost:3000/c/cafe-aurora");
await page.screenshot({ path: `${out}/signup.png`, fullPage: true });
const token = randomBytes(24).toString("base64url");
await admin.from("magic_links").insert({
  organization_id: "a0000000-0000-4000-8000-000000000001",
  customer_id: "a0000000-0000-4000-8000-0000000000e4",
  token_hash: createHash("sha256").update(token).digest("hex"),
  expires_at: new Date(Date.now() + 600000).toISOString(),
});
await page.goto(`http://localhost:3000/c/cafe-aurora/acceso?t=${token}`);
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/card.png`, fullPage: true });
await page.goto("http://localhost:3000/c/cafe-aurora/premios");
await page.screenshot({ path: `${out}/rewards.png`, fullPage: true });
await page.goto("http://localhost:3000/c/cafe-aurora/extra");
await page.screenshot({ path: `${out}/extra.png`, fullPage: true });
await browser.close();
