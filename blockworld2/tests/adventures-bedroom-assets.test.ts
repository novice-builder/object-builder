import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DEFINITIONS } from "../src/adventures/assets";
test("bedroom GLBs match pinned CC0 source hashes and have human-scale dimensions without image downloads", async () => {
  const inventory = JSON.parse(
    readFileSync(
      new URL("../public/adventures/inventory-v10.json", import.meta.url),
      "utf8",
    ),
  ).assets;
  const verified = JSON.parse(
    readFileSync(
      new URL(
        "../public/adventures/sources/furniture-v10-source-verification.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const a of inventory) {
    const bytes = readFileSync(
        new URL("../public/adventures/" + a.path, import.meta.url),
      ),
      sha = createHash("sha256").update(bytes).digest("hex");
    assert.equal(sha, a.sha256);
    assert.equal(
      sha,
      verified.files.find((f: any) => f.path.endsWith("/" + a.id + ".glb"))
        .sha256,
    );
    const glb = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
    );
    const box = new T.Box3().setFromObject(glb.scene),
      size = box
        .getSize(new T.Vector3())
        .multiplyScalar(DEFINITIONS.get("furniture-" + a.id)!.scale);
    assert.equal(a.embeddedImages, 0);
    if (a.id === "bedsingle") {
      assert.ok(size.z > 1.95 && size.z < 2.2);
      assert.ok(size.x > 0.95 && size.x < 1.2);
      assert.ok(size.y < 0.9);
    } else assert.ok(size.y > 0.45 && size.y < 0.65);
  }
  const licence = readFileSync(
    new URL("../public/adventures/licences/Kenney-CC0.txt", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(licence).digest("hex"),
    verified.files.find((f: any) => f.path === "LICENSE").sha256,
  );
});
