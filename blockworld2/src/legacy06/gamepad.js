// Standard browser Gamepad mapping (Xbox layout). No dependency or device gate.
export class GamepadInput {
  constructor() {
    this.previous = [];
  }
  read(pads) {
    const pad = Array.from(pads || []).find(
      (p) => p && p.connected !== false && p.mapping === "standard",
    );
    if (!pad) {
      this.previous = [];
      return { forward: 0, right: 0, lookX: 0, lookY: 0, pressed: [] };
    }
    const axis = (i) => {
      const v = pad.axes?.[i];
      return Number.isFinite(v) && Math.abs(v) > 0.18
        ? Math.max(-1, Math.min(1, v))
        : 0;
    };
    const down = Array.from(pad.buttons || []).map(
        (b) => b?.pressed === true || b?.value > 0.55,
      ),
      pressed = [];
    down.forEach((value, i) => {
      if (value && !this.previous[i]) pressed.push(i);
    });
    this.previous = down;
    return {
      forward: -axis(1),
      right: axis(0),
      lookX: axis(2),
      lookY: axis(3),
      pressed,
    };
  }
}
