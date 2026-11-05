import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { horseBox, rideStep, dismountPose } from "../src/simulation/riding";
import { Activity } from "../src/simulation/activity";
import { overlaps, collides } from "../src/player/physics.js";
import { blockColliders } from "../src/build/registry";
import { fromGame, decode, encode } from "../src/persistence/schema";
test("riding traverses long routes, turns, reverses, respects fences, overheads and bounds", () => {
  const p = { x: 198, z: 190, yaw: 0 };
  let next = rideStep(p, { forward: 1, right: 0 }, 60, []);
  assert.ok(next.z < -120);
  assert.equal(next.x, 198);
  next = rideStep(p, { forward: 1, right: 0 }, 80, [
    { minX: 190, maxX: 205, minY: 0, maxY: 1.2, minZ: 160, maxZ: 160.2 },
  ]);
  assert.ok(next.z > 161.2);
  assert.ok(rideStep(next, { forward: -1, right: 0 }, 1, []).z > next.z);
  assert.notEqual(rideStep(p, { forward: 0, right: 1 }, 1, []).yaw, p.yaw);
  const ceiling = {
    minX: 190,
    maxX: 205,
    minY: 2.3,
    maxY: 2.5,
    minZ: 160,
    maxZ: 180,
  };
  assert.ok(rideStep(p, { forward: 1, right: 0 }, 10, [ceiling]).z > 181);
  assert.ok(rideStep(p, { forward: -1, right: 0 }, 100, []).z < 237);
});
test("all three low gates can actually be walked or ridden through while open", () => {
  for (const type of ["garden-gate", "stable-door", "field-gate"]) {
    const open = blockColliders({ x: 0, y: 0, z: 0, type, open: true }),
      p = { x: 0.5, y: 0, z: 0.5, yaw: 0 };
    assert.equal(collides(p, open), false, type);
    assert.equal(
      open.some((s) => overlaps(horseBox(p, true), s)),
      false,
      type,
    );
    assert.equal(
      blockColliders({ x: 0, y: 0, z: 0, type }).some((s) =>
        overlaps(horseBox(p, true), s),
      ),
      true,
    );
  }
});
test("mounting, safe dismount, checkpoint position and horse persistence integrate", () => {
  const a = new Activity(new T.Scene(), 238, () => []),
    h = a.agents.filter((x) => x.species === "horse")[1],
    p: any = { x: h.state.x + 1.5, y: 0, z: h.state.z, yaw: 0, pitch: 0 };
  assert.match(a.mount(h, p, []), /Ride/);
  assert.equal(a.riding, h);
  for (let i = 0; i < 120; i++)
    a.update(1 / 60, p, { forward: 1, right: 0 }, []);
  assert.ok(p.z < 130);
  assert.equal(p.y, 0.8);
  const pose = a.savedPlayer(p);
  assert.equal(pose.y, 0);
  assert.equal(collides(pose, [horseBox(a.horsePose(h))]), false);
  const snapshot = fromGame({
    template: "sunbeam-county",
    player: pose,
    blocks: [],
    doors: {},
    selected: "hand",
    activity: a.snapshot(),
  });
  assert.deepEqual(decode(encode(snapshot)), snapshot);
  const b = new Activity(new T.Scene(), 238);
  b.load(snapshot.world.activity);
  assert.equal(b.riding, null);
  assert.equal(
    b.agents.filter((x) => x.species === "horse")[1].state.z,
    h.state.z,
  );
  const solid = {
    minX: -250,
    maxX: 250,
    minY: 0,
    maxY: 3,
    minZ: -250,
    maxZ: 250,
  };
  assert.throws(() => a.dismount(p, [solid]));
  assert.equal(a.riding, h);
  a.dismount(p, []);
  assert.equal(a.riding, null);
  assert.equal(p.y, 0);
  a.dispose();
  b.dispose();
});

test("county revision 2 leaves a clear riding exit while retaining revision 1 geometry", async () => {
  const { makeSunbeamCounty } = await import("../src/world/sunbeam-county");
  const { SpatialIndex, around } = await import("../src/legacy06/spatial.js");
  const old = makeSunbeamCounty(new T.Group(), 1),
    w = makeSunbeamCounty(new T.Group(), 2),
    index = new SpatialIndex();
  w.solids.forEach((s:any) => index.add(s));
  let p = { x: 173, z: 137, yaw: -Math.PI / 2 };
  for (let t = 0; t < 5; t += 1 / 60)
    p = rideStep(
      p,
      { forward: 1, right: 0 },
      1 / 60,
      index.query(around({ ...p, y: 0 }, 3)),
    );
  assert.ok(p.x > 197, JSON.stringify(p));
  assert.notDeepEqual(old.solids, w.solids);
});
