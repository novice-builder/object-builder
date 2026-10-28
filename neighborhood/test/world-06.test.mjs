import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { makeWorld, localToWorld, doorBox } from "../src/world.js";
import {
  freshState,
  validateSave,
  bodyBox,
  overlaps,
  collides,
  movePlayer,
  placementReason,
} from "../src/core.js";
import { WORLD } from "../src/world-config.js";
import { distanceToLine } from "../src/districts.js";
import { SpatialIndex, around } from "../src/spatial.js";
import { initializeDoor, requestDoor, updateDoors } from "../src/doors.js";
const w = makeWorld(new T.Scene()),
  index = new SpatialIndex();
for (const b of w.solids) index.add(b);
const near = (d) => index.query(around({ ...d.center, y: 0 }, 4));
const actor = (d, side, dist = 2) => ({
  x: d.center.x + Math.sin(d.baseAngle) * side * dist,
  z: d.center.z + Math.cos(d.baseAngle) * side * dist,
  y: 0,
  yaw: d.baseAngle + (side < 0 ? Math.PI : 0),
  vy: 0,
  grounded: true,
});
const tick = (d, p, seconds, start = 0, auto = true) => {
  for (let t = 0; t < seconds; t += 0.016)
    updateDoors([d], p, [], near(d), auto, start + t, 0.016);
};
test("500m layout is dense and varied", () => {
  assert.equal(WORLD.halfSize, 250);
  assert.ok(w.houses.length >= 70);
  assert.ok(w.clearings.length >= 17);
  assert.ok(w.solids.filter((b) => b.ramp).length >= 6);
});
test("building footprints clear roads, trails and one another", () => {
  const bounds = (h) => {
    const c = Math.abs(Math.cos(h.angle)),
      s = Math.abs(Math.sin(h.angle));
    return {
      minX: h.x - (h.w * c + h.d * s) / 2 - 0.2,
      maxX: h.x + (h.w * c + h.d * s) / 2 + 0.2,
      minZ: h.z - (h.w * s + h.d * c) / 2 - 0.2,
      maxZ: h.z + (h.w * s + h.d * c) / 2 + 0.2,
      minY: 0,
      maxY: 10,
    };
  };
  for (const [i, h] of w.houses.entries()) {
    const b = bounds(h);
    for (const o of w.houses.slice(0, i))
      assert.ok(!overlaps(b, bounds(o)), `${h.id}/${o.id}`);
    for (let x = b.minX; x < b.maxX; x += 0.7)
      for (let z = b.minZ; z < b.maxZ; z += 0.7) {
        assert.ok(
          w.roads.every((l) => distanceToLine(x, z, l).distance > 3.7),
          `${h.id} road ${x},${z}`,
        );
        assert.ok(
          w.trails.every((l) => distanceToLine(x, z, l).distance > 1.15),
          `${h.id} trail ${x},${z}`,
        );
      }
  }
});
test("front walks clear solid obstructions", () => {
  for (const [i, d] of w.drives.entries())
    for (let j = 1; j < d.points.length; j++)
      for (let t = 0; t <= 1; t += 0.04) {
        const a = d.points[j - 1],
          b = d.points[j],
          p = {
            x: a[0] + (b[0] - a[0]) * t,
            z: a[1] + (b[1] - a[1]) * t,
            y: 0,
          };
        assert.ok(
          !collides(p, index.query(around(p))),
          `${w.houses[i].id} segment${j} t${t}`,
        );
      }
});
test("road and path network is connected", () => {
  const lines = [...w.roads, ...w.trails],
    seen = new Set([0]);
  for (let pass = 0; pass < lines.length; pass++)
    for (let i = 0; i < lines.length; i++)
      if (!seen.has(i))
        for (const j of seen)
          if (
            lines[i].some((p) => distanceToLine(...p, lines[j]).distance < 4)
          ) {
            seen.add(i);
            break;
          }
  assert.equal(seen.size, lines.length);
});
test("all trees clear roads, trails and driveways and have solid trunks", () => {
  for (const p of w.treePositions) {
    assert.ok(
      w.roads.every((l) => distanceToLine(p.x, p.z, l).distance >= 4.8),
    );
    assert.ok(
      w.trails.every((l) => distanceToLine(p.x, p.z, l).distance >= 2.1),
    );
    assert.ok(
      w.drives.every((d) => distanceToLine(p.x, p.z, d.points).distance >= 2.2),
    );
    assert.ok(
      collides({ ...p, y: 0 }, index.query(around(p))),
      `trunk ${p.x},${p.z}`,
    );
  }
});
test("vacant frontages have clear placeable centres and road setbacks", () => {
  for (const f of w.clearings.filter((f) => f.street)) {
    assert.equal(
      placementReason(
        { x: Math.floor(f.x), z: Math.floor(f.z), y: 0, type: "wood" },
        freshState(),
        w.solids,
        null,
        false,
      ),
      "",
      f.id,
    );
    for (let x = f.x - f.w / 2; x < f.x + f.w / 2; x += 2)
      for (let z = f.z - f.d / 2; z < f.z + f.d / 2; z += 2)
        assert.ok(
          w.roads.every((l) => distanceToLine(x, z, l).distance > 3.7),
          f.id,
        );
  }
});
test("all swing and roller doors auto/manual operate safely from both sides", () => {
  for (const d of w.doors)
    for (const side of [1, -1]) {
      initializeDoor(d);
      const p = actor(d, side);
      assert.ok(!collides(p, near(d)), `${d.id} approach blocked ${side}`);
      tick(d, p, 0.18);
      assert.ok(d.targetOpen, `${d.id} trigger ${side}`);
      assert.ok(Math.abs(d.angle) > 0.02 && Math.abs(d.angle) < 1.57);
      tick(d, p, 1, 0.18);
      assert.ok(Math.abs(d.angle) > 1.56, `${d.id} fully open ${side}`);
      const far = actor(d, side, 5);
      tick(d, far, 0.8, 2);
      assert.ok(d.targetOpen);
      tick(d, far, 2.5, 2.8);
      assert.ok(!d.targetOpen && Math.abs(d.angle) < 0.001, `${d.id} closed`);
      assert.ok(
        requestDoor(d, true, p, [], near(d), true).ok,
        `${d.id} manual`,
      );
      tick(d, p, 1, 6, false);
      assert.ok(Math.abs(d.angle) > 1.56);
      assert.ok(requestDoor(d, false, p, [], near(d), true).ok);
      tick(d, p, 1, 7, false);
      assert.ok(Math.abs(d.angle) < 0.001);
    }
});
test("Fast movement passes every open door from both sides; closed doors stop it", () => {
  for (const d of w.doors)
    for (const side of [1, -1]) {
      initializeDoor(d);
      let p = actor(d, side, 2.2);
      for (let t = 0; t < 1.1; t += 0.016) {
        updateDoors([d], p, [], near(d), true, t, 0.016, null, "fast");
        movePlayer(p, { forward: 1, walkSpeed: "fast" }, 0.016, [
          ...near(d),
          doorBox(d),
        ]);
      }
      const signed =
        (p.x - d.center.x) * Math.sin(d.baseAngle) +
        (p.z - d.center.z) * Math.cos(d.baseAngle);
      assert.ok(signed * side < -0.7, `${d.id} fast ${side} ${signed}`);
      initializeDoor(d);
      p = actor(d, side);
      for (let t = 0; t < 1; t += 0.016)
        movePlayer(p, { forward: 1, walkSpeed: "fast" }, 0.016, [
          ...near(d),
          doorBox(d),
        ]);
      assert.ok(!overlaps(bodyBox(p), doorBox(d)));
      const after =
        (p.x - d.center.x) * Math.sin(d.baseAngle) +
        (p.z - d.center.z) * Math.cos(d.baseAngle);
      assert.ok(after * side > 0.1, `${d.id} closed collision`);
    }
});
test("roller closing refuses player occupancy", () => {
  const d = w.doors.find((d) => d.kind === "roller");
  initializeDoor(d, true, 1);
  const p = actor(d, 1, 0.05);
  assert.ok(!requestDoor(d, false, p, [], near(d), true).ok);
  tick(d, p, 3);
  assert.ok(d.targetOpen);
});
test("staircases ascend and descend smoothly with edge protection", () => {
  for (const b of w.solids.filter((b) => b.ramp)) {
    const r = b.ramp,
      angle = Math.atan2(r.s, r.c);
    let q = localToWorld({ x: r.cx, z: r.cz, angle }, 0, r.length / 2 - 0.05),
      p = { ...q, y: 0, vy: 0, grounded: true, yaw: angle };
    for (let t = 0; t < r.length / 3.4 + 0.5; t += 0.016)
      movePlayer(
        p,
        { forward: 1, edgeProtection: true },
        0.016,
        index.query(around({ ...p, y: 0 }, 3)),
      );
    assert.ok(p.y > 3.1, `stairs up ${r.cx},${r.cz} ${p.y}`);
    p.yaw += Math.PI;
    for (let t = 0; t < r.length / 3.4 + 0.9; t += 0.016)
      movePlayer(
        p,
        { forward: 1, edgeProtection: true },
        0.016,
        index.query(around({ ...p, y: 0 }, 3)),
      );
    assert.ok(p.y < 0.1, `stairs down ${r.cx},${r.cz} ${p.y}`);
  }
});
test("room waypoints stand in clear supported spaces", () => {
  for (const r of w.rooms)
    assert.ok(!collides(r, index.query(around(r))), `${r.house} ${r.name}`);
});
test("05 migration reserves conflicting town property without losing blocks", () => {
  const data = {
      ...freshState(),
      version: 3,
      world: "little-block-world-05",
      blocks: [{ x: -30, y: 0, z: -159, type: "wood" }],
    },
    reserved = makeWorld(new T.Scene(), data.blocks),
    s = validateSave(data, reserved.solids);
  assert.deepEqual(s.blocks, data.blocks);
  assert.ok(reserved.omitted.includes("north-n-3"));
  assert.equal(s.world, WORLD.id);
});
test("invalid schemas rejected and large 12k structure restores", () => {
  assert.throws(() =>
    validateSave({ ...freshState(), version: 3, world: WORLD.id }),
  );
  assert.throws(() =>
    validateSave({
      ...freshState(),
      blocks: [{ x: 0, y: 0, z: 0, type: "unknown" }],
    }),
  );
  const s = freshState();
  for (let x = -81; x < -56; x++)
    for (let z = 49; z < 69; z++)
      for (let y = 0; y < 24; y++) s.blocks.push({ x, z, y, type: "wood" });
  assert.equal(validateSave(s, w.solids).blocks.length, 12000);
});
test("ground-floor rooms and former closed wings have walkable interior routes", () => {
  for (const h of w.houses) {
    const targets = w.rooms.filter(
      (r) => r.house === h.id && r.y === 0 && r.name !== "Entrance",
    );
    if (!targets.length) continue;
    const step = 0.2,
      start = { x: -1.4, z: h.d / 2 - 1.1 },
      local = (p) => {
        const dx = p.x - h.x,
          dz = p.z - h.z,
          c = Math.cos(h.angle),
          s = Math.sin(h.angle);
        return { x: dx * c - dz * s, z: dx * s + dz * c };
      };
    const pending = targets.map((r) => ({ name: r.name, ...local(r) })),
      queue = [[0, 0]],
      seen = new Set(["0,0"]);
    let head = 0;
    while (head < queue.length && pending.length) {
      const [ix, iz] = queue[head++],
        x = start.x + ix * step,
        z = start.z + iz * step;
      for (let j = pending.length - 1; j >= 0; j--)
        if (Math.hypot(pending[j].x - x, pending[j].z - z) < 0.27)
          pending.splice(j, 1);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = ix + dx,
          nz = iz + dz,
          key = nx + "," + nz;
        if (seen.has(key)) continue;
        seen.add(key);
        const xx = start.x + nx * step,
          zz = start.z + nz * step;
        if (
          xx < -h.w / 2 - (h.wing ? 4.5 : 0) + 0.3 ||
          xx > h.w / 2 - 0.3 ||
          zz < -h.d / 2 + 0.3 ||
          zz > h.d / 2 - 0.3
        )
          continue;
        const p = { ...localToWorld(h, xx, zz), y: 0 };
        if (!collides(p, index.query(around(p, 0.4)))) queue.push([nx, nz]);
      }
    }
    assert.deepEqual(pending, [], h.id + " disconnected rooms");
  }
});
test("every walking trail has a continuous unobstructed centre route", () => {
  for (const [i, line] of w.trails.entries())
    for (let j = 1; j < line.length; j++) {
      const a = line[j - 1],
        b = line[j],
        n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
      for (let k = 0; k <= n; k++) {
        const p = {
          x: a[0] + ((b[0] - a[0]) * k) / n,
          z: a[1] + ((b[1] - a[1]) * k) / n,
          y: 0,
        };
        assert.ok(
          !collides(p, index.query(around(p, 0.4))),
          `trail ${i},${j} ${p.x},${p.z}`,
        );
      }
    }
});
test("standard controller axes clamp/deadzone and buttons activate once per press", async () => {
  const { GamepadInput } = await import("../src/gamepad.js"),
    g = new GamepadInput(),
    pad = {
      mapping: "standard",
      connected: true,
      axes: [0.1, -0.8, 2, NaN],
      buttons: [{ pressed: true }],
    };
  let s = g.read([pad]);
  assert.equal(s.right, 0);
  assert.equal(s.forward, 0.8);
  assert.equal(s.lookX, 1);
  assert.equal(s.lookY, 0);
  assert.deepEqual(s.pressed, [0]);
  assert.deepEqual(g.read([pad]).pressed, []);
  pad.buttons[0].pressed = false;
  g.read([pad]);
  pad.buttons[0].pressed = true;
  assert.deepEqual(g.read([pad]).pressed, [0]);
  assert.equal(g.read([]).forward, 0);
});
test("each roller refuses saved-piece obstructions and reopens on a returning player", () => {
  for (const d of w.doors.filter((d) => d.kind === "roller")) {
    initializeDoor(d, true, 1);
    const far = actor(d, 1, 5),
      block = {
        x: Math.floor(d.center.x),
        z: Math.floor(d.center.z),
        y: 0,
        type: "wood",
      };
    assert.equal(
      requestDoor(d, false, far, [block], near(d), true).ok,
      false,
      d.id + " block",
    );
    assert.ok(requestDoor(d, false, far, [], near(d), true).ok);
    tick(d, far, 0.15, 0, false);
    const returning = actor(d, 1, 0.05);
    tick(d, returning, 0.8, 0.15, true);
    assert.ok(d.targetOpen, d.id + " reopened");
    assert.ok(!overlaps(bodyBox(returning), doorBox(d)));
  }
});
test("centre markings leave clear junctions including self-rejoining roads", () => {
  assert.ok(w.selfJunctions.length >= 2);
  for (const dash of w.batches.get(0xf3e6be))
    assert.ok(
      w.selfJunctions.every(
        (p) => Math.hypot(dash.x - p.x, dash.z - p.z) >= 5.5,
      ),
    );
});
test("relocated public furniture yields to compatible saved creations", () => {
  const s = {
      ...freshState(),
      version: 3,
      world: "little-block-world-05",
      blocks: [{ x: 81, y: 0, z: 100, type: "brick" }],
    },
    candidate = makeWorld(new T.Scene(), s.blocks);
  assert.deepEqual(validateSave(s, candidate.solids).blocks, s.blocks);
});
test('every two-storey envelope closes the side-wall/ceiling seam',()=>{for(const h of w.houses.filter(h=>h.storeys===2))for(const x of [-h.w/2,h.w/2])for(const z of [-h.d/2+1,0,h.d/2-1]){const p=localToWorld(h,x,z),b={minX:p.x-.005,maxX:p.x+.005,minZ:p.z-.005,maxZ:p.z+.005,minY:6.28,maxY:6.32};assert.ok(index.query(b).some(s=>overlaps(b,s)),h.id+' open upper envelope');}});
