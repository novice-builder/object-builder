import { test, expect } from "@playwright/test";
test("pinned hotbar and a rotated building row persist with atomic history", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  await page.locator("#catalogueButton").tap();
  await page.locator("#catalogueSearch").fill("field gate");
  await page
    .getByRole("button", { name: "Pin Wide field gate", exact: true })
    .tap();
  await page.locator("#catalogueSearch").fill("Wood");
  await page.locator("#repeatBuild").tap();
  await page.locator("[data-catalogue=wood]").tap();
  await page.evaluate(() =>
    (window as any).bw2.setPlayer({
      x: -60,
      y: 0,
      z: 65,
      yaw: 0,
      pitch: -0.65,
    }),
  );
  await page.touchscreen.tap(512, 300);
  await expect(page.locator("#previewControls")).toBeVisible();
  await page.locator("#rotate").tap();
  await page.locator("#confirm").tap();
  const blocks = await page.evaluate(
    () => (window as any).bw2.snapshot().blocks,
  );
  expect(blocks).toHaveLength(3);
  expect(new Set(blocks.map((b: any) => b.x)).size).toBe(1);
  await page.locator("#undo").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
  await page.locator("#redo").tap();
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await expect(page.locator("#palette [data-item=field-gate]")).toBeVisible();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(3);
});
test("pavilion preset has working elevated supports and reverses in one action", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  await page.locator("#catalogueButton").tap();
  await page.locator("[data-category=Presets]").tap();
  await page.locator("[data-catalogue=set-pavilion]").tap();
  await page.evaluate(() =>
    (window as any).bw2.setPlayer({
      x: -60,
      y: 0,
      z: 67,
      yaw: 0,
      pitch: -0.36,
    }),
  );
  await page.touchscreen.tap(512, 300);
  await expect(page.locator("#confirm")).toBeEnabled();
  await page.locator("#confirm").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(6);
  await page.locator("#undo").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
});
