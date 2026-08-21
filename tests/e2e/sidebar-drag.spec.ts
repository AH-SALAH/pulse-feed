import { test, expect } from "@playwright/test";

test.setTimeout(90000);

async function signIn(page: import("@playwright/test").Page) {
  const email = `drag-${crypto.randomUUID()}@example.com`;
  const password = "Str0ng-P@ss-2026";

  const seed = await page.request.post("/api/auth/sign-up/email", {
    data: { email, password, name: "Drag Tester" },
  });
  expect(seed.ok()).toBeTruthy();

  await page.goto("/en/board");
  await expect(page).toHaveURL(/\/en\/board/);
}

test("sidebar handle drags the floating nav and persists across reload", async ({
  page,
}) => {
  await signIn(page);

  const sidebar = page.getByRole("complementary", {
    name: /board navigation/i,
  });
  await expect(sidebar).toBeVisible();

  const handle = page.getByRole("button", { name: /move board navigation/i });
  await expect(handle).toBeVisible();

  const before = await sidebar.evaluate((el) => el.getBoundingClientRect().left);
  const startY = await sidebar.evaluate((el) => el.getBoundingClientRect().top);

  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(300, 500, { steps: 5 });
  await page.mouse.up();

  await expect
    .poll(async () => {
      return sidebar.evaluate((el) => el.getBoundingClientRect().left);
    })
    .not.toBe(before);
  const afterY = await sidebar.evaluate((el) => el.getBoundingClientRect().top);
  expect(afterY).toBeGreaterThan(startY);

  const draggedLeft = await sidebar.evaluate((el) => el.getBoundingClientRect().left);

  await page.reload();
  const afterReload = await sidebar.evaluate((el) => el.getBoundingClientRect().left);
  expect(afterReload).toBeCloseTo(draggedLeft, 0);
});

test("sidebar handle stays within the viewport when dragged to the edge", async ({
  page,
}) => {
  await signIn(page);

  const sidebar = page.getByRole("complementary", {
    name: /board navigation/i,
  });
  const handle = page.getByRole("button", { name: /move board navigation/i });
  await expect(handle).toBeVisible();

  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();

  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(2000, 1200, { steps: 5 });
  await page.mouse.up();

  const box = await sidebar.boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
});

test("sidebar handle moves with arrow keys", async ({ page }) => {
  await signIn(page);

  const sidebar = page.getByRole("complementary", {
    name: /board navigation/i,
  });
  const handle = page.getByRole("button", { name: /move board navigation/i });
  await expect(handle).toBeVisible();

  const before = await sidebar.evaluate((el) => el.getBoundingClientRect().top);
  await handle.focus();
  await page.keyboard.press("ArrowDown");
  const after = await sidebar.evaluate((el) => el.getBoundingClientRect().top);
  expect(after).toBeGreaterThan(before);
});