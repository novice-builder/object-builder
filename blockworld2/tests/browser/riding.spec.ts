import { test, expect } from "@playwright/test";
test("touch horse mounting, paddock exit, long ride, camera, dismount and saved recovery", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.locator("#mapButton").tap();
  await page.locator('[data-place="Meadow ranch paddock"]').tap();
  await page.evaluate(() => {
    const a = (window as any).bw2,
      h = a.game.activity.agents.filter((x: any) => x.species === "horse")[1];
    h.greetUntil = 1e6;
    h.model.rotation.y = -Math.PI / 2;
    a.setPlayer({
      x: h.state.x + 1.5,
      y: 0,
      z: h.state.z,
      yaw: -Math.PI / 2,
      pitch: 0,
    });
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(() => !!(window as any).bw2.game.activity.riding),
  ).toBe(true);
  const j = (await page.locator("#joystick").boundingBox())!,
    x = j.x + j.width / 2,
    y = j.y + j.height / 2,
    cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x, y: y - 35, id: 1 }],
  });
  await page.waitForTimeout(350);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.x),
  ).toBeGreaterThan(174);
  await page.evaluate(() =>
    (window as any).bw2.simulate({ forward: 1, right: 0 }, 4.5),
  );
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.x),
  ).toBeGreaterThan(195);
  await page.evaluate(() => {
    const a = (window as any).bw2;
    a.simulate({ forward: 0, right: -1 }, 1);
    a.simulate({ forward: 1, right: 0 }, 18);
  });
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.z),
  ).toBeLessThan(50);
  await page.locator("#cameraMode").tap();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).bw2.game.body.group.visible),
    )
    .toBe(true);
  await page.screenshot({ path: "test-results/county-riding.png" });
  await page.locator("#flyMode").tap();
  expect(await page.evaluate(() => (window as any).bw2.game.flying)).toBe(
    false,
  );
  const z = await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.save();
    return a.game.activity.riding.state.z;
  });
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.riding),
  ).toBeNull();
  expect(await page.evaluate(() => (window as any).bw2.game.player.y)).toBe(0);
  expect(
    await page.evaluate(
      () =>
        (window as any).bw2.game.activity.agents.filter(
          (x: any) => x.species === "horse",
        )[1].state.z,
    ),
  ).toBeCloseTo(z, 0);
  await page.evaluate(() => {
    const a = (window as any).bw2,
      h = a.game.activity.agents.filter((x: any) => x.species === "horse")[1];
    a.setPlayer({ x: h.state.x + 1.6, y: 0, z: h.state.z });
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(() => !!(window as any).bw2.game.activity.riding),
  ).toBe(true);
  await page.locator("#use").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.game.activity.riding),
  ).toBeNull();
  await page.locator("#home").tap();
  expect(
    await page.evaluate(() => (window as any).bw2.game.player.x),
  ).toBeCloseTo(-21.4, 1);
});
