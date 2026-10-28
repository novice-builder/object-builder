import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import { makeWorld } from "../src/world.js";
import { WORLD } from "../src/world-config.js";
import { SpatialIndex, around } from "../src/spatial.js";
import { distanceToLine } from "../src/districts.js";
import {
  freshState,
  validateSave,
  placementReason,
  bodyBox,
  overlaps,
  movePlayer,
} from "../src/core.js";
import { BuildChunks } from "../src/build-chunks.js";
const scene = new T.Scene(),
  world = makeWorld(scene);
const bounds = (h) => {
  const c = Math.abs(Math.cos(h.angle)),
    s = Math.abs(Math.sin(h.angle));
  return {
    minX: h.x - (h.w * c + h.d * s) / 2 - 0.4,
    maxX: h.x + (h.w * c + h.d * s) / 2 + 0.4,
    minZ: h.z - (h.w * s + h.d * c) / 2 - 0.4,
    maxZ: h.z + (h.w * s + h.d * c) / 2 + 0.4,
    minY: 0,
    maxY: 5,
  };
};
test("500 m bounds and authored districts contain varied non-overlapping buildings clear of roads and trails", () => {
  assert.equal(WORLD.halfSize * 2, 500);
  assert.equal(world.houses.length, 40);
  assert.ok(world.treeCount > 150);
  assert.ok(
    new Set(world.houses.map((h) => `${h.w},${h.d},${h.style},${!!h.garage}`))
      .size > 10,
  );
  for (const [i, h] of world.houses.entries()) {
    const b = bounds(h);
    for (const o of world.houses.slice(0, i))
      assert.equal(overlaps(b, bounds(o)), false, `${h.id}/${o.id}`);
    for (let x = b.minX; x <= b.maxX; x += 0.4)
      for (let z = b.minZ; z <= b.maxZ; z += 0.4) {
        assert.ok(
          world.roads.every((l) => distanceToLine(x, z, l).distance > 3.7),
          `${h.id} road overlap at ${x},${z}`,
        );
        assert.ok(
          world.trails.every((l) => distanceToLine(x, z, l).distance > 1.2),
          `${h.id} trail overlap at ${x},${z}`,
        );
      }
  }
});
test("every front walkway clears walls, porch posts and landscaping", () => {
  for (let i = 0; i < world.drives.length; i++) {
    const d = world.drives[i];
    for (let j = 1; j < d.points.length; j++)
      for (let t = 0; t <= 1; t += 0.025) {
        const a = d.points[j - 1],
          b = d.points[j],
          p = {
            x: a[0] + (b[0] - a[0]) * t,
            z: a[1] + (b[1] - a[1]) * t,
            y: 0,
          };
        assert.equal(
          world.solids.some((b) => overlaps(bodyBox(p), b)),
          false,
          `${world.houses[i].id} path segment ${j} t=${t}`,
        );
      }
  }
});
test("road and path junctions form one connected exploration network", () => {
  const lines = [...world.roads, ...world.trails],
    reached = new Set([0]);
  for (let pass = 0; pass < lines.length; pass++)
    for (let i = 0; i < lines.length; i++)
      if (!reached.has(i))
        for (const j of reached)
          if (
            lines[i].some(
              (p) => distanceToLine(p[0], p[1], lines[j]).distance < 5,
            )
          ) {
            reached.add(i);
            break;
          }
  assert.equal(reached.size, lines.length);
});
test("spatial collision candidates match exhaustive collision including chunk edges", () => {
  const index = new SpatialIndex();
  for (const b of world.solids) index.add(b);
  for (let x = -249; x < 250; x += 4.3)
    for (let z = -249; z < 250; z += 5.1) {
      const p = { x, y: 0, z };
      assert.equal(
        world.solids.some((b) => overlaps(bodyBox(p), b)),
        index.query(around(p, 1)).some((b) => overlaps(bodyBox(p), b)),
      );
    }
  const p = { x: 249, y: 0, z: 249, yaw: Math.PI, vy: 0, grounded: true };
  movePlayer(p, { forward: 1, right: 1 }, 1, []);
  assert.ok(p.x <= 249.6 && p.z <= 249.6);
});
test("12,000-piece save validates with local overlap queries; 03 migration leaves source immutable", () => {
  const old = {
    version: 1,
    blocks: [{ x: 5, y: 0, z: 0, type: "wood" }],
    inventory: { bench: 2 },
    player: { x: -14.4, y: 0, z: -1.2, yaw: 0, pitch: 0 },
    doors: { home: true },
    doorSwings: { home: 1 },
  };
  const original = JSON.stringify(old),
    copy = validateSave(old, world.solids);
  assert.equal(JSON.stringify(old), original);
  assert.equal(copy.version, 3);
  assert.equal(copy.world, WORLD.id);
  assert.equal(copy.doors.home, true);
  const s = freshState();
  for (let x = -120; x < -20; x++)
    for (let z = 0; z < 120; z++) s.blocks.push({ x, y: 0, z, type: "wood" });
  assert.equal(s.blocks.length, 12000);
  const started = performance.now();
  const out = validateSave(s);
  console.log("12000-piece validation ms", performance.now() - started);
  assert.equal(out.blocks.length, 12000);
  assert.throws(() => validateSave({ ...s, world: "unknown" }));
  assert.throws(() => validateSave({ ...s, version: 1 }));
  const bad = structuredClone(s);
  bad.blocks[1] = { ...bad.blocks[0] };
  assert.throws(() => validateSave(bad));
  assert.throws(() =>
    validateSave({ ...old, blocks: [{ x: 80, y: 0, z: 0, type: "wood" }] }),
  );
});
test("larger coordinates and height work while boundaries, reach and fixed scenery stay protected", () => {
  const s = freshState(),
    b = { x: -60, y: 0, z: 60, type: "wood" },
    p = { x: -60, y: 0, z: 63 };
  assert.equal(placementReason(b, s, world.solids, p), "");
  assert.ok(placementReason({ ...b, x: 250 }, s, [], p, false));
  assert.ok(placementReason({ ...b, y: 24 }, s, [], p, false));
  assert.ok(
    placementReason(
      { x: 49, y: 0, z: -26, type: "wood" },
      s,
      world.solids,
      null,
      false,
    ),
  );
});
test("ordinary edits preserve distant chunk meshes and crafted parts remain targetable", () => {
  const parent = new T.Group(),
    geo = new T.BoxGeometry(1, 1, 1),
    mat = new T.MeshLambertMaterial(),
    chunks = new BuildChunks(parent, geo, { wood: mat }, () => mat);
  const a = { x: 1, y: 0, z: 1, type: "wood" },
    b = { x: 80, y: 0, z: 80, type: "wood" },
    bench = { x: 2, y: 0, z: 2, type: "bench", rotation: 90 };
  chunks.reset([a, b, bench]);
  const distant = chunks.groups.get("3,3"),
    before = chunks.rebuilt;
  chunks.update({ ...a, y: 1 }, true);
  assert.equal(chunks.rebuilt, before + 1);
  assert.equal(chunks.groups.get("3,3"), distant);
  assert.ok(chunks.rayMeshes().some((m) => m.userData.blocks?.includes(bench)));
  chunks.clear();
  geo.dispose();
  mat.dispose();
});

test("batched crafted items exactly match preview bounds at fine and quarter-turn rotations and raycast to their original piece", async () => {
  const { detailedPiece } = await import("../src/pieces.js");
  const geo = new T.BoxGeometry(1, 1, 1),
    mat = new T.MeshLambertMaterial(),
    parent = new T.Group(),
    chunks = new BuildChunks(parent, geo, {}, () => mat);
  for (const type of ["flowers", "lantern", "bench"])
    for (const rotation of [0, 15, 90, 180, 285]) {
      const b = { x: 80, y: 2, z: -80, type, rotation };
      chunks.reset([b]);
      parent.updateMatrixWorld(true);
      const actual = new T.Box3().setFromObject(parent),
        model = detailedPiece(b, geo, () => mat),
        expected = new T.Box3().setFromObject(model);
      assert.ok(actual.min.distanceTo(expected.min) < 0.0001);
      assert.ok(actual.max.distanceTo(expected.max) < 0.0001);
      const ray = new T.Raycaster(
        new T.Vector3(80.5, 6, -79.5),
        new T.Vector3(0, -1, 0),
      );
      const hits = ray.intersectObjects(chunks.rayMeshes());
      assert.ok(hits.length);
      const h = hits[0];
      assert.equal(h.object.userData.blocks[h.instanceId], b);
    }
  chunks.clear();
  geo.dispose();
  mat.dispose();
});

test("hidden-face meshing preserves exposed faces and picking across chunk seams after removal and restoration", () => {
  const parent = new T.Group(),
    geo = new T.BoxGeometry(1, 1, 1),
    mat = new T.MeshLambertMaterial(),
    chunks = new BuildChunks(parent, geo, { wood: mat }, () => mat);
  const a = { x: 23, y: 0, z: 2, type: "wood" },
    b = { x: 24, y: 0, z: 2, type: "wood" };
  const triangles = () =>
    chunks.rayMeshes().reduce((n, m) => n + m.geometry.index.count / 3, 0);
  chunks.reset([a, b]);
  assert.equal(triangles(), 20);
  const left = chunks.groups.get("0,0");
  chunks.update(b, false);
  assert.notEqual(chunks.groups.get("0,0"), left);
  assert.equal(triangles(), 12);
  const ray = new T.Raycaster(
    new T.Vector3(25, 0.5, 2.5),
    new T.Vector3(-1, 0, 0),
  );
  let hit = ray.intersectObjects(chunks.rayMeshes())[0];
  assert.equal(hit.object.userData.faceBlocks[hit.faceIndex], a);
  assert.equal(hit.face.normal.x, 1);
  chunks.update(b, true);
  assert.equal(triangles(), 20);
  hit = ray.intersectObjects(chunks.rayMeshes())[0];
  assert.equal(hit.object.userData.faceBlocks[hit.faceIndex], b);
  chunks.clear();
  geo.dispose();
  mat.dispose();
});

test("04 buildings, roads, trails, entrance paths and all old collidable scenery are retained exactly", async () => {
  const { readFile } = await import("node:fs/promises");
  const old = JSON.parse(
    await readFile(new URL("./fixtures/world-04-layout.json", import.meta.url)),
  );
  assert.deepEqual(world.houses.slice(0, 16), old.houses);
  assert.deepEqual(world.roads.slice(0, 2), old.roads);
  assert.deepEqual(world.trails.slice(0, 6), old.trails);
  assert.deepEqual(world.drives.slice(0, 16), old.drives);
  const current = new Set(world.solids.map((b) => JSON.stringify(b)));
  const previous = new Set(old.solids.map((b) => JSON.stringify(b)));
  for (const solid of world.solids)
    if (solid.minY >= 0 && !previous.has(JSON.stringify(solid)))
      assert.ok(
        solid.minX >= 125 ||
          solid.maxX <= -125 ||
          solid.minZ >= 125 ||
          solid.maxZ <= -125,
        "new solid encroaches on 04 buildable space",
      );
  for (const b of old.solids)
    if (b.minY >= 0)
      assert.ok(
        current.has(JSON.stringify(b)),
        `04 solid changed ${JSON.stringify(b)}`,
      );
});

test("all walking presets have the correct normalized speed, unchanged jump height and safe thin-wall/edge collision", () => {
  const speeds = { normal: 3.4, quick: 5.1, fast: 6.8 };
  for (const [walkSpeed, speed] of Object.entries(speeds))
    for (const dt of [1 / 240, 1 / 60, 0.08]) {
      const p = { x: 0, y: 0, z: 0, yaw: 0, vy: 0, grounded: true };
      movePlayer(p, { forward: 1, right: 1, walkSpeed }, dt, []);
      assert.ok(Math.abs(Math.hypot(p.x, p.z) - speed * dt) < 1e-6);
      const wall = {
        minX: -10,
        maxX: 10,
        minY: 0,
        maxY: 3,
        minZ: -0.51,
        maxZ: -0.5,
      };
      p.x = 0;
      p.z = 1;
      p.y = 0;
      p.vy = 0;
      for (let i = 0; i < 40; i++)
        movePlayer(p, { forward: 1, walkSpeed }, dt, [wall]);
      assert.ok(p.z > -0.23);
      const block = { minX: 0, maxX: 1, minZ: 0, maxZ: 1, minY: 0, maxY: 1 };
      Object.assign(p, { x: 0.5, z: 0.5, y: 1, vy: 0, grounded: true });
      for (let i = 0; i < 80; i++)
        movePlayer(p, { forward: -1, edgeProtection: true, walkSpeed }, dt, [
          block,
        ]);
      assert.ok(p.z < 0.9);
      assert.equal(p.y, 1);
    }
  for (const walkSpeed of Object.keys(speeds)) {
    const p = { x: 0, y: 0, z: 0, yaw: 0, vy: 6, grounded: false };
    let max = 0;
    for (let i = 0; i < 150; i++) {
      movePlayer(p, { walkSpeed }, 1 / 120, []);
      max = Math.max(max, p.y);
    }
    assert.ok(max > 1.09 && max < 1.13);
    assert.equal(p.y, 0);
  }
  const p = { x: 0, y: 0, z: 0, yaw: 0, vy: 0, grounded: true };
  movePlayer(p, { forward: 1, walkSpeed: "constructor" }, 0.1, []);
  assert.ok(Math.abs(p.z + 0.34) < 1e-6);
});

test("04 saves migrate without mutation or block loss; old bounds and world IDs are still validated", () => {
  const s = freshState();
  s.version = 2;
  s.world = "little-block-world-04";
  s.blocks = [
    { x: 5, y: 0, z: 0, type: "wood" },
    { x: 8, y: 0, z: 0, type: "bench", rotation: 15 },
  ];
  s.inventory.bench = 3;
  const raw = JSON.stringify(s),
    copy = validateSave(s, world.solids);
  assert.equal(JSON.stringify(s), raw);
  assert.equal(copy.version, 3);
  assert.deepEqual(copy.blocks, s.blocks);
  assert.throws(() => validateSave({ ...s, world: "unknown" }));
  assert.throws(() =>
    validateSave({ ...s, blocks: [{ x: 200, y: 0, z: 200, type: "wood" }] }),
  );
  const own = freshState();
  own.blocks = [{ x: 150, y: 0, z: 210, type: "wood" }];
  assert.equal(validateSave(own, world.solids).blocks.length, 1);
});

test("Fast automatic door approach and inside passage remain collidable and safe at every building", async () => {
  const { initializeDoor, updateDoors } = await import("../src/doors.js");
  const { localToWorld, doorBox } = await import("../src/world.js");
  for (const h of world.houses) {
    const d = world.doors.find((d) => d.id === h.id),
      nx = Math.sin(h.angle),
      nz = Math.cos(h.angle);
    initializeDoor(d);
    const p = {
      x: d.center.x + nx * 7,
      z: d.center.z + nz * 7,
      y: 0,
      yaw: h.angle,
      vy: 0,
      grounded: true,
    };
    let crossed = false;
    for (let i = 0; i < 120; i++) {
      updateDoors(
        [d],
        p,
        [],
        world.solids,
        true,
        i * 0.016,
        0.016,
        null,
        "fast",
      );
      movePlayer(p, { forward: 1, walkSpeed: "fast" }, 0.016, [
        ...world.solids,
        doorBox(d),
      ]);
      if ((p.x - d.center.x) * nx + (p.z - d.center.z) * nz < -0.9) {
        crossed = true;
        break;
      }
    }
    assert.ok(crossed, `${h.id} Fast entry`);
    initializeDoor(d);
    Object.assign(p, {
      x: d.center.x - nx * 2.2,
      z: d.center.z - nz * 2.2,
      y: 0,
      yaw: h.angle + Math.PI,
      vy: 0,
      grounded: true,
    });
    for (let i = 0; i < 50; i++)
      updateDoors(
        [d],
        p,
        [],
        world.solids,
        true,
        i * 0.016,
        0.016,
        null,
        "fast",
      );
    assert.ok(Math.abs(d.angle) > 1.56);
    for (let i = 0; i < 35; i++)
      movePlayer(p, { forward: 1, walkSpeed: "fast" }, 0.016, [
        ...world.solids,
        doorBox(d),
      ]);
    assert.ok(
      (p.x - d.center.x) * nx + (p.z - d.center.z) * nz > 0.8,
      `${h.id} Fast exit`,
    );
  }
});
