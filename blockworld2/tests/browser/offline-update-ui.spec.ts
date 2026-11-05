import { test, expect } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { localPreview } from "./local-preview";
test("failed saving blocks a waiting update; recovered progress survives explicit activation and offline reload", async ({
  browser,
}) => {
  const host = await localPreview(),
    context = await browser.newContext({
      viewport: { width: 1024, height: 600 },
      hasTouch: true,
    });
  try {
    const page = await context.newPage();
    await page.goto(host.url);
    await page.waitForFunction(() => (window as any).bw2?.session.ready);
    await expect(page.locator("#offlineState")).toContainText("Offline ready");
    await page.reload();
    await page.waitForFunction(
      () =>
        navigator.serviceWorker.controller &&
        (window as any).bw2?.session.ready,
    );
    const original = await page.evaluate(async () => {
      const a = (window as any).bw2;
      await a.session.newWorld("blank");
      a.add({ x: 5, y: 0, z: 0, type: "wood" });
      await a.session.save();
      const cache = await caches.open("blockworld-neighborhood-06-v1");
      await cache.put("/old-sentinel", new Response("preserved"));
      return a.session.current.id;
    });
    const metadata = JSON.parse(
        await readFile(path.join(host.folder, "release.json"), "utf8"),
      ),
      worker = await readFile(path.join(host.folder, "sw.js"), "utf8");
    await writeFile(
      path.join(host.folder, "sw.js"),
      worker.replace(metadata.build, "ui-" + metadata.build),
    );
    await writeFile(
      path.join(host.folder, "release.json"),
      JSON.stringify({ ...metadata, build: "ui-" + metadata.build }),
    );
    await page.evaluate(
      async () =>
        await (await navigator.serviceWorker.getRegistration())!.update(),
    );
    await expect(page.locator("#updateReady")).toBeVisible();
    await page.evaluate(() => {
      const a = (window as any).bw2;
      a.session.store.db.close();
      a.add({ x: 6, y: 0, z: 0, type: "wood" });
    });
    await expect(page.locator("#saveAlert")).toBeVisible();
    await expect(page.locator("#updateReady")).toBeDisabled();
    expect(
      await page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration())?.waiting,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Save as new copy", exact: true })
      .tap();
    await expect(page.locator("#saveAlert")).toHaveCount(0);
    const recovered = await page.evaluate(
      () => (window as any).bw2.session.current.id,
    );
    expect(recovered).not.toBe(original);
    await Promise.all([
      page.waitForEvent("framenavigated"),
      page.locator("#updateReady").tap(),
    ]);
    await page.waitForFunction(() => (window as any).bw2?.session.ready);
    expect(
      await page.evaluate(() => (window as any).bw2.session.current.id),
    ).toBe(recovered);
    expect(
      await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
    ).toBe(2);
    await context.setOffline(true);
    await page.close();
    const cold = await context.newPage();
    await cold.goto(host.url);
    await cold.waitForFunction(() => (window as any).bw2?.session.ready);
    expect(
      await cold.evaluate(() => (window as any).bw2.snapshot().blocks.length),
    ).toBe(2);
    expect(
      await cold.evaluate(
        async () =>
          await (
            await (
              await caches.open("blockworld-neighborhood-06-v1")
            ).match("/old-sentinel")
          )?.text(),
      ),
    ).toBe("preserved");
  } finally {
    await context.close();
    await host.close();
  }
});
