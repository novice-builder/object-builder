import { test } from "node:test";
import assert from "node:assert/strict";
import { trailGeometry } from "../src/adventures/trail-geometry";
import { smoothTrail } from "../src/adventures/landscape";
test("continuous trail has finite terrain following vertices and upward faces", () => {
  const g = trailGeometry(
    smoothTrail([
      [0, 25],
      [0, 15],
      [-4, 6],
      [-9, -1],
      [-12, -9],
    ]),
    2.8,
    (x, z) => x * 0.03 + z * 0.02,
  );
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    assert.ok(Number.isFinite(p.getX(i)));
    assert.ok(
      Math.abs(p.getY(i) - p.getX(i) * 0.03 - p.getZ(i) * 0.02 - 0.045) <
        0.00001,
    );
    assert.ok(n.getY(i) > 0.9);
  }
  assert.ok(
    g.index!.count / 3 < 150,
    "ribbon avoids repeated 20-triangle caps",
  );
  g.dispose();
});
test("bridge crossing ribbon stops at both deck ends", () => {
  const g = trailGeometry(
    [
      [22, 8],
      [39, 8],
    ],
    3,
    () => 0,
    31,
  );
  const p = g.getAttribute("position"),
    ix = g.index!;
  for (let i = 0; i < ix.count; i += 3) {
    const x =
      (p.getX(ix.getX(i)) + p.getX(ix.getX(i + 1)) + p.getX(ix.getX(i + 2))) /
      3;
    assert.ok(x <= 26.001 || x >= 35.999);
  }
  g.dispose();
});
