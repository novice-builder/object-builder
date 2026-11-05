import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GamepadInput,
  radialStick,
  type PadSnapshot,
} from "../src/adventures/gamepad";
const pad = (
  axes = [0, 0, 0, 0],
  pressed: number[] = [],
  index = 0,
): PadSnapshot => ({
  index,
  mapping: "standard",
  connected: true,
  axes,
  buttons: Array.from({ length: 17 }, (_, i) => ({
    pressed: pressed.includes(i),
    value: pressed.includes(i) ? 1 : 0,
  })),
});
test("analogue sticks remove drift, bound diagonals and reject invalid values", () => {
  assert.deepEqual(radialStick(0.1, -0.08), { x: 0, y: 0 });
  assert.deepEqual(radialStick(NaN, Infinity), { x: 0, y: 0 });
  const d = radialStick(1, 1);
  assert.ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-9);
  assert.ok(radialStick(0.5, 0).x > 0 && radialStick(0.5, 0).x < 0.5);
});
test("connection and interrupted controls require neutral before movement or commands", () => {
  const g = new GamepadInput();
  assert.equal(g.sample([pad([1, 0, 0, 0], [0])]).command, null);
  assert.equal(g.state.x, 0);
  g.sample([pad()]);
  assert.equal(g.sample([pad([1, 0, 0, 0], [0])]).command, "Enter");
  assert.equal(g.state.x, 1);
  assert.equal(g.sample([pad([1, 0, 0, 0], [0])]).command, null);
  g.reset();
  assert.equal(g.sample([pad([1, 0, 0, 0], [0])]).x, 0);
  g.sample([pad()]);
  assert.equal(g.sample([pad([0, 0, 0.7, 0])]).lookX > 0, true);
});
test("disconnect and denied/inactive input drop all movement and held actions", () => {
  const g = new GamepadInput();
  g.sample([pad()]);
  g.sample([pad([1, 0, 0, 0])]);
  assert.equal(g.state.x, 1);
  g.sample([]);
  assert.equal(g.connected, false);
  assert.equal(g.state.x, 0);
  g.sample([pad()]);
  assert.equal(g.sample([pad([1, 0, 0, 0], [9])], false).command, null);
  assert.equal(g.state.x, 0);
});
test("only standard connected mappings are accepted and one priority action fires", () => {
  const g = new GamepadInput();
  g.sample([{ ...pad(), mapping: "unknown" }]);
  assert.equal(g.connected, false);
  g.sample([pad()]);
  assert.equal(g.sample([pad([0, 0, 0, 0], [0, 1, 9])]).command, "Escape");
  assert.equal(g.sample([pad([0, 0, 0, 0], [0, 1, 9])]).command, null);
  g.sample([{ ...pad(), connected: false }]);
  assert.equal(g.connected, false);
});
