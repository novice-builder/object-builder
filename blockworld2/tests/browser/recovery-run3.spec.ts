import { test, expect } from "@playwright/test";
test("closed storage reopens for a recovered copy while preserving the original", async ({
  page,
}) => {
  await page.goto("/?test=1");
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  const original = await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    const id = a.session.current.id;
    a.session.store.db.close();
    a.add({ x: 5, y: 0, z: 0, type: "wood" });
    return id;
  });
  await expect(page.locator("#saveAlert")).toBeVisible();
  await page
    .getByRole("button", { name: "Save as new copy", exact: true })
    .tap();
  await expect(page.locator("#saveAlert")).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).bw2.session.current.id),
  ).not.toBe(original);
  expect(
    await page.evaluate(
      (original) =>
        (window as any).bw2.session.store
          .load(original)
          .then((r: any) => r.snapshot.world.blocks.length),
      original,
    ),
  ).toBe(0);
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
  await expect(page.locator("#offlineState")).toContainText("Offline ready");
});
