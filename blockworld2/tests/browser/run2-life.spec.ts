import { test, expect } from "@playwright/test";
test("farm animals greet and nearby population/road traffic remain bounded", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.agents.length),
  ).toBe(20);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.traffic.length),
  ).toBe(4);
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Farm paddock"]').tap();
  await page.evaluate(() => {
    const a = (window as any).bw2,
      cow = a.game.activity.agents.find((x: any) => x.species === "cow");
    a.setPlayer({
      x: cow.state.x + 1.5,
      y: 0,
      z: cow.state.z,
      yaw: 0,
      pitch: 0,
    });
  });
  await page.locator("#use").tap();
  await expect(page.locator("#status")).toContainText("cow");
  const before = await page.evaluate(() =>
    (window as any).bw2.game.activity.roadTraffic.cars.map((c: any) => [
      c.x,
      c.z,
    ]),
  );
  await page.waitForTimeout(700);
  expect(
    await page.evaluate(() =>
      (window as any).bw2.game.activity.roadTraffic.cars.map((c: any) => [
        c.x,
        c.z,
      ]),
    ),
  ).not.toEqual(before);
});
