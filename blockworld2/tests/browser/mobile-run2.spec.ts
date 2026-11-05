import { test, expect } from "@playwright/test";
test("control sides and look speed persist; joystick and look work together without building", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  await page.locator("#controlsButton").tap();
  await page.locator('[data-speed="0.6"]').tap();
  await page.locator("#handed").tap();
  await page.locator("#closeControls").tap();
  const j = (await page.locator("#joystick").boundingBox())!,
    x = j.x + j.width / 2,
    y = j.y + j.height / 2,
    cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x, y, id: 1 },
      { x: 550, y: 230, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x, y: y - 30, id: 1 },
      { x: 600, y: 230, id: 2 },
    ],
  });
  await page.waitForTimeout(300);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().player.z),
  ).toBeLessThan(7.8);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().player.yaw),
  ).toBeLessThan(-0.05);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
  await page.evaluate(() => {
    const g = (window as any).bw2.game;
    g.flying = true;
    g.vertical = 1;
    g.refreshModes();
  });
  await page.locator("#mapButton").tap();
  expect(await page.evaluate(() => (window as any).bw2.game.vertical)).toBe(0);
  await page.locator("#closeMap").tap();
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(await page.evaluate(() => (window as any).bw2.game.lookSpeed)).toBe(
    0.6,
  );
  await expect(page.locator("body")).toHaveClass(/leftHanded/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const g = (window as any).bw2.game;
    g.pending = { x: 4, y: 0, z: 0, type: "chair" };
    g.showPreview();
  });
  const preview = (await page.locator("#previewControls").boundingBox())!,
    joy = (await page.locator("#joystick").boundingBox())!;
  expect(preview.y + preview.height).toBeLessThan(joy.y);
});
test("world switching releases world geometry and light switches use a fixed pool", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => {
    const a = (window as any).bw2,
      p = a.game.world.authoredProps.find(
        (p: any) => p.id === "cedar-villa:light",
      );
    a.setPlayer({ x: p.block.x + 0.5, y: 0, z: p.block.z + 2 });
    a.game.refreshLights();
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.lightPool.length),
  ).toBe(3);
  expect(
    await page.evaluate(() =>
      (window as any).bw2.game.lightPool.some((l: any) => l.intensity > 0),
    ),
  ).toBe(true);
  await page.locator("#use").tap();
  await page.evaluate(() => (window as any).bw2.game.refreshLights());
  expect(
    await page.evaluate(() =>
      (window as any).bw2.game.lightPool.every((l: any) => l.intensity === 0),
    ),
  ).toBe(true);
  const counts: number[] = [];
  for (let i = 0; i < 4; i++) {
    await page.evaluate(async () => {
      const a = (window as any).bw2;
      await a.session.newWorld("blank");
      await a.session.newWorld("sunbeam-region");
    });
    counts.push(
      await page.evaluate(() => {
        const g = (window as any).bw2.game;
        // Measure after rendering the new scene, not a timer that may still
        // observe the preceding blank frame under software rendering.
        g.update(1 / 60);
        g.updateCamera();
        g.world.staticRender.updateVisibility(g.view.camera, 155);
        g.view.renderer.render(g.view.scene, g.view.camera);
        return g.view.renderer.info.memory.geometries;
      }),
    );
  }
  expect(
    Math.max(...counts) - Math.min(...counts),
    JSON.stringify(counts),
  ).toBeLessThan(10);
});
