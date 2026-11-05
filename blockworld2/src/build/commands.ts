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
type Edit = { before: Block[]; after: Block[] };
const key = (b: Block) => `${b.x},${b.y},${b.z}`;
export class Commands {
  readonly blocks: Block[] = [];
  private past: Edit[] = [];
  private future: Edit[] = [];
  constructor(
    private obstacles: () => any[],
    private player: () => any,
    private changed: (b: Block, present: boolean) => void,
  ) {}
  reason(b: Block, reach = true, ignore?: Block) {
    return placementReason(
      b,
      {
        blocks: this.blocks.filter((x) => !ignore || key(x) !== key(ignore)),
        inventory: { flowers: 999, lantern: 999, bench: 999 },
      },
      this.obstacles(),
      this.player(),
      reach,
    );
  }
  private apply(edit: Edit, forward: boolean, normal = false, reach = false) {
    const removed = forward ? edit.before : edit.after,
      added = forward ? edit.after : edit.before;
    const keys = new Set(removed.map(key));
    if (removed.some((b) => !this.blocks.some((x) => key(x) === key(b))))
      return "The original object changed";
    const next = this.blocks.filter((b) => !keys.has(key(b)));
    for (const b of added) {
      if (next.some((x) => key(x) === key(b))) return "Find a clear space";
      if (normal) {
        const reason = placementReason(
          b,
          {
            blocks: next,
            inventory: { flowers: 999, lantern: 999, bench: 999 },
          },
          this.obstacles(),
          this.player(),
          reach,
        );
        if (reason) return reason;
      } else if (
        overlaps(cellBox(b), bodyBox(this.player())) ||
        [...this.obstacles(), ...next.map(cellBox)].some((s) =>
          overlaps(cellBox(b), s),
        )
      )
        return "That space is occupied";
      next.push({ ...b });
    }
    this.blocks.splice(0, this.blocks.length, ...next);
    return "";
  }
  private notify(edit: Edit, forward: boolean) {
    for (const b of forward ? edit.before : edit.after) this.changed(b, false);
    for (const b of forward ? edit.after : edit.before) this.changed(b, true);
  }
  private execute(edit: Edit, reach: boolean) {
    const reason = this.apply(edit, true, true, reach);
    if (reason) return reason;
    this.past.push(structuredClone(edit));
    if (this.past.length > 100) this.past.shift();
    this.future = [];
    this.notify(edit, true);
    return "";
  }
  place(b: Block, reach = true) {
    return this.execute({ before: [], after: [{ ...b }] }, reach);
  }
  placeMany(blocks: Block[], reach = true) {
    return this.execute(
      { before: [], after: blocks.map((b) => ({ ...b })) },
      reach,
    );
  }
  move(b: Block, next: Block, reach = true) {
    return this.execute({ before: [{ ...b }], after: [{ ...next }] }, reach);
  }
  remove(b: Block) {
    const original = this.blocks.find((x) => key(x) === key(b));
    return (
      !!original &&
      this.execute({ before: [{ ...original }], after: [] }, false) === ""
    );
  }
  undo() {
    const e = this.past.at(-1);
    if (!e || this.apply(e, false)) return false;
    this.past.pop();
    this.future.push(e);
    this.notify(e, false);
    return true;
  }
  redo() {
    const e = this.future.at(-1);
    if (!e || this.apply(e, true)) return false;
    this.future.pop();
    this.past.push(e);
    this.notify(e, true);
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
