import { test, expect } from "@playwright/test";

test("user signs up via the sign-up page and reaches their personal board", async ({
  page,
}) => {
  const name = "Signup Tester";
  const email = `signup-${Date.now()}@example.com`;
  const password = "Str0ng-P@ss-2026";

  await page.goto(`/en/sign-up`);
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page).toHaveURL(/\/en\/board/, { timeout: 15_000 });

  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(4);
  await expect(widgets.nth(0).getByText("BTC/USDT")).toBeVisible();
  await expect(widgets.nth(1).getByText("ETH/USDT")).toBeVisible();
  await expect(widgets.nth(2).getByText("SOL/USDT")).toBeVisible();
  await expect(widgets.nth(3).getByText("BNB/USDT")).toBeVisible();
});

test("sign-up rejects an already-used email", async ({ page, request }) => {
  const email = `dupe-${Date.now()}@example.com`;
  const password = "Str0ng-P@ss-2026";

  const seed = await request.post("/api/auth/sign-up/email", {
    data: { email, password, name: "Dupe Tester" },
  });
  expect(seed.ok()).toBeTruthy();

  await page.goto(`/en/sign-up`);
  await page.getByLabel("Name").fill("Dupe Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).not.toHaveURL(/\/en\/board/);
});