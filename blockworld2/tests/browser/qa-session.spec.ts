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
  await page
    .locator("#import")
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from("{broken"),
    });
  await expect(page.locator("#worldError")).not.toBeEmpty();
});
