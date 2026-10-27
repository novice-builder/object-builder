import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const html = await readFile("../BlockWorld_Neighborhood_03.html", "utf8"),
  expected = process.env.EXPECT_MENU_SCROLL !== "0";
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const c = await b.newContext({
  viewport: { width: 390, height: 744 },
  hasTouch: true,
  isMobile: true,
});
await c.route("**/*", (r) =>
  r.fulfill({ contentType: "text/html", body: html }),
);
const p = await c.newPage();
await p.goto("http://localhost:8080/?test=1");
await p.waitForFunction(() => blockworld?.ready);
await p.tap("#play");
await p.tap("#menu");
await p.locator("#quality").scrollIntoViewIfNeeded();
try {
  const r = await p.locator("#quality").boundingBox(),
    before = await p.locator(".settingsScroll").evaluate((e) => e.scrollTop),
    quality = await p.evaluate(() => blockworld.controls().quality),
    cdp = await c.newCDPSession(p);
  const x = r.x + r.width / 2,
    y = r.y + r.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y, id: 1 }],
  });
  for (let i = 1; i <= 8; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: y - i * 20, id: 1 }],
    });
    await p.waitForTimeout(25);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await p.waitForTimeout(200);
  const after = await p.locator(".settingsScroll").evaluate((e) => e.scrollTop);
  assert.equal(after > before + 30, expected);
  assert.equal(
    await p.evaluate(() => blockworld.controls().quality),
    quality,
    "scroll cannot activate quality",
  );
  const report = {
    before,
    after,
    scrollStartingOnButton: after > before + 30,
    qualityUnchanged: true,
  };
  console.log(report);
  await writeFile(
    "../work/controls-03/verification/" +
      (expected ? "menu-scroll.json" : "menu-scroll-before.json"),
    JSON.stringify(report, null, 2),
  );
} finally {
  await b.close();
}
