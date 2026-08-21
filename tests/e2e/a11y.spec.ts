import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["en", "ar"] as const) {
  test(`no accessibility violations on the ${locale} demo board`, async ({
    page,
  }) => {
    await page.goto(`/${locale}`);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

for (const locale of ["en", "ar"] as const) {
  test(`no accessibility violations on the ${locale} personal board`, async ({
    page,
    request,
  }) => {
    const email = `a11y-${locale}-${Date.now()}@example.com`;
    const password = "Str0ng-P@ss-2026";

    const seed = await request.post("/api/auth/sign-up/email", {
      data: { email, password, name: "A11y Tester" },
    });
    expect(seed.ok()).toBeTruthy();

    await page.goto(`/${locale}/sign-in`);
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    await page.waitForURL(`/**/${locale}/board`);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

for (const locale of ["en", "ar"] as const) {
  test(`no accessibility violations on the ${locale} board mid-interaction`, async ({
    page,
    request,
  }) => {
    const email = `a11y-mid-${locale}-${Date.now()}@example.com`;
    const password = "Str0ng-P@ss-2026";

    const seed = await request.post("/api/auth/sign-up/email", {
      data: { email, password, name: "A11y Mid Tester" },
    });
    expect(seed.ok()).toBeTruthy();

    await page.goto(`/${locale}/sign-in`);
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click('button[type="submit"]');

    await page.waitForURL(`/**/${locale}/board`);
    await page.waitForLoadState("networkidle");

    const addButton = page.getByTestId("add-widget-button");
    await addButton.click();
    await page.getByTestId("add-widget-search").focus();
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press("Escape");

    const removeButton = page.getByTestId("remove-widget").first();
    await removeButton.focus();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}