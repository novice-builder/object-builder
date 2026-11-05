import { test, expect } from "@playwright/test";
test("utility car and bicycle map entry, touch driving, safe exit and saved fleet", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.activity.vehicles.length,
    ),
  ).toBe(3);
  for (const [id, name] of [
    ["runabout", "Ranch runabout"],
    ["bicycle", "Village bicycle"],
  ]) {
    await page.locator("#mapButton").tap();
    await page.locator(`[data-place="${name}"]`).tap();
    await page.locator("#use").tap();
    expect(
      await page.evaluate(() => (window as any).bw2.game.activity.driving),
    ).toBe(true);
    expect(
      await page.evaluate(() => (window as any).bw2.game.activity.vehicleKind),
    ).toBe(id);
    const before = await page.evaluate(() => {
      const c = (window as any).bw2.game.activity.car;
      return { x: c.x, z: c.z };
    });
    const j = (await page.locator("#joystick").boundingBox())!,
      x = j.x + j.width / 2,
      y = j.y + j.height / 2,
      cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - 35, id: 1 }],
    });
    await page.waitForTimeout(350);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    expect(
      await page.evaluate((b) => {
        const c = (window as any).bw2.game.activity.car;
        return Math.hypot(c.x - b.x, c.z - b.z);
      }, before),
    ).toBeGreaterThan(0.5);
    await page.locator("#cameraMode").tap();
    await page.evaluate(() => (window as any).bw2.session.save());
    await page.reload();
    await page.waitForFunction(() => (window as any).bw2?.session.ready);
    expect(
      await page.evaluate(() => (window as any).bw2.game.activity.driving),
    ).toBe(false);
    await page.locator("#use").tap();
    expect(
      await page.evaluate(() => (window as any).bw2.game.activity.vehicleKind),
    ).toBe(id);
    await page.locator("#use").tap();
    expect(
      await page.evaluate(() => (window as any).bw2.game.activity.driving),
    ).toBe(false);
  }
});
