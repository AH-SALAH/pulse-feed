import { test, expect } from "@playwright/test";

test.setTimeout(90000);

async function signInWithFreshAccount(
  page: import("@playwright/test").Page,
  request: import("@playwright/test").APIRequestContext,
) {
  const email = `ai-${crypto.randomUUID()}@example.com`;
  const password = "Str0ng-P@ss-2026";

  const seed = await request.post("/api/auth/sign-up/email", {
    data: { email, password, name: "AI Tester" },
  });
  expect(seed.ok()).toBeTruthy();

  await page.goto(`/en/sign-in`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/en\/board/);
  await page.waitForLoadState("networkidle");
}

async function clickExplainUntil(
  widget: import("@playwright/test").Locator,
  assertion: () => Promise<void>,
) {
  await expect(async () => {
    await widget.getByTestId("explain-button").click();
    await assertion();
  }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
}

test("clicking Explain this renders a summary", async ({ page, request }) => {
  await page.route("**/api/ai/explain", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: true,
        summary: "BTC is trending up over the recent window.",
      }),
    });
  });

  await signInWithFreshAccount(page, request);

  const widget = page.getByTestId("widget").filter({ hasText: "BTC/USDT" });

  await clickExplainUntil(widget, async () => {
    await expect(widget.getByTestId("explain-summary")).toHaveText(
      /BTC is trending up over the recent window\./,
    );
  });
  await expect(widget.getByTestId("explain-button")).toBeEnabled();
});

test("cap-exhausted shows the unavailable message instead of an error", async ({
  page,
  request,
}) => {
  await page.route("**/api/ai/explain", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: false,
        resetsAt: "2026-08-20T00:00:00.000Z",
      }),
    });
  });

  await signInWithFreshAccount(page, request);

  const widget = page.getByTestId("widget").filter({ hasText: "BTC/USDT" });

  await clickExplainUntil(widget, async () => {
    await expect(widget.getByTestId("explain-unavailable")).toContainText(
      "resets at midnight UTC",
    );
    await expect(widget.getByTestId("explain-error")).toHaveCount(0);
  });
  await expect(widget.getByTestId("explain-button")).toBeEnabled();
});