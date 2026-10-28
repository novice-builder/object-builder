import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { launch, openGame, pose, releases } from "./browser-06-helpers.mjs";
const out = "../work/world-06/fog";
await mkdir(out, { recursive: true });
const b = await launch(),
  results = [];
try {
  const g = await openGame(b),
    p = g.page;
  for (const [name, v] of [
    ["home", { x: -14.4, z: -1.2 }],
    ["village", { x: 49, z: -18 }],
    ["woods", { x: -65, z: -103 }],
    ["open", { x: -59, z: 61, yaw: Math.PI / 2 }],
    ["north", { x: -8, z: -189 }],
    ["east", { x: 151, z: 209, yaw: Math.PI / 2 }],
  ]) {
    await pose(p, v);
    await p.waitForTimeout(100);
    const pair = await p.evaluate(() => ({
      off: blockworld.test.fogAudit(false),
      on: blockworld.test.fogAudit(true),
    }));
    assert.equal(
      pair.on.png,
      pair.off.png,
      `${name}: culling must preserve every rendered pixel`,
    );
    assert.ok(pair.on.calls <= pair.off.calls);
    assert.ok(pair.on.triangles <= pair.off.triangles);
    results.push({
      name,
      identicalPixels: true,
      before: { calls: pair.off.calls, triangles: pair.off.triangles },
      after: {
        calls: pair.on.calls,
        triangles: pair.on.triangles,
        hiddenChunks: pair.on.hidden,
      },
    });
    console.log("PASS", name, results.at(-1));
  }
  assert.deepEqual(g.errors, []);
  await writeFile(
    `${out}/results.json`,
    JSON.stringify(
      {
        results,
        releaseSha256: createHash("sha256").update(releases[6]).digest("hex"),
        errors: g.errors,
      },
      null,
      2,
    ),
  );
  await g.context.close();
} finally {
  await b.close();
}
