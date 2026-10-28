import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  launch,
  openGame,
  pose,
  speed,
  releases,
} from "./browser-06-helpers.mjs";
const out = "../work/world-06/motion";
await mkdir(out, { recursive: true });
const b = await launch(),
  runs = [];
try {
  const warm = await openGame(b, 5);
  await warm.page.waitForTimeout(1000);
  await warm.context.close();
  for (const version of [5, 6, 6, 5]) {
    const g = await openGame(b, version),
      p = g.page,
      views = [];
    for (const [name, preset, v] of [
      ["linden-walking", "normal", { x: -12, z: -143, yaw: Math.PI / 2 }],
      ["willow-fast", "fast", { x: 0, z: 128, yaw: -Math.PI / 2 }],
    ]) {
      await speed(p, preset);
      await pose(p, v);
      await p.waitForTimeout(1200);
      const before = await p.evaluate(() => blockworld.snapshot().player);
      await p.keyboard.down("KeyW");
      const result = await p.evaluate(
        () =>
          new Promise((resolve) => {
            const times = [],
              stats = [];
            let start = performance.now(),
              last = start,
              next = start;
            function tick(now) {
              times.push(now - last);
              last = now;
              if (now >= next) {
                stats.push(blockworld.stats());
                next = now + 400;
              }
              if (now - start < 5000) return requestAnimationFrame(tick);
              const sorted = [...times].sort((a, b) => a - b);
              resolve({
                frames: times.length,
                seconds: (now - start) / 1000,
                fps: (times.length * 1000) / (now - start),
                p95: sorted[Math.floor((sorted.length - 1) * 0.95)],
                frameTimes: times,
                stats,
                player: blockworld.snapshot().player,
              });
            }
            requestAnimationFrame(tick);
          }),
      );
      await p.keyboard.up("KeyW");
      const distance = Math.hypot(
        result.player.x - before.x,
        result.player.z - before.z,
      );
      assert.ok(distance > (preset === "fast" ? 24 : 12));
      views.push({ name, preset, distance, ...result });
    }
    assert.deepEqual(g.errors, []);
    runs.push({ version, views });
    console.log(
      "PASS motion",
      version,
      views.map((v) => v.name + ":" + v.fps.toFixed(1)).join(" "),
    );
    await g.context.close();
  }
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        browser: await b.version(),
        renderer: "Linux Chromium / ANGLE SwiftShader; not physical hardware",
        viewport: { width: 800, height: 600 },
        order: [5, 6, 6, 5],
        releaseSha256: createHash("sha256").update(releases[6]).digest("hex"),
        runs,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
