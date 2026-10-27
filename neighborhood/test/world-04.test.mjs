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
test("250 m bounds and authored districts contain varied non-overlapping buildings clear of roads and trails", () => {
  assert.equal(WORLD.halfSize * 2, 250);
  assert.equal(world.houses.length, 16);
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
  for (let x = -124; x < 125; x += 4.3)
    for (let z = -124; z < 125; z += 5.1) {
      const p = { x, y: 0, z };
      assert.equal(
        world.solids.some((b) => overlaps(bodyBox(p), b)),
        index.query(around(p, 1)).some((b) => overlaps(bodyBox(p), b)),
      );
    }
  const p = { x: 124, y: 0, z: 124, yaw: Math.PI, vy: 0, grounded: true };
  movePlayer(p, { forward: 1, right: 1 }, 1, []);
  assert.ok(p.x <= 124.6 && p.z <= 124.6);
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
  assert.equal(copy.version, 2);
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
  assert.ok(placementReason({ ...b, x: 125 }, s, [], p, false));
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
