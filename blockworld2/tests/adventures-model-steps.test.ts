import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  modelFlights,
  stepPattern,
  fitModelSteps,
} from "../src/adventures/model-steps";
import { CollisionSpace, MeshShape } from "../src/adventures/mesh-collision";
import { moveCharacter } from "../src/adventures/character-controller";
async function sourceModel() {
  const bytes = readFileSync(
    new URL(
      "../public/adventures/village/building_home_B_green.glb",
      import.meta.url,
    ),
  );
  const n = bytes.readUInt32LE(12),
    json = JSON.parse(bytes.subarray(20, 20 + n).toString());
  // Geometry-only parse in Node: the browser separately verifies the real atlas rendering.
  delete json.images;
  delete json.textures;
  delete json.materials;
  delete json.samplers;
  for (const mesh of json.meshes)
    for (const primitive of mesh.primitives) delete primitive.material;
  let text = Buffer.from(JSON.stringify(json));
  text = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 32)]);
  const bin = bytes.subarray(20 + n),
    out = Buffer.alloc(20 + text.length + bin.length);
  out.writeUInt32LE(0x46546c67, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(out.length, 8);
  out.writeUInt32LE(text.length, 12);
  out.writeUInt32LE(0x4e4f534a, 16);
  text.copy(out, 20);
  bin.copy(out, 20 + text.length);
  const gltf = await new GLTFLoader().parseAsync(
    out.buffer.slice(out.byteOffset, out.byteOffset + out.length),
    "",
  );
  const bounds = new T.Box3().setFromObject(gltf.scene),
    center = bounds.getCenter(new T.Vector3()),
    g = new T.Group();
  gltf.scene.position.set(-center.x, -bounds.min.y, -center.z);
  g.add(gltf.scene);
  return g;
}
test("actual stock oversized stairs become real bounded substeps without changing source meshes or footprint", async () => {
  const source = await sourceModel(),
    before = new T.Box3().setFromObject(source),
    flights = modelFlights(source),
    counts = stepPattern(flights, 7.2);
  assert.equal(flights.length, 1);
  assert.deepEqual(counts, [8]);
  const first = flights[0].treads[0],
    last = flights[0].treads.at(-1)!;
  assert.ok(first.y * 7.2 > 0.377 && first.y * 7.2 < 0.379);
  const fitted = fitModelSteps(source, flights, counts),
    after = new T.Box3().setFromObject(fitted);
  assert.ok(
    before.min.distanceTo(after.min) < 0.00001 &&
      before.max.distanceTo(after.max) < 0.00001,
  );
  let raw = 0,
    changed = 0;
  source.traverse((o) => {
    if (o instanceof T.Mesh) raw += o.geometry.index?.count ?? 0;
  });
  fitted.traverse((o) => {
    if (o instanceof T.Mesh) changed += o.geometry.index?.count ?? 0;
  });
  assert.notEqual(changed, raw);
  for (const speed of [3.05, 6]) {
    const space = new CollisionSpace();
    space.add(new MeshShape(fitted), new T.Matrix4().makeScale(7.2, 7.2, 7.2));
    const p = {
      x: ((first.minX + first.maxX) / 2) * 7.2,
      y: 0.002,
      z: first.front * 7.2 + 0.6,
      grounded: true,
      vy: 0,
    };
    for (let i = 0; i < 1600 && p.z > last.back * 7.2 + 0.45; i++)
      moveCharacter(p, { vx: 0, vz: -speed }, 1 / 120, space);
    assert.ok(
      p.y > last.y * 7.2 - 0.03,
      JSON.stringify({ speed, p, target: last.y * 7.2 }),
    );
    const topY = p.y;
    for (let i = 0; i < 120; i++)
      moveCharacter(p, { vx: 0, vz: 0 }, 1 / 120, space);
    assert.ok(
      Math.abs(p.y - topY) < 0.003 && space.supported(p),
      JSON.stringify({ idle: p, topY }),
    );
    for (let i = 0; i < 1600 && p.z < first.front * 7.2 + 0.5; i++)
      moveCharacter(p, { vx: 0, vz: speed }, 1 / 120, space);
    assert.ok(p.y < 0.03, JSON.stringify({ speed, p }));
  }
  let check = 0;
  source.traverse((o) => {
    if (o instanceof T.Mesh) check += o.geometry.index?.count ?? 0;
  });
  assert.equal(check, raw);
});
