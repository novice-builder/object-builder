import { test, expect } from "@playwright/test";
test("long press removes once and release never places another block", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => (window as any).bw2.session.newWorld("legacy-06"));
  await expect(page.locator("#palette")).toBeVisible();
  await page.evaluate(() =>
    (window as any).bw2.setPlayer({
      x: -60,
      y: 0,
      z: 65,
      yaw: 0,
      pitch: -0.65,
      vy: 0,
      grounded: true,
    }),
  );
  await page.locator("[data-item=wood]").tap();
  await page.touchscreen.tap(512, 300);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 512, y: 300, id: 1 }],
  });
  await page.waitForTimeout(650);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
  await page.locator("#undo").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
});
