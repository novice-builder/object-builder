import { test, expect } from "@playwright/test";
test("world menu cannot expose import controls before database preparation finishes", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(() => {
    const w = window as any,
      s = w.bw2.session,
      list = s.store.list.bind(s.store);
    s.store.list = async () => {
      w.listEntered = true;
      await new Promise<void>((r) => (w.releaseList = r));
      return list();
    };
  });
  await page.locator("#worlds").tap();
  await page.waitForFunction(() => (window as any).listEntered);
  await expect(page.locator("#import")).toBeHidden();
  await page.evaluate(() => (window as any).releaseList());
  await expect(page.locator("#import")).toBeVisible();
  await page.locator("#import").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{broken"),
  });
  await expect(page.locator("#worldError")).not.toBeEmpty();
});

test("delayed world loading and overlapping saves never write one world into another", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(async () => {
    const w = window as any,
      a = w.bw2;
    await a.session.newWorld("blank");
    a.add({ x: 0, y: 0, z: 0, type: "wood" });
    await a.session.save();
    w.worldA = a.session.current.id;
    const loaded = await a.session.store.load(w.worldA);
    loaded.snapshot.world.blocks = [{ x: 2, y: 0, z: 0, type: "brick" }];
    const b = await a.session.store.create("B", loaded.snapshot);
    w.worldB = b.id;
    const store = a.session.store,
      load = store.load.bind(store),
      save = store.save.bind(store);
    store.load = async (id: string) => {
      if (id === b.id) {
        w.loadEntered = true;
        await new Promise<void>((r) => (w.releaseLoad = r));
      }
      return load(id);
    };
    store.save = async (...args: any[]) => {
      if (args[0] === w.worldA) {
        w.saveEntered = true;
        await new Promise<void>((r) => (w.releaseSave = r));
      }
      return save(...args);
    };
    w.changing = a.session.open(b.id);
  });
  await page.waitForFunction(() => (window as any).loadEntered);
  expect(await page.evaluate(() => (window as any).bw2.game.paused)).toBe(true);
  await page.evaluate(() => {
    const w = window as any;
    w.bw2.add({ x: 4, y: 0, z: 0, type: "wood" });
    w.saving = w.bw2.session.save();
    w.releaseLoad();
  });
  await page.waitForFunction(() => (window as any).saveEntered);
  await page.evaluate(async () => {
    const w = window as any;
    w.releaseSave();
    await Promise.all([w.changing, w.saving]);
  });
  expect(
    await page.evaluate(() => {
      const w = window as any;
      return w.bw2.session.current.id === w.worldB;
    }),
  ).toBe(true);
  expect(
    await page.evaluate(async () => {
      const w = window as any;
      return (
        await w.bw2.session.store.load(w.worldA)
      ).snapshot.world.blocks.map((b: any) => b.x);
    }),
  ).toEqual([0, 4]);
  expect(
    await page.evaluate(() =>
      (window as any).bw2.snapshot().blocks.map((b: any) => b.x),
    ),
  ).toEqual([2]);
});
