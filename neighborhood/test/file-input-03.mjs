// Native label/file-picker activation is separate from the isolated button grids.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const html = await readFile("../BlockWorld_Neighborhood_03.html", "utf8"),
  results = [];
const b = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
    { width: 428, height: 760 },
  ]) {
    const c = await b.newContext({ viewport, hasTouch: true, isMobile: true });
    await c.route("**/*", (r) =>
      r.fulfill({ contentType: "text/html", body: html }),
    );
    const p = await c.newPage();
    await p.goto("http://localhost:8080/?test=1");
    await p.waitForFunction(() => blockworld?.ready);
    await p.tap("#play");
    await p.tap("#menu");
    const label = p.locator(".file-button");
    await label.scrollIntoViewIfNeeded();
    const fractions = [
      [0.5, 0.5],
      [0.5, 0],
      [0.5, 1],
      [0, 0.5],
      [1, 0.5],
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ];
    let count = 0;
    for (const [fx, fy] of fractions) {
      await label.scrollIntoViewIfNeeded();
      const r = await label.boundingBox();
      const corner = (fx === 0 || fx === 1) && (fy === 0 || fy === 1),
        inset = corner ? 8 : 1.5;
      const x = fx === 0 ? inset : fx === 1 ? r.width - inset : r.width * 0.5,
        y = fy === 0 ? inset : fy === 1 ? r.height - inset : r.height * 0.5;
      const chooser = p.waitForEvent("filechooser", { timeout: 5000 });
      await p.touchscreen.tap(r.x + x, r.y + y);
      await (await chooser).setFiles([]);
      count++;
    }
    assert.equal(
      await p.evaluate(() => blockworld.snapshot().blocks.length),
      0,
    );
    results.push({ viewport, nativeFileChooserActivations: 9 });
    console.log("PASS native Import hit areas", viewport);
    await c.close();
  }
  await writeFile(
    "../work/controls-03/verification/file-input-results.json",
    JSON.stringify(
      { results, activations: 27, physicalIPhoneVerified: false },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
