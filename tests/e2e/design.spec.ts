import { expect, test } from "@playwright/test";

test("la tarjeta de sellos estampa un sello nuevo", async ({ page }) => {
  await page.goto("/design");
  const card = page.getByRole("region", { name: /tarjeta de sellos: /i });
  await expect(card).toContainText("3 de 8 sellos");
  await page.getByRole("button", { name: "Sumar un sello" }).click();
  await expect(card).toContainText("4 de 8 sellos");
  await expect(card.getByLabel("Sello 4, conseguido")).toHaveClass(/animate-stamp/);
});

test("no hay scroll horizontal a 360 px", async ({ page }) => {
  for (const path of ["/", "/design"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
