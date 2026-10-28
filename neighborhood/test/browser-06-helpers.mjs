import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
export const releases = {
  6: await readFile(
    new URL("../../BlockWorld_Neighborhood_06.html", import.meta.url),
    "utf8",
  ),
  5: await readFile(
    new URL("../../BlockWorld_Neighborhood_05.html", import.meta.url),
    "utf8",
  ),
};
export const launch = () =>
  chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
export async function openGame(
  browser,
  version = 6,
  viewport = { width: 800, height: 600 },
  init = null,
  dpr = 1,
) {
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: dpr,
    acceptDownloads: true,
  });
  const requests = [],
    errors = [];
  await context.route("**/*", (r) => {
    const u = r.request().url();
    requests.push(u);
    if (!u.startsWith("http://blockworld.test/")) {
      errors.push("External asset " + u);
      return r.abort();
    }
    return r.fulfill({ contentType: "text/html", body: releases[version] });
  });
  await context.setOffline(true);
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const start = performance.now();
  await page.goto("http://blockworld.test/?test=1");
  await page.waitForFunction(() => window.blockworld?.ready);
  const readyMs = performance.now() - start;
  await page.tap("#play");
  return { page, context, requests, errors, readyMs };
}
export const pose = (p, v) =>
  p.evaluate(
    (v) =>
      blockworld.test.setPlayer({
        y: 0,
        vy: 0,
        grounded: true,
        yaw: 0,
        pitch: 0,
        ...v,
      }),
    v,
  );
export const look = (p, x, y, z) =>
  p.evaluate((v) => blockworld.test.lookAt(...v), [x, y, z]);
export async function touchWorld(p, x, y, z) {
  const q = await p.evaluate((v) => blockworld.test.project(...v), [x, y, z]);
  await p.touchscreen.tap(q.x, q.y);
}
export async function speed(p, value) {
  await p.tap("#menu");
  await p.locator(`[data-walk-speed="${value}"]`).tap();
  await p.tap("#resume");
}
