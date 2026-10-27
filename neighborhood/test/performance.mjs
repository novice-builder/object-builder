// Reproducible software-renderer samples: same camera, empty and 800-piece scenes.
// These numbers are NOT Lenovo measurements or performance acceptance criteria.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const html = await readFile(
  new URL("../../BlockWorld_Neighborhood_01.html", import.meta.url),
  "utf8",
);
const output = new URL("../../work/verification/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const ctx = await browser.newContext({
  viewport: { width: 1024, height: 640 },
  deviceScaleFactor: 1,
});
let requests = 0;
const errors = [];
await ctx.route("**/*", (r) => {
  requests++;
  return r.fulfill({ contentType: "text/html", body: html });
});
await ctx.setOffline(true);
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://localhost:8080/?test=1");
  await page.waitForFunction(() => blockworld?.ready);
  assert.equal(requests, 1);
  assert.equal(await page.locator("#fatal").isVisible(), false);
  await page.screenshot({ path: new URL("welcome.png", output).pathname });
  await page.click("#play");
  await page.evaluate(() => {
    blockworld.test.setPlayer({ x: 1, y: 0, z: 8, vy: 0 });
    blockworld.test.lookAt(2, 1.5, -1);
  });
  const measure = () =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          const intervals = [],
            start = performance.now();
          let last = start;
          function tick(now) {
            intervals.push(now - last);
            last = now;
            if (now - start < 3500) {
              requestAnimationFrame(tick);
              return;
            }
            const sorted = intervals.slice(1).sort((a, b) => a - b);
            resolve({
              durationMs: Math.round(now - start),
              averageFps: +((intervals.length * 1000) / (now - start)).toFixed(
                1,
              ),
              p95FrameMs:
                +sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(1),
              ...blockworld.stats(),
            });
          }
          requestAnimationFrame(tick);
        }),
    );
  const empty = await measure();
  const data = await page.evaluate(() => {
    const s = blockworld.snapshot(),
      solids = blockworld.test.world().solids;
    s.blocks = [];
    for (let y = 0; y < 10 && s.blocks.length < 800; y++)
      for (let x = -7; x < 23 && s.blocks.length < 800; x++)
        for (let z = -3; z < 4 && s.blocks.length < 800; z++) {
          if (
            !solids.some(
              (b) =>
                x < b.maxX &&
                x + 1 > b.minX &&
                y < b.maxY &&
                y + 1 > b.minY &&
                z < b.maxZ &&
                z + 1 > b.minZ,
            )
          )
            s.blocks.push({
              x,
              y,
              z,
              type: ["wood", "brick", "stone", "glass"][(x + 7) % 4],
            });
        }
    return s;
  });
  await page.addInitScript(
    (s) =>
      localStorage.setItem("blockworld.neighborhood.01", JSON.stringify(s)),
    data,
  );
  await page.reload();
  await page.waitForFunction(() => blockworld?.ready);
  await page.click("#play");
  await page.evaluate(() => {
    blockworld.test.setPlayer({ x: 1, y: 0, z: 8, vy: 0 });
    blockworld.test.lookAt(2, 1.5, -1);
  });
  const stress = await measure();
  assert.equal(stress.blocks, 800);
  assert.ok(
    stress.triangles >= 9600,
    "all instanced build batches should be visible",
  );
  const limitMessage = await page.evaluate(() =>
    blockworld.test.add({ x: 25, y: 0, z: 1, type: "wood" }),
  );
  assert.match(limitMessage, /full/);
  await page.screenshot({ path: new URL("stress-800.png", output).pathname });
  // Check final indoor floor and adjusted roof from fresh, isolated document.
  await page.evaluate(() => {
    blockworld.test.fresh();
    blockworld.test.setPlayer({ x: -12.4, y: 0, z: -7.1, vy: 0 });
    blockworld.test.lookAt(-10.8, 0.9, -8.1);
  });
  await page.waitForTimeout(250);
  await page.screenshot({
    path: new URL("interior-final.png", output).pathname,
  });
  for (const id of ["home", "rose"]) {
    const h = await page.evaluate(
      (id) => blockworld.test.world().houses.find((h) => h.id === id),
      id,
    );
    for (const side of [-1, 1]) {
      const image = await page.evaluate(
        ({ h, side }) =>
          blockworld.test.overview(h.x + 10, 6, h.z + side * 12, h.x, 1.6, h.z),
        { h, side },
      );
      await writeFile(
        new URL(`${id}-${side === 1 ? "south" : "north"}.png`, output),
        Buffer.from(image.split(",")[1], "base64"),
      );
    }
  }
  assert.deepEqual(errors, []);
  const report = {
    browser: await browser.version(),
    renderer: "ANGLE SwiftShader software renderer; headless cloud, not tablet",
    viewport: { width: 1024, height: 640 },
    quality: "gentle DPR 1, no shadows",
    empty,
    stress,
    requests,
    errors,
    offlineBoot:
      "Document fulfilled locally with network disabled before navigation; no external assets requested",
    notes:
      "Short software-renderer samples, not a hardware benchmark. First frame excludes network/download time; heap excludes GPU and total process memory.",
  };
  await writeFile(
    new URL("performance.json", output),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
