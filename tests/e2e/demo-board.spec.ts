import { test, expect } from "@playwright/test";

test("unauthenticated visitor sees 4 live demo widgets", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/en/);

  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(4);
  await expect(widgets.nth(0).getByText("BTC/USDT")).toBeVisible();
  await expect(widgets.nth(1).getByText("ETH/USDT")).toBeVisible();
  await expect(widgets.nth(2).getByText("SOL/USDT")).toBeVisible();
  await expect(widgets.nth(3).getByText("BNB/USDT")).toBeVisible();

  const firstPrice = widgets.nth(0).getByTestId("widget-price");
  await expect(firstPrice).not.toHaveText("—");

  const initial = await firstPrice.innerText();
  await expect
    .poll(async () => firstPrice.innerText(), {
      timeout: 35_000,
      intervals: [2_000],
    })
    .not.toBe(initial);
});