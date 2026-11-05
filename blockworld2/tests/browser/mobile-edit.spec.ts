import { test, expect } from "@playwright/test";
test("touch move preview relocates and rotates an object with undo/redo", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    a.setPlayer({ x: -60, y: 0, z: 65, yaw: 0, pitch: -0.65 });
    a.add({ x: -60, y: 0, z: 62, type: "bench", rotation: 0 });
  });
  const project = async (x: number, y: number, z: number) =>
    page.evaluate(
      ({ x, y, z }) => {
        const g = (window as any).bw2.game;
        g.updateCamera();
        const v = g.view.camera.position
          .clone()
          .set(x, y, z)
          .project(g.view.camera);
        return { x: (v.x + 1) * 512, y: (1 - v.y) * 300 };
      },
      { x, y, z },
    );
  await page.locator("#moveObject").tap();
  const source = await project(-59.5, 0.55, 62.5);
  await page.touchscreen.tap(source.x, source.y);
  await expect(page.locator("#previewControls")).toBeVisible();
  const target = await project(-61.5, 0, 62.5);
  await page.touchscreen.tap(target.x, target.y);
  await page.locator("#rotate").tap();
  await page.locator("#confirm").tap();
  const blocks = await page.evaluate(
    () => (window as any).bw2.snapshot().blocks,
  );
  expect(blocks).toHaveLength(1);
  expect(blocks[0].x).not.toBe(-60);
  expect(blocks[0].rotation).toBe(90);
  await page.locator("#undo").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].x),
  ).toBe(-60);
  await page.locator("#redo").tap();
  expect(
    await page.evaluate(
      () => (window as any).bw2.snapshot().blocks[0].rotation,
    ),
  ).toBe(90);
});
