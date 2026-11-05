import { test, expect } from "@playwright/test";
test("county travel, map, bridge, distant building and reload preserve older worlds", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(38);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.agents.length),
  ).toBe(25);
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Meadow ranch paddock"]').tap();
  expect(await page.evaluate(() => (window as any).bw2.game.player.x)).toBe(
    180,
  );
  await page.locator("#flyMode").tap();
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.setPlayer({ x: 220, y: 18, z: -200, yaw: 0, pitch: 0 });
    a.simulate({ forward: 1, right: 0 }, 3);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.z),
  ).toBeLessThan(-215);
  const county = await page.evaluate(async () => {
    const a = (window as any).bw2;
    a.add({ x: 50, y: 0, z: -220, type: "wood" });
    await a.session.save();
    return a.session.current.id;
  });
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.z),
  ).toBeLessThan(-215);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].z),
  ).toBe(-220);
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="River crossing"]').tap();
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.setPlayer({ x: -165, y: 0, z: -56, yaw: Math.PI / 2, pitch: 0 });
    a.simulate({ forward: 1, right: 0 }, 6);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.x),
  ).toBeLessThan(-183);
  const region = await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("sunbeam-region");
    a.add({ x: 185, y: 0, z: 112, type: "wood" });
    await a.session.save();
    return a.session.current.id;
  });
  await page.evaluate((id) => (window as any).bw2.session.open(id), county);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].z),
  ).toBe(-220);
  await page.evaluate((id) => (window as any).bw2.session.open(id), region);
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(26);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].x),
  ).toBe(185);
});
test("county country-road driving persists and nearby rendering stays bounded", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => {
    const a = (window as any).bw2,
      g = a.game;
    g.activity.car = { x: -208.5, z: 190, yaw: 0 };
    g.activity.update(0, g.player, { forward: 0, right: 0 }, []);
    a.setPlayer({ x: -206.5, y: 0, z: 190, yaw: 0, pitch: 0 });
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.driving),
  ).toBe(true);
  await page.evaluate(() =>
    (window as any).bw2.simulate({ forward: 1, right: 0 }, 12),
  );
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.car.z),
  ).toBeLessThan(125);
  await page.locator("#cameraMode").tap();
  await page.screenshot({ path: "test-results/county-driving.png" });
  await page.locator("#use").tap();
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.car.z),
  ).toBeLessThan(125);
  const info = await page.evaluate(() => {
    const g = (window as any).bw2.game;
    g.updateCamera();
    g.world.staticRender.updateVisibility(g.view.camera, 155);
    g.view.renderer.render(g.view.scene, g.view.camera);
    return g.view.renderer.info.render.calls;
  });
  expect(info).toBeLessThan(180);
});
