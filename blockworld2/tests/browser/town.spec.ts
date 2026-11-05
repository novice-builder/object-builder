import { test, expect } from "@playwright/test";
test("expanded town landmarks, plots and old-template switching remain usable", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() =>
    (window as any).bw2.session.newWorld("sunbeam-town"),
  );
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(12);
  await page.locator("#mapButton").tap();
  await expect(page.locator('[data-place="Sunbeam school"]')).toBeVisible();
  await page.locator('[data-place="Sunbeam school"]').tap();
  const position = await page.evaluate(
    () => (window as any).bw2.snapshot().player,
  );
  expect(position.x).toBeGreaterThan(50);
  await page.locator("#worlds").tap();
  await page.locator('[data-template="home-square"]').tap();
  await expect(page.locator("#modal")).toBeHidden();
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(4);
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(4);
});
