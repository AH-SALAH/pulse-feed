import { test, expect } from "@playwright/test";

test.setTimeout(90000);

async function signInWithFreshAccount(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  const email = `customize-${crypto.randomUUID()}@example.com`;
  const password = "Str0ng-P@ss-2026";

  const seed = await request.post("/api/auth/sign-up/email", {
    data: { email, password, name: "Customize Tester" },
  });
  expect(seed.ok()).toBeTruthy();

  await page.goto(`/en/sign-in`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/en\/board/);
  await page.waitForLoadState("networkidle");
}

function awaitMutation(
  page: import("@playwright/test").Page,
  method: "POST" | "DELETE" | "PATCH",
) {
  return page.waitForResponse(
    (res) => {
      const url = res.url();
      return (
        url.endsWith("/api/boards/me/widgets") && res.request().method() === method
      );
    },
    { timeout: 5_000 },
  );
}

async function retryMutation(
  page: import("@playwright/test").Page,
  method: "POST" | "DELETE" | "PATCH",
  action: () => Promise<void>,
) {
  await expect(async () => {
    const mutationDone = awaitMutation(page, method);
    await action();
    await mutationDone;
  }).toPass({ timeout: 30_000, intervals: [1_000, 2_000, 3_000] });
}

async function addWidget(
  page: import("@playwright/test").Page,
  symbol: string,
) {
  await page.getByTestId("add-widget-button").click();
  await page
    .getByTestId(`add-widget-option-${symbol}`)
    .click();
}

test("add a widget persists across reload", async ({ page, request }) => {
  await signInWithFreshAccount(page, request);

  await retryMutation(page, "POST", async () => {
    await addWidget(page, "ADAUSDT");
  });

  const ada = page.getByTestId("widget").filter({ hasText: "ADA/USDT" });
  await expect(ada).toBeVisible();

  await page.reload();
  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(5);
  await expect(widgets.filter({ hasText: "ADA/USDT" })).toBeVisible();
});

test("remove a widget persists across reload", async ({ page, request }) => {
  await signInWithFreshAccount(page, request);

  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(4);
  const firstSlot = page.getByTestId("widget-slot").nth(0);

  await retryMutation(page, "DELETE", async () => {
    await firstSlot.getByTestId("remove-widget").click();
  });

  await expect(page.getByTestId("widget")).toHaveCount(3);

  await page.reload();
  await expect(page.getByTestId("widget")).toHaveCount(3);
});

test("reorder persists across reload", async ({ page, request }) => {
  await signInWithFreshAccount(page, request);

  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(4);
  await expect(widgets.nth(0).getByText("BTC/USDT")).toBeVisible();

  const slots = page.getByTestId("widget-slot");
  await retryMutation(page, "PATCH", async () => {
    await slots.nth(0).dragTo(slots.nth(2));
  });

  const reordered = page.getByTestId("widget");
  await expect(reordered.nth(0).getByText("ETH/USDT")).toBeVisible();
  await expect(reordered.nth(2).getByText("BTC/USDT")).toBeVisible();

  await page.reload();
  const afterReload = page.getByTestId("widget");
  await expect(afterReload.nth(0).getByText("ETH/USDT")).toBeVisible();
  await expect(afterReload.nth(2).getByText("BTC/USDT")).toBeVisible();
});

test("rapid continuous reorders resolve to final order without stale overwrite", async ({
  page,
  request,
}) => {
  await signInWithFreshAccount(page, request);

  const widgets = page.getByTestId("widget");
  await expect(widgets).toHaveCount(4);

  const slots = page.getByTestId("widget-slot");

  // Perform multiple rapid drags back-to-back without awaiting network in between
  await slots.nth(0).dragTo(slots.nth(3)); // Move slot 0 (BTC) to 3
  await slots.nth(0).dragTo(slots.nth(1)); // Move slot 0 (ETH) to 1
  await slots.nth(2).dragTo(slots.nth(0)); // Move slot 2 (SOL) to 0

  // Wait for all queued network sync requests to settle
  await page.waitForResponse(
    (res) => res.url().endsWith("/api/boards/me/widgets") && res.request().method() === "PATCH",
  );
  await page.waitForTimeout(1000);

  // Capture final order of symbols from UI
  const expectedSymbols = (await page.getByTestId("widget").allInnerTexts()).map(
    (text) => text.split("\n")[0],
  );

  // Reload page to verify DB matches final UI order exactly
  await page.reload();
  await page.waitForLoadState("networkidle");

  const actualSymbolsAfterReload = (await page.getByTestId("widget").allInnerTexts()).map(
    (text) => text.split("\n")[0],
  );
  expect(actualSymbolsAfterReload).toEqual(expectedSymbols);
});

test("8-widget cap rejects a 9th add with an inline message", async ({
  page,
  request,
}) => {
  await signInWithFreshAccount(page, request);

  const toAdd = ["ADAUSDT", "DOGEUSDT", "XRPUSDT", "LINKUSDT"];
  for (const symbol of toAdd) {
    await retryMutation(page, "POST", async () => {
      await addWidget(page, symbol);
    });
    await expect(
      page.getByTestId("widget").filter({ hasText: symbol.replace("USDT", "/USDT") }),
    ).toBeVisible();
  }

  await expect(page.getByTestId("widget")).toHaveCount(8);
  await expect(page.getByTestId("widget-limit-message")).toBeVisible();
  await expect(page.getByTestId("add-widget-button")).toBeDisabled();
});