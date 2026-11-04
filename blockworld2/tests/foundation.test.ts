import { test } from "node:test";
import assert from "node:assert/strict";
import { FixedClock } from "../src/app/clock";
test("resumed or stalled frames cannot cause an unbounded simulation catch-up", () => {
  const clock = new FixedClock();
  clock.reset(100);
  let steps = 0;
  clock.tick(60000, () => steps++);
  assert.equal(steps, 5);
  clock.reset(60000);
  assert.equal(
    clock.tick(60001, () => steps++),
    0,
  );
});
test("ordinary elapsed time advances simulation in fixed steps", () => {
  const c = new FixedClock();
  c.reset(0);
  const dts: number[] = [];
  c.tick(50, (dt) => dts.push(dt));
  assert.equal(dts.length, 3);
  assert.ok(dts.every((dt) => dt === 1 / 60));
});
