import { test, expect } from "@playwright/test";
test("catalogue thumbnails, favourites, new furniture and native reload work", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  await page.locator("#catalogueButton").tap();
  await page.locator("[data-category=Furniture]").tap();
  await expect(page.locator("[data-catalogue=sofa] img")).toHaveAttribute(
    "src",
    /^data:image\/png/,
  );
  await page
    .getByRole("button", { name: "Favourite Two-seat sofa", exact: true })
    .tap();
  await page.locator("[data-category=Favourites]").tap();
  await expect(page.locator("[data-catalogue]")).toHaveCount(1);
  await page.locator("[data-catalogue=sofa]").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().selected),
  ).toBe("sofa");
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.setPlayer({ x: -60, y: 0, z: 65, yaw: 0, pitch: -0.65 });
  });
  await page.touchscreen.tap(512, 300);
  await expect(page.locator("#previewControls")).toBeVisible();
  await page.locator("#rotate").tap();
  await page.locator("#confirm").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].type),
  ).toBe("sofa");
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(
      () => (window as any).bw2.snapshot().blocks[0].rotation,
    ),
  ).toBe(90);
  expect(
    await page.evaluate(() => (window as any).bw2.game.favourites),
  ).toContain("sofa");
});
test("prefab catalogue selection creates an atomic garden set", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => {
    const a = (window as any).bw2;
    return a.session.newWorld("blank");
  });
  await page.locator("#catalogueButton").tap();
  await page.locator("[data-category=Presets]").tap();
  await page.locator("[data-catalogue=set-garden]").tap();
  await page.evaluate(() =>
    (window as any).bw2.setPlayer({
      x: -60,
      y: 0,
      z: 65,
      yaw: 0,
      pitch: -0.65,
    }),
  );
  await page.touchscreen.tap(512, 300);
  await page.locator("#confirm").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(3);
  await page.locator("#undo").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(0);
});
