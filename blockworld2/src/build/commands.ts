import {
  placementReason,
  cellBox,
  bodyBox,
  overlaps,
} from "../legacy06/core.js";
export interface Block {
  x: number;
  y: number;
  z: number;
  type: string;
  rotation?: number;
}
type Edit = { kind: "place" | "remove"; block: Block };
export class Commands {
  readonly blocks: Block[] = [];
  private past: Edit[] = [];
  private future: Edit[] = [];
  constructor(
    private obstacles: () => any[],
    private player: () => any,
    private changed: (b: Block, present: boolean) => void,
  ) {}
  reason(b: Block, reach = true) {
    return placementReason(
      b,
      {
        blocks: this.blocks,
        inventory: { flowers: 999, lantern: 999, bench: 999 },
      },
      this.obstacles(),
      this.player(),
      reach,
    );
  }
  place(b: Block, reach = true) {
    const reason = this.reason(b, reach);
    if (reason) return reason;
    const block = { ...b };
    this.blocks.push(block);
    this.record({ kind: "place", block });
    this.changed(block, true);
    return "";
  }
  remove(b: Block) {
    const index = this.blocks.findIndex(
      (x) => x.x === b.x && x.y === b.y && x.z === b.z,
    );
    if (index < 0) return false;
    const [block] = this.blocks.splice(index, 1);
    this.record({ kind: "remove", block: { ...block } });
    this.changed(block, false);
    return true;
  }
  private record(edit: Edit) {
    this.past.push(edit);
    if (this.past.length > 100) this.past.shift();
    this.future = [];
  }
  private apply(edit: Edit, inverse: boolean) {
    const adding = (edit.kind === "place") !== inverse,
      b = edit.block;
    if (adding) {
      if (
        overlaps(cellBox(b), bodyBox(this.player())) ||
        [...this.obstacles(), ...this.blocks.map(cellBox)].some((s) =>
          overlaps(cellBox(b), s),
        )
      )
        return false;
      this.blocks.push({ ...b });
    } else {
      const i = this.blocks.findIndex(
        (x) => x.x === b.x && x.y === b.y && x.z === b.z,
      );
      if (i < 0) return false;
      this.blocks.splice(i, 1);
    }
    return true;
  }
  undo() {
    const e = this.past.at(-1);
    if (!e || !this.apply(e, true)) return false;
    this.past.pop();
    this.future.push(e);
    this.changed(e.block, e.kind === "remove");
    return true;
  }
  redo() {
    const e = this.future.at(-1);
    if (!e || !this.apply(e, false)) return false;
    this.future.pop();
    this.past.push(e);
    this.changed(e.block, e.kind === "place");
    return true;
  }
  reset(blocks: Block[]) {
    this.blocks.splice(0, this.blocks.length, ...blocks.map((b) => ({ ...b })));
    this.past = [];
    this.future = [];
  }
  get canUndo() {
    return !!this.past.length;
  }
  get canRedo() {
    return !!this.future.length;
  }
}
