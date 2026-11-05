import { test, expect } from "@playwright/test";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { singleHtmlPreview } from "./local-preview";
const url = () =>
  pathToFileURL(path.resolve("standalone/BlockWorld_2_Run3_Standalone.html"))
    .href + "?test=1";
test("local-file standalone launch and storage where managed policy permits it", async ({
  page,
}) => {
  try {
    await page.goto(url());
  } catch (error) {
    if (String(error).includes("ERR_BLOCKED_BY_ADMINISTRATOR"))
      test.skip(
        true,
        "Managed Chromium blocks file://; single-file HTTP integration is tested separately",
      );
    throw error;
  }
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    a.add({ x: 5, y: 0, z: 0, type: "wood" });
    await a.session.save();
  });
  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
});
test("single-file HTML renders moves builds and restores independent worlds without other assets", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  const host = await singleHtmlPreview();
  await page.goto(host.url);
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await expect(page.locator("#offlineState")).toContainText("Local HTML");
  const before = await page.evaluate(
      () => (window as any).bw2.snapshot().player,
    ),
    j = (await page.locator("#joystick").boundingBox())!,
    x = j.x + j.width / 2,
    y = j.y + j.height / 2,
    cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x, y, id: 1 },
      { x: 600, y: 230, id: 2 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x, y: y - 30, id: 1 },
      { x: 650, y: 230, id: 2 },
    ],
  });
  await page.waitForTimeout(300);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const after = await page.evaluate(
    () => (window as any).bw2.snapshot().player,
  );
  expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(
    0.1,
  );
  expect(after.yaw).toBeLessThan(before.yaw - 0.05);
  await page.locator("#worlds").tap();
  await page.locator('[data-template="blank"]').tap();
  await expect(page.locator("#modal")).toBeHidden();
  await page.locator("#catalogueButton").tap();
  await page.locator('[data-category="Furniture"]').tap();
  await page.locator('[data-catalogue="chair"]').tap();
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
  await page.evaluate(() => (window as any).bw2.session.save());
  const id = await page.evaluate(() => (window as any).bw2.session.current.id);

  await page.reload();
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  expect(
    await page.evaluate(() => (window as any).bw2.session.current.id),
  ).toBe(id);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks[0].type),
  ).toBe("chair");
  expect(requests.filter((r) => r !== host.url)).toEqual([]);
  await host.close();
});
test("single-file HTML backup download and file input restore a separate copy", async ({
  page,
}) => {
  const host = await singleHtmlPreview();
  await page.goto(host.url);
  await page.waitForFunction(() => (window as any).bw2?.session.ready);
  await page.evaluate(async () => {
    const a = (window as any).bw2;
    await a.session.newWorld("blank");
    a.add({ x: 5, y: 0, z: 0, type: "wood" });
    await a.session.save();
  });
  const id = await page.evaluate(() => (window as any).bw2.session.current.id);
  await page.locator("#worlds").tap();
  const download = page.waitForEvent("download");
  await page.locator("#export").tap();
  const file = await (await download).path();
  expect(file).toBeTruthy();
  await page.locator("#import").setInputFiles(file!);
  await expect(page.locator("#modal")).toBeHidden();
  expect(
    await page.evaluate(() => (window as any).bw2.session.current.id),
  ).not.toBe(id);
  expect(
    await page.evaluate(() => (window as any).bw2.snapshot().blocks.length),
  ).toBe(1);
  await host.close();
});
