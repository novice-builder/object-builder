import { test, expect } from "@playwright/test";
test("pictorial dog follow, stay and home controls persist through reload", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Your dog"]').tap();
  // Recovery may stand at the dog's centre; use a clear adjacent point to select it.
  await page.evaluate(() => {
    const a = (window as any).bw2,
      d = a.game.activity.pet;
    a.setPlayer({ x: d.state.x + 1.4, y: 0, z: d.state.z, yaw: 0, pitch: 0 });
  });
  await page.locator("#use").tap();
  await page.locator('[data-pet-mode="follow"]').tap();
  await page.evaluate(() => {
    const a = (window as any).bw2,
      d = a.game.activity.pet;
    a.setPlayer({ x: d.state.x + 9, y: 0, z: d.state.z });
    a.simulate({ forward: 0, right: 0 }, 2);
  });
  const dog = await page.evaluate(() => {
    const d = (window as any).bw2.game.activity.pet;
    return { x: d.state.x, z: d.state.z };
  });
  expect(dog.x).toBeGreaterThan(18);
  await page.evaluate(() => {
    const a = (window as any).bw2,
      d = a.game.activity.pet;
    a.setPlayer({ x: d.state.x + 1.4, y: 0, z: d.state.z });
  });
  await page.locator("#use").tap();
  await page.locator('[data-pet-mode="stay"]').tap();
  const stopped = await page.evaluate(
    () => (window as any).bw2.game.activity.pet.state.x,
  );
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    a.simulate({ forward: 0, right: 0 }, 3);
    await a.session.save();
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.pet.state.x),
  ).toBe(stopped);
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.petMode),
  ).toBe("stay");
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Your dog"]').tap();
  await page.evaluate(() => {
    const a = (window as any).bw2,
      d = a.game.activity.pet;
    a.setPlayer({ x: d.state.x + 1.4, y: 0, z: d.state.z });
  });
  await page.locator("#use").tap();
  await page.locator('[data-pet-mode="home"]').tap();
  await page.evaluate(() =>
    (window as any).bw2.simulate({ forward: 0, right: 0 }, 8),
  );
  expect(
    await page.evaluate(() => {
      const d = (window as any).bw2.game.activity.pet;
      return Math.hypot(d.state.x - 14, d.state.z - 17);
    }),
  ).toBeLessThan(0.5);
});
