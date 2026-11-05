import { test, expect } from "@playwright/test";
test("capture the integrated slice and check compact mobile layouts", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => {
    const g = (window as any).bw2.game;
    g.flying = true;
    g.cameraMode = "first";
    Object.assign(g.player, { x: 10, y: 24, z: 65, yaw: 0, pitch: -0.4 });
  });
  await page.screenshot({ path: "test-results/slice-overview.png" });
  await page.evaluate(() => {
    const g = (window as any).bw2.game;
    g.flying = false;
    g.cameraMode = "first";
    Object.assign(g.player, { x: -21.4, y: 0, z: -9, yaw: 0, pitch: 0 });
  });
  await page.screenshot({ path: "test-results/home-interior.png" });
  await page.locator("#catalogueButton").tap();
  await page.locator("[data-category=Garden]").tap();
  await expect(page.locator("[data-catalogue=pergola] img")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await page.screenshot({ path: "test-results/run1-catalogue.png" });
  await page.locator("#closeCatalogue").tap();
  for (const [width, height] of [
    [844, 390],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.locator("#mapButton").tap();
    await expect(page.locator("#mapCanvas")).toBeVisible();
    await page.locator("#closeMap").tap();
    await expect(page.locator("#palette")).toBeVisible();
    await expect(page.locator("#joystick")).toBeVisible();
  }
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.view.renderer.info.render.calls,
    ),
  ).toBeLessThan(180);
});
