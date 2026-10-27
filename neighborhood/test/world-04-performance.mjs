import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const html03 = await readFile("../BlockWorld_Neighborhood_03.html", "utf8"),
  html04 = await readFile("../BlockWorld_Neighborhood_04.html", "utf8");
const out = "../work/world-04/performance";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const report = {
  browser: await browser.version(),
  renderer:
    "Linux headless Chromium, ANGLE SwiftShader software GPU; not Lenovo/iPhone",
  viewport: { width: 800, height: 600 },
  dpr: 1,
  date: new Date().toISOString(),
  releaseSha256: createHash("sha256").update(html04).digest("hex"),
  samples: [],
};
async function sample(page, name, pose) {
  await page.evaluate(
    (p) =>
      blockworld.test.setPlayer({
        vy: 0,
        grounded: true,
        y: 0,
        pitch: 0,
        ...p,
      }),
    pose,
  );
  await page.waitForTimeout(1500);
  const data = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const frames = [];
        let last = performance.now(),
          start = last;
        function tick(now) {
          frames.push(now - last);
          last = now;
          if (now - start < 5000) return requestAnimationFrame(tick);
          frames.sort((a, b) => a - b);
          resolve({
            frames: frames.length,
            seconds: (now - start) / 1000,
            fps: (frames.length * 1000) / (now - start),
            p50: frames[Math.floor(frames.length * 0.5)],
            p95: frames[Math.floor(frames.length * 0.95)],
            p99: frames[Math.floor(frames.length * 0.99)],
            over50ms: frames.filter((x) => x > 50).length,
            stats: blockworld.stats(),
          });
        }
        requestAnimationFrame(tick);
      }),
  );
  data.simulateOneSecondCPUms = await page.evaluate(() => {
    const t = performance.now();
    blockworld.test.simulate({}, 1);
    return performance.now() - t;
  });
  const nextFrame = page.evaluate(
    () =>
      new Promise((resolve) =>
        document.getElementById("jump").addEventListener(
          "pointerup",
          () => {
            const t = performance.now();
            requestAnimationFrame(() => resolve(performance.now() - t));
          },
          { once: true, capture: true },
        ),
      ),
  );
  await page.tap("#jump");
  data.touchReleaseToNextRAFms = await nextFrame;
  report.samples.push({ name, ...data });
  console.log(name, JSON.stringify(data));
}
try {
  for (const version of [3, 4]) {
    const c = await browser.newContext({
      viewport: report.viewport,
      hasTouch: true,
      isMobile: true,
      deviceScaleFactor: 1,
    });
    await c.route("**/*", (r) =>
      r.fulfill({
        contentType: "text/html",
        body: version === 3 ? html03 : html04,
      }),
    );
    await c.setOffline(true);
    const page = await c.newPage();
    const start = performance.now();
    await page.goto("http://localhost:8080/?test=1");
    await page.waitForFunction(() => window.blockworld?.ready);
    const ready = performance.now() - start;
    await page.tap("#play");
    console.log("startup", version, ready);
    report[`readyMs${version}`] = ready;
    await sample(page, `${version}-home`, { x: -14.4, z: -1.2, yaw: 0 });
    if (version === 4) {
      for (const [name, pose] of [
        ["village", { x: 49, z: -18, yaw: 0 }],
        ["park", { x: 65, z: 55, yaw: 0 }],
        ["woods", { x: -65, z: -103, yaw: 0 }],
      ])
        await sample(page, `4-${name}`, pose);
      const load = await page.evaluate(() => {
        const data = blockworld.snapshot();
        data.blocks = [];
        for (let x = -81; x < -56; x++)
          for (let z = 49; z < 69; z++)
            for (let y = 0; y < 24; y++)
              data.blocks.push({
                x,
                y,
                z,
                type: ["wood", "stone", "brick", "glass"][
                  (x + z + y + 400) % 4
                ],
              });
        data.player = { x: -52, y: 0, z: 60, yaw: Math.PI / 2, pitch: 0 };
        const t = performance.now();
        blockworld.test.load(data);
        return {
          ms: performance.now() - t,
          blocks: blockworld.snapshot().blocks.length,
        };
      });
      report.stressLoad = load;
      await sample(page, "4-12000-pieces", { x: -52, z: 60, yaw: Math.PI / 2 });
      const edit = await page.evaluate(() => {
        const before = blockworld.test.chunkInfo();
        const t = performance.now();
        blockworld.test.undo(); // imported builds intentionally have no undo history
        // Remove via crosshair, then undo, using the actual gameplay path.
        blockworld.test.lookAt(-56.5, 0.5, 60.5);
        const found = blockworld.test.target();
        const picked = performance.now();
        const removed = blockworld.test.remove();
        const removedAt = performance.now();
        const undone = blockworld.test.undo();
        return {
          target: found.target,
          removed,
          undone,
          targetMs: picked - t,
          removeMs: removedAt - picked,
          undoMs: performance.now() - removedAt,
          before,
          after: blockworld.test.chunkInfo(),
        };
      });
      assert.equal(edit.removed, true);
      assert.equal(edit.undone, true);
      assert.equal(edit.after.rebuilt - edit.before.rebuilt, 2);
      const kept = edit.before.groups.filter((g) =>
        edit.after.groups.some((v) => v.key === g.key && v.id === g.id),
      );
      assert.ok(kept.length > 0);
      report.stressEdit = { ...edit, unaffectedChunksKept: kept.length };
    }
    await c.close();
  }
  await writeFile(`${out}/results.json`, JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
