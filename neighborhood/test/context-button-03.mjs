import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const html = await readFile("../BlockWorld_Neighborhood_03.html", "utf8"),
  checks = [];
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
    const c = await b.newContext({ viewport, isMobile: true, hasTouch: true });
    await c.route("**/*", (r) =>
      r.fulfill({ contentType: "text/html", body: html }),
    );
    const p = await c.newPage();
    await p.goto("http://localhost:8080/?test=1");
    await p.waitForFunction(() => blockworld?.ready);
    await p.tap("#play");
    await p.evaluate(() => {
      window.probeActive = false;
      window.probeClicks = 0;
      document.addEventListener(
        "click",
        (e) => {
          if (window.probeActive && e.target.closest?.("#use")) {
            window.probeClicks++;
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        },
        true,
      );
      blockworld.test.setPlayer({
        x: -14.4,
        y: 0,
        z: -3,
        yaw: 0,
        pitch: 0,
        vy: 0,
        grounded: true,
      });
    });
    for (const state of ["Open", "Close", "Make"]) {
      if (state === "Close") {
        await p.tap("#use");
        await p.waitForFunction(
          () => Math.abs(blockworld.test.world().doors[0].angle) > 1.56,
        );
      }
      if (state === "Make")
        await p.evaluate(() => {
          blockworld.test.setPlayer({
            x: -12.4,
            y: 0,
            z: -7.1,
            vy: 0,
            grounded: true,
          });
          blockworld.test.lookAt(-10.8, 0.9, -8.1);
        });
      await p.waitForFunction(
        (state) =>
          !document.getElementById("use").disabled &&
          document.getElementById("use").textContent.includes(state),
        state,
      );
      const r = await p.locator("#use").boundingBox(),
        points = [
          [r.width / 2, r.height / 2],
          [r.width / 2, 1.5],
          [r.width / 2, r.height - 1.5],
          [1.5, r.height / 2],
          [r.width - 1.5, r.height / 2],
          [8, 8],
          [r.width - 8, 8],
          [8, r.height - 8],
          [r.width - 8, r.height - 8],
        ];
      for (const [x, y] of points) {
        await p.evaluate(() => {
          window.probeActive = true;
          window.probeClicks = 0;
        });
        await p.touchscreen.tap(r.x + x, r.y + y);
        assert.equal(
          await p.evaluate(() => window.probeClicks),
          1,
          `${state} button point ${x},${y}`,
        );
      }
      await p.evaluate(() => (window.probeActive = false));
      checks.push({ viewport, state, points: 9 });
    }
    console.log("PASS gold Open/Close/Make button hit areas", viewport);
    await c.close();
  }
  await writeFile(
    "../work/controls-03/verification/context-buttons.json",
    JSON.stringify(
      { checks, activations: 81, physicalIPhoneVerified: false },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
