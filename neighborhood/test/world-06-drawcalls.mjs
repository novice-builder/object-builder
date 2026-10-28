import { launch, openGame, pose } from "./browser-06-helpers.mjs";
import { writeFile } from "node:fs/promises";
const b = await launch(),
  r = [];
try {
  for (const version of [5, 6]) {
    const g = await openGame(b, version);
    for (const [name, v] of [
      ["home", { x: -14.4, z: -1.2 }],
      ["linden", { x: -30, z: -143, yaw: Math.PI / 2 }],
      ["willow", { x: -18, z: 128, yaw: -Math.PI / 2 }],
    ]) {
      await pose(g.page, v);
      await g.page.waitForTimeout(500);
      r.push({
        version,
        name,
        ...(await g.page.evaluate(() => {
          const { png, ...stats } = blockworld.test.fogAudit();
          return stats;
        })),
      });
    }
    await g.context.close();
  }
  console.log(r);
  await writeFile(
    "../work/world-06/current-drawcall-probe.json",
    JSON.stringify(r, null, 2),
  );
} finally {
  await b.close();
}
