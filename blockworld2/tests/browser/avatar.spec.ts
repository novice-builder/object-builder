import { test, expect } from "@playwright/test";
test("twelve visual looks persist and present correctly across seated flight and driving modes", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.locator("#avatarButton").tap();
  await expect(page.locator("[data-avatar]")).toHaveCount(12);
  await expect(page.locator("[data-avatar=blossom] img")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await page.screenshot({ path: "test-results/wardrobe.png" });
  await page.locator("[data-avatar=builder]").tap();
  await page.locator("#closeWardrobe").tap();
  await page.locator("#cameraMode").tap();
  expect(
    await page.evaluate(
      () => (window as any).bw2.game.body.group.userData.appearance,
    ),
  ).toBe("builder");
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(await page.evaluate(() => (window as any).bw2.game.appearance)).toBe(
    "builder",
  );
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  expect(await page.evaluate(() => (window as any).bw2.game.appearance)).toBe(
    "builder",
  );
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.add({ x: 0, y: 0, z: 0, type: "chair" });
    a.setPlayer({ x: 0.5, y: 0, z: 2, yaw: 0, pitch: 0 });
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.game.seated !== null),
  ).toBe(true);
  await page.locator("#use").tap();
  await page.locator("#flyMode").tap();
  expect(await page.evaluate(() => (window as any).bw2.game.flying)).toBe(true);
  await page.evaluate(() =>
    (window as any).bw2.session.newWorld("home-square"),
  );
  await page.evaluate(() =>
    (window as any).bw2.setPlayer({ x: -26, y: 0, z: -2, yaw: 0, pitch: 0 }),
  );
  await page.locator("#use").tap();
  await page.locator("#cameraMode").tap();
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.driving),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as any).bw2.game.body.group.scale.x),
  ).toBeCloseTo(0.72);
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).bw2.game.body.group.visible),
    )
    .toBe(true);
});
