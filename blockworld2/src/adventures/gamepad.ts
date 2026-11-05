export interface PadSnapshot {
  index: number;
  connected?: boolean;
  mapping: string;
  axes: readonly number[];
  buttons: readonly { pressed?: boolean; value?: number }[];
}
export interface PadState {
  x: number;
  z: number;
  lookX: number;
  lookY: number;
  command: string | null;
}
export const PAD_BUTTONS: readonly [number, string][] = [
  [1, "Escape"],
  [9, "PadMenu"],
  [8, "PadMap"],
  [0, "Enter"],
  [3, "KeyE"],
  [2, "KeyB"],
  [5, "KeyR"],
  [10, "PadRun"],
  [12, "PadUp"],
  [13, "PadDown"],
  [14, "PadLeft"],
  [15, "PadRight"],
];
const zero = (): PadState => ({
  x: 0,
  z: 0,
  lookX: 0,
  lookY: 0,
  command: null,
});
export function radialStick(
  x: number | undefined,
  y: number | undefined,
  deadzone = 0.18,
) {
  x = Number.isFinite(x) ? x! : 0;
  y = Number.isFinite(y) ? y! : 0;
  const length = Math.hypot(x, y);
  if (length <= deadzone) return { x: 0, y: 0 };
  const magnitude = Math.min(1, (length - deadzone) / (1 - deadzone));
  return { x: (x / length) * magnitude, y: (y / length) * magnitude };
}
/** Standard mapping only, one edge command per frame, neutral required after interruptions. */
export class GamepadInput {
  connected = false;
  index: number | null = null;
  state: PadState = zero();
  private armed = false;
  private previous: boolean[] = [];
  reset() {
    this.state = zero();
    this.armed = false;
  }
  sample(pads: readonly (PadSnapshot | null)[], active = true): PadState {
    const candidates = pads.filter(
      (p): p is PadSnapshot =>
        !!p && p.connected !== false && p.mapping === "standard",
    );
    const pad = candidates.find((p) => p.index === this.index) || candidates[0];
    if (!pad) {
      this.connected = false;
      this.index = null;
      this.previous = [];
      this.reset();
      return this.state;
    }
    if (this.index !== pad.index) {
      this.index = pad.index;
      this.reset();
      this.previous = [];
    }
    this.connected = true;
    const left = radialStick(pad.axes[0], pad.axes[1]),
      right = radialStick(pad.axes[2], pad.axes[3]);
    const buttons = pad.buttons.map(
      (b) => !!b.pressed || (b.value ?? 0) > 0.55,
    );
    if (!active) {
      this.reset();
      this.previous = buttons;
      return this.state;
    }
    if (!this.armed) {
      this.previous = buttons;
      if (!buttons.some(Boolean) && !left.x && !left.y && !right.x && !right.y)
        this.armed = true;
      this.state = zero();
      return this.state;
    }
    const command =
      PAD_BUTTONS.find(
        ([index]) => buttons[index] && !this.previous[index],
      )?.[1] || null;
    this.previous = buttons;
    this.state = {
      x: left.x,
      z: left.y,
      lookX: right.x,
      lookY: right.y,
      command,
    };
    return this.state;
  }
}
