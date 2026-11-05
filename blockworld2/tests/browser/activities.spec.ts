import { test, expect } from "@playwright/test";
test("touch playground activities animate and leave safely without changing builds", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => (window as any).bw2.session.newWorld("blank"));
  for (const [i, type] of [
    "swing",
    "seesaw",
    "trampoline",
    "play-slide",
  ].entries()) {
    await page.evaluate(
      ({ i, type }) => {
        const a = (window as any).bw2;
        a.add({ x: i * 5, y: 0, z: 0, type });
        a.setPlayer({ x: i * 5 + 0.5, y: 0, z: 2.5, yaw: 0, pitch: 0 });
      },
      { i, type },
    );
    await page.locator("#use").tap();
    expect(
      await page.evaluate(() => (window as any).bw2.game.playing !== null),
    ).toBe(true);
    const before = await page.evaluate(
      () => (window as any).bw2.snapshot().player,
    );
    await page.evaluate(() =>
      (window as any).bw2.simulate({ forward: 0, right: 0 }, 0.5),
    );
    const pose = await page.evaluate(() => (window as any).bw2.game.player);
    expect(pose.y).toBeGreaterThanOrEqual(0);
    expect(
      await page.evaluate(() => (window as any).bw2.snapshot().player),
    ).toEqual(before);
    await page.locator("#use").tap();
    expect(
      await page.evaluate(() => (window as any).bw2.game.playing),
    ).toBeNull();
  }
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(4);
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(4);
});
test("authored home lights and cupboards retain state through reload", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  const id = await page.evaluate(() => {
    const a = (window as any).bw2,
      p = a.game.world.authoredProps.find(
        (p: any) => p.id === "cedar-villa:light",
      );
    a.setPlayer({
      x: p.block.x + 0.5,
      y: 0,
      z: p.block.z + 2,
      yaw: 0,
      pitch: 0,
    });
    return p.id;
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(
      (id) => (window as any).bw2.snapshot().props[id].on,
      id,
    ),
  ).toBe(false);
  await page.evaluate(() => (window as any).bw2.session.save());
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(
      (id) => (window as any).bw2.snapshot().props[id].on,
      id,
    ),
  ).toBe(false);
  await page.evaluate(() => {
    const a = (window as any).bw2,
      p = a.game.world.authoredProps.find(
        (p: any) => p.id === "cedar-villa:cupboard",
      );
    a.setPlayer({
      x: p.block.x + 2.5,
      y: 0,
      z: p.block.z + 0.5,
      yaw: 0,
      pitch: 0,
    });
  });
  await page.locator("#use").tap();
  expect(
    await page.evaluate(
      () => (window as any).bw2.snapshot().props["cedar-villa:cupboard"].open,
    ),
  ).toBe(true);
});
