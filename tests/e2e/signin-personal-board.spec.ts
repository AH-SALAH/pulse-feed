import { test, expect } from "@playwright/test";

test("signed-in user reaches their personal board with 4 widgets", async ({
  page,
  request,
}) => {
  const email = `board-${Date.now()}@example.com`;
  const password = "Str0ng-P@ss-2026";

  const seed = await request.post("/api/auth/sign-up/email", {
    data: { email, password, name: "Board Tester" },
  });
  expect(seed.ok()).toBeTruthy();

  await page.goto(`/en/sign-in`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/en\/board/);

  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(4);
  await expect(widgets.nth(0).getByText("BTC/USDT")).toBeVisible();
  await expect(widgets.nth(1).getByText("ETH/USDT")).toBeVisible();
  await expect(widgets.nth(2).getByText("SOL/USDT")).toBeVisible();
  await expect(widgets.nth(3).getByText("BNB/USDT")).toBeVisible();

  const firstPrice = widgets.nth(0).getByTestId("widget-price");
  await expect(firstPrice).not.toHaveText("—");
});
