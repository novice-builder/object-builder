import { test, expect } from "@playwright/test";
test("region exploration and old Sunbeam creations remain independent", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() =>
    (window as any).bw2.session.newWorld("sunbeam-region"),
  );
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(26);
  await page.evaluate(() => {
    const g = (window as any).bw2.game;
    g.flying = true;
    Object.assign(g.player, { x: -70, y: 20, z: -66, yaw: 0, pitch: -0.35 });
  });
  await page.screenshot({ path: "test-results/region-north.png" });
  await page.evaluate(() => {
    const a = (window as any).bw2,
      g = a.game,
      s = g.world.stairs[0];
    g.flying = false;
    a.setPlayer({ x: s.x, y: 0, z: s.z, yaw: s.yaw, pitch: 0, grounded: true });
    a.simulate({ forward: 1, right: 0 }, 5);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().player.y),
  ).toBeCloseTo(3.2, 1);
  await page.locator("#cameraMode").tap();
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() =>
      (window as any).bw2.game.view.camera.position
        .toArray()
        .every(Number.isFinite),
    ),
  ).toBe(true);
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Willow lake"]').tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().player.x),
  ).toBeCloseTo(84, 0);
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.game.flying = false;
    a.setPlayer({ x: 111, y: 0, z: -113 });
    a.simulate({ forward: 0, right: 0 }, 0.1);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().player.x),
  ).toBeCloseTo(84, 0);
  const id = await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("sunbeam-town");
    a.add({ x: 100, y: 0, z: 100, type: "wood" });
    await a.session.save();
    return a.session.current.id;
  });
  await page.evaluate(() =>
    (window as any).bw2.session.newWorld("sunbeam-region"),
  );
  await page.evaluate((id) => (window as any).bw2.session.open(id), id);
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(12);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].x),
  ).toBe(100);
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
});
