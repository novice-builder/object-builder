import { SpatialIndex, around } from "../legacy06/spatial.js";
import { blockColliders } from "./registry";
import type { Block } from "./commands";
/** Incremental broadphase; large objects are queried by extent, not anchor distance. */
export class BuildCollisionIndex {
  index = new SpatialIndex(4);
  entries = new Map<string, any[]>();
  update(block: Block, present: boolean) {
    const key = `${block.x},${block.y},${block.z}`;
    for (const shape of this.entries.get(key) || []) this.index.remove(shape);
    this.entries.delete(key);
    if (present) {
      const shapes = blockColliders(block).map((s) => ({
        ...s,
        block,
        owner: "build:" + key,
      }));
      this.entries.set(key, shapes);
      for (const shape of shapes) this.index.add(shape);
    }
  }
  reset(blocks: Block[]) {
    this.index = new SpatialIndex(4);
    this.entries.clear();
    for (const b of blocks) this.update(b, true);
  }
  query(point: any, radius: number) {
    return this.index.query(around(point, radius));
  }
  blocksNear(point: any, radius: number): Block[] {
    return [
      ...new Set(this.query(point, radius).map((s: any) => s.block)),
    ] as Block[];
  }
}
