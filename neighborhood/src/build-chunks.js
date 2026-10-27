import * as T from "three";
import { WORLD } from "./world-config.js";
import { COMMON, SPECIAL, key } from "./core.js";
import { PARTS } from "./pieces.js";
export const chunkKey = (b) =>
  `${Math.floor(b.x / WORLD.chunkSize)},${Math.floor(b.z / WORLD.chunkSize)}`;
// Common pieces retain every visible textured face; fully hidden faces are omitted.
// Edits replace the touched 24 m chunk and a neighbour only at a chunk boundary.
export class BuildChunks {
  constructor(parent, geometry, materials, decorMat) {
    Object.assign(this, { parent, geometry, materials, decorMat });
    this.cells = new Map();
    this.groups = new Map();
    this.rebuilt = 0;
  }
  clear() {
    for (const g of this.groups.values()) this.dispose(g);
    this.cells.clear();
    this.groups.clear();
  }
  dispose(g) {
    g.traverse((m) => {
      if (m.isInstancedMesh) m.dispose();
      if (m.userData.ownedGeometry) m.geometry.dispose();
    });
    g.removeFromParent();
  }
  reset(blocks) {
    this.clear();
    for (const b of blocks) this.store(b);
    for (const k of this.cells.keys()) this.rebuild(k);
  }
  store(b) {
    const k = chunkKey(b);
    if (!this.cells.has(k)) this.cells.set(k, new Map());
    this.cells.get(k).set(key(b), b);
  }
  update(b, present) {
    const k = chunkKey(b);
    if (present) this.store(b);
    else this.cells.get(k)?.delete(key(b));
    const touched = new Set([k]),
      size = WORLD.chunkSize;
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const other = chunkKey({ x: b.x + dx, z: b.z + dz });
      if (other !== k && this.cells.has(other)) touched.add(other);
    }
    for (const chunk of touched) this.rebuild(chunk);
  }
  opaque(x, y, z) {
    return COMMON.includes(
      this.cells.get(chunkKey({ x, z }))?.get(`${x},${y},${z}`)?.type,
    );
  }
  rebuild(k) {
    const old = this.groups.get(k);
    if (old) this.dispose(old);
    const g = new T.Group(),
      list = [...(this.cells.get(k)?.values() || [])];
    const directions = [
        [1, 0, 0],
        [-1, 0, 0],
        [0, 1, 0],
        [0, -1, 0],
        [0, 0, 1],
        [0, 0, -1],
      ],
      source = this.geometry;
    for (const type of COMMON) {
      const positions = [],
        normals = [],
        uvs = [],
        indices = [],
        faceBlocks = [];
      for (const b of list.filter((b) => b.type === type))
        for (let face = 0; face < 6; face++) {
          const [dx, dy, dz] = directions[face];
          if (this.opaque(b.x + dx, b.y + dy, b.z + dz)) continue;
          const base = positions.length / 3;
          for (let i = 0; i < 4; i++) {
            const vertex = face * 4 + i;
            positions.push(
              source.attributes.position.getX(vertex) + b.x + 0.5,
              source.attributes.position.getY(vertex) + b.y + 0.5,
              source.attributes.position.getZ(vertex) + b.z + 0.5,
            );
            normals.push(
              source.attributes.normal.getX(vertex),
              source.attributes.normal.getY(vertex),
              source.attributes.normal.getZ(vertex),
            );
            uvs.push(
              source.attributes.uv.getX(vertex),
              source.attributes.uv.getY(vertex),
            );
          }
          for (let i = 0; i < 6; i++)
            indices.push(base + source.index.array[face * 6 + i] - face * 4);
          faceBlocks.push(b, b);
        }
      if (!positions.length) continue;
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(positions, 3),
      );
      geometry.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
      geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
      const mesh = new T.Mesh(geometry, this.materials[type]);
      mesh.userData.faceBlocks = faceBlocks;
      mesh.userData.ownedGeometry = true;
      g.add(mesh);
    }
    const parts = new Map(),
      root = new T.Object3D(),
      part = new T.Object3D();
    for (const b of list.filter((b) => SPECIAL.includes(b.type))) {
      root.position.set(b.x + 0.5, b.y, b.z + 0.5);
      root.rotation.y = ((b.rotation || 0) * Math.PI) / 180;
      root.updateMatrix();
      for (const [x, y, z, w, h, d, c] of PARTS[b.type]) {
        part.position.set(x - 0.5, y, z - 0.5);
        part.scale.set(w, h, d);
        part.updateMatrix();
        if (!parts.has(c)) parts.set(c, []);
        parts.get(c).push({
          b,
          m: new T.Matrix4().multiplyMatrices(root.matrix, part.matrix),
        });
      }
    }
    for (const [color, items] of parts) {
      const mesh = new T.InstancedMesh(
        this.geometry,
        this.decorMat(color),
        items.length,
      );
      items.forEach((p, i) => mesh.setMatrixAt(i, p.m));
      mesh.userData.blocks = items.map((p) => p.b);
      mesh.computeBoundingSphere();
      g.add(mesh);
    }
    this.parent.add(g);
    g.updateMatrixWorld(true);
    this.groups.set(k, g);
    this.rebuilt++;
  }
  rayMeshes() {
    const result = [];
    this.parent.traverse((m) => {
      if (m.isMesh) result.push(m);
    });
    return result;
  }
}
