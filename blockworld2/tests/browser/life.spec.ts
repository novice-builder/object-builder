import { test, expect } from "@playwright/test";
test("usable chairs allow sitting and safe standing through touch or movement", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    a.add({ x: 0, y: 0, z: 0, type: "chair" });
    a.setPlayer({ x: 0.5, y: 0, z: 2, yaw: 0, pitch: 0 });
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.game.seated !== null),
  ).toBe(true);
  await page.locator("#use").tap();
  expect(await page.evaluate(() => (window as any).bw2.game.seated)).toBeNull();
  await page.locator("#use").tap();
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(150);
  await page.keyboard.up("KeyW");
  expect(await page.evaluate(() => (window as any).bw2.game.seated)).toBeNull();
});
test("friendly animals and greetings are available in Sunbeam Town", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() =>
      (window as any).bw2.game.activity.agents
        .filter((a: any) => a.animal)
        .map((a: any) => a.species),
    ),
  ).toEqual(["dog", "cat", "duck", "horse"]);
  await page.evaluate(() => {
    const a = (window as any).bw2,
      g = a.game,
      animal = g.activity.agents.find((a: any) => a.species === "cat");
    a.setPlayer({
      x: animal.state.x + 1.1,
      y: 0,
      z: animal.state.z,
      yaw: 0,
      pitch: 0,
    });
  });
  await page.locator("#use").tap();
  await expect(page.locator("#status")).toContainText("cat");
});
