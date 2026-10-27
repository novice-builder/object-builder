// Broadphase only: callers retain exact AABB/OBB narrowphase collision checks.
export class SpatialIndex {
  constructor(size = 12) {
    this.size = size;
    this.cells = new Map();
    this.global = new Set();
    this.entries = new Map();
  }
  keys(b) {
    const out = [];
    for (
      let x = Math.floor(b.minX / this.size);
      x <= Math.floor(b.maxX / this.size);
      x++
    )
      for (
        let z = Math.floor(b.minZ / this.size);
        z <= Math.floor(b.maxZ / this.size);
        z++
      )
        out.push(`${x},${z}`);
    return out;
  }
  add(b) {
    const keys = this.keys(b);
    this.entries.set(b, keys);
    if (keys.length > 64) {
      this.global.add(b);
      return;
    }
    for (const k of keys) {
      if (!this.cells.has(k)) this.cells.set(k, new Set());
      this.cells.get(k).add(b);
    }
  }
  remove(b) {
    for (const k of this.entries.get(b) || []) {
      const c = this.cells.get(k);
      c?.delete(b);
      if (!c?.size) this.cells.delete(k);
    }
    this.global.delete(b);
    this.entries.delete(b);
  }
  query(b) {
    const found = new Set(this.global);
    for (const k of this.keys(b))
      for (const v of this.cells.get(k) || []) found.add(v);
    return [...found].filter(
      (v) =>
        v.minX <= b.maxX &&
        v.maxX >= b.minX &&
        v.minZ <= b.maxZ &&
        v.maxZ >= b.minZ &&
        v.minY <= b.maxY &&
        v.maxY >= b.minY,
    );
  }
}
export const around = (p, r = 2) => ({
  minX: p.x - r,
  maxX: p.x + r,
  minZ: p.z - r,
  maxZ: p.z + r,
  minY: -1,
  maxY: (p.y || 0) + 30,
});
