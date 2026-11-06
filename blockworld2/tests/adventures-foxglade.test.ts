import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  FOX,
  FOXGLADE,
  FOXGLADE_TRAIL,
  foxBody,
  foxGladeClearing,
} from "../src/adventures/foxglade-data";
import { makeSnapshot, validateAdventure } from "../src/adventures/save";
import { createMapData } from "../src/adventures/map-data";
import { inWorld, valeWater, valeWalk } from "../src/adventures/vale-data";
import { smoothTrail } from "../src/adventures/landscape";

test("Foxglade's versioned layout preserves older independent scenes and valley constructions", () => {
  for (const layout of [3, 4, 5, 6, 7, 8] as const) {
    const snapshot = makeSnapshot(
      {
        version: 4,
        scene: "vale",
        layout,
        rooms: {},
        objects: [
          {
            id: "retained-clearing",
            asset: "barrel",
            x: FOX.x,
            z: FOX.z,
            yaw: 0.3,
            scale: 3,
          },
        ],
        discoveries: [],
      },
      { x: -105, z: 18, yaw: 0, pitch: 0.47 },
    );
    const data = validateAdventure(snapshot);
    assert.equal(data.layout, layout);
    assert.equal(data.objects[0].id, "retained-clearing");
    assert.equal(data.objects[0].x, FOX.x);
  }
  for (const scene of ["village", "woodland", "meadow"] as const) {
    const snapshot = makeSnapshot(
      { version: 4, scene, layout: 8, rooms: {}, objects: [], discoveries: [] },
      { x: 0, z: 18, yaw: 0, pitch: 0.47 },
    );
    assert.throws(() => validateAdventure(snapshot), /supported/);
  }
});
test("Foxglade's real smoothed trail joins the foresters and camp without unbridged water", () => {
  const points = smoothTrail(FOXGLADE_TRAIL.points, 0.25);
  assert.deepEqual(points[0], [-23, -38]);
  assert.deepEqual(points.at(-1), [-7, -9]);
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    assert.ok(inWorld(x, z, "vale", FOXGLADE_TRAIL.width / 2));
    assert.equal(valeWater(x, z, 8), false);
    assert.equal(valeWalk(x, z, 8), 0);
    if (i)
      assert.ok(Math.hypot(x - points[i - 1][0], z - points[i - 1][1]) < 0.6);
  }
  assert.ok(foxGladeClearing(FOX.x, FOX.z));
  assert.ok(!foxGladeClearing(-23, -38));
  assert.equal(foxBody().height, 0.62);
});
test("Foxglade's map destination exists only when its actual landmark is present", () => {
  const base = { paths: [], obstacles: [], landmarks: [] };
  assert.ok(
    !createMapData("vale", base).destinations.some((d) => d.id === FOXGLADE.id),
  );
  assert.deepEqual(
    createMapData("vale", {
      ...base,
      landmarks: [{ ...FOXGLADE, description: "Woodland clearing" }],
    }).destinations.find((d) => d.id === FOXGLADE.id),
    FOXGLADE,
  );
});
test("the retained original Fox binary has its pinned source hash, real skin and authored clips", () => {
  const root = new URL("../public/adventures/wildlife/", import.meta.url);
  const binary = readFileSync(new URL("Fox.glb", root));
  const metadata = JSON.parse(
    readFileSync(new URL("metadata.json", root), "utf8"),
  );
  assert.equal(binary.length, 162852);
  assert.equal(
    createHash("sha256").update(binary).digest("hex"),
    metadata.sha256,
  );
  assert.equal(binary.toString("ascii", 0, 4), "glTF");
  const json = JSON.parse(
    binary.toString("utf8", 20, 20 + binary.readUInt32LE(12)),
  );
  assert.deepEqual(
    json.animations.map((a: { name: string }) => a.name),
    ["Survey", "Walk", "Run"],
  );
  assert.equal(json.skins[0].joints.length, 24);
  assert.equal(
    json.accessors[json.meshes[0].primitives[0].attributes.POSITION].count / 3,
    576,
  );
  assert.equal(metadata.rigAnimationLicense, "CC-BY-4.0");
  for (const [file, hash] of [
    ["Fox-SOURCE-README.md", metadata.sourceReadmeSha256],
    ["LICENSE-CC-BY-4.0.txt", metadata.licenseTextSha256],
  ])
    assert.equal(
      createHash("sha256")
        .update(readFileSync(new URL(file, root)))
        .digest("hex"),
      hash,
    );
  const provenance = readFileSync(new URL("PROVENANCE.md", root), "utf8");
  for (const author of ["PixelMannen", "tomkranis", "AsoboStudio", "scurest"])
    assert.ok(provenance.includes(author));
});
