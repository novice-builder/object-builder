import { test, expect } from "@playwright/test";
test("terminal and hangar entrances, actual aircraft boarding, scenic flight, exit and reload", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.world.houses.length),
  ).toBe(38);
  for (const place of ["Airfield terminal", "Airfield hangar"]) {
    await page.locator("#mapButton").tap();
    await page.locator(`[data-place="${place}"]`).tap();
    await page.evaluate(() => {
      const a = (window as any).bw2;
      a.setPlayer({ yaw: 0, pitch: 0 });
      a.simulate({ forward: 1, right: 0 }, 2);
    });
    expect(
      await page.evaluate(() => (window as any).bw2.game.player.z),
    ).toBeLessThan(place === "Airfield terminal" ? -160 : -175);
  }
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Aircraft boarding ramp"]').tap();
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.setPlayer({ x: 172, y: 0, z: -151, yaw: -Math.PI / 2, pitch: 0 });
    a.simulate({ forward: 1, right: 0 }, 1.8);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.y),
  ).toBeCloseTo(0.6, 1);
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.setPlayer({ x: 178, yaw: 0 });
    a.simulate({ forward: 1, right: 0 }, 2.2);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.z),
  ).toBeLessThan(-158);
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.add({ x: 50, y: 0, z: -220, type: "wood" });
    a.game.commands.undo();
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.world.aircraft.passenger,
    ),
  ).toBe(true);
  await expect(page.locator("#redo")).toBeDisabled();
  await page.keyboard.press("y");
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
  expect(
    await page.evaluate(() => (window as any).bw2.game.commands.canRedo),
  ).toBe(true);
  await page.evaluate(() =>
    (window as any).bw2.simulate({ forward: 0, right: 0 }, 15),
  );
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.y),
  ).toBeGreaterThan(18);
  await page.locator("#cameraMode").tap();
  expect(
    await page.evaluate(() => {
      const g = (window as any).bw2.game,
        p = g.world.aircraft.pose,
        c = g.view.camera.position;
      return Math.hypot(c.x - p.x, c.z - p.z);
    }),
  ).toBeGreaterThan(12);
  await page.screenshot({ path: "test-results/scenic-flight.png" });
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().player.y),
  ).toBeCloseTo(0.6, 1);
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.world.aircraft.passenger,
    ),
  ).toBe(false);
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.y),
  ).toBeCloseTo(0.6, 1);
  await page.locator("#use").tap();
  await page.evaluate(() =>
    (window as any).bw2.simulate({ forward: 0, right: 0 }, 3),
  );
  await page.locator("#use").tap();
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.world.aircraft.passenger,
    ),
  ).toBe(false);
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.setPlayer({ x: 178, z: -151, yaw: Math.PI / 2 });
    a.simulate({ forward: 1, right: 0 }, 3);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.x),
  ).toBeLessThan(173);
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.y),
  ).toBeLessThan(0.02);
  await page.locator("#home").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.x),
  ).toBeCloseTo(-21.4, 1);
});
test("earlier county layouts and constructions in the future airport remain unchanged", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    const current = await a.session.store.load(a.session.current.id),
      s = current.snapshot;
    s.world.layout = 2;
    s.world.blocks = [{ x: 178, y: 0, z: -156, type: "wood" }];
    const r = await a.session.store.create("Preserved county layout 2", s);
    await a.session.open(r.id);
  });
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.world.aircraft === undefined,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].x),
  ).toBe(178);
});
