import { test } from "node:test";
import assert from "node:assert/strict";
import { smoothTrail, waterBlocked } from "../src/adventures/landscape";
test("soft woodland loop stays on dry ground with close, continuous samples", () => {
  const points = smoothTrail([
    [0, 38],
    [0, 22],
    [-9, 8],
    [-7, -9],
    [2, -24],
    [18, -27],
    [22, -13],
    [22, 8],
    [12, 17],
    [0, 22],
  ]);
  assert.deepEqual(points[0], [0, 38]);
  for (let i = 1; i < points.length; i++) {
    assert.equal(waterBlocked(points[i][0], points[i][1], "woodland"), false);
    assert.ok(
      Math.hypot(
        points[i][0] - points[i - 1][0],
        points[i][1] - points[i - 1][1],
      ) < 1.5,
    );
  }
});
test("closed woodland-edge trail joins without duplicate zero-length segments", () => {
  const points = smoothTrail([
    [39, 8],
    [47, 0],
    [56, -4],
    [64, 2],
    [66, 18],
    [57, 27],
    [46, 21],
    [39, 8],
  ]);
  assert.ok(
    Math.hypot(
      points[0][0] - points[points.length - 1][0],
      points[0][1] - points[points.length - 1][1],
    ) < 0.001,
  );
  for (let i = 1; i < points.length; i++)
    assert.ok(
      Math.hypot(
        points[i][0] - points[i - 1][0],
        points[i][1] - points[i - 1][1],
      ) > 0.01,
    );
});
