import { test, expect } from "@playwright/test";

test("switching to Arabic renders RTL with translated UI and no horizontal overflow", async ({
  page,
}) => {
  await page.goto("/en");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.getByTestId("language-switcher").getByText("AR", { exact: true }).click();

  await expect(page).toHaveURL(/\/ar/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await expect(page.getByTestId("explain-button").first()).toHaveText("اشرح هذا");

  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noOverflow).toBe(true);
});

test("direct load of /ar renders Arabic without any English UI strings", async ({
  page,
}) => {
  await page.goto("/ar");

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await expect(page.getByTestId("explain-button").first()).toHaveText("اشرح هذا");
  await expect(page.getByText("Explain this")).toHaveCount(0);
});