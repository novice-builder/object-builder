export class AdventureControls {
  keys = new Set<string>();
  stick = { x: 0, y: 0 };
  running = false;
  private pointers = new Map<number, { x: number; y: number }>();
  private stickPointer: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private previousPinch = 0;
  private releaseStick: () => void = () => {};
  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly enabled: () => boolean,
    readonly look: (dx: number, dy: number) => void,
    readonly zoom: (delta: number) => void,
    readonly tap: (x: number, y: number) => void,
    readonly action: (code: string) => void,
  ) {
    const joystick = document.querySelector<HTMLElement>("#joystick")!,
      knob = document.querySelector<HTMLElement>("#knob")!;
    const release = () => {
      const pointer = this.stickPointer;
      this.stickPointer = null;
      if (pointer !== null && joystick.hasPointerCapture(pointer))
        joystick.releasePointerCapture(pointer);
      this.stick.x = this.stick.y = 0;
      knob.style.transform = "translate(-50%,-50%)";
    };
    this.releaseStick = release;
    const update = (e: PointerEvent) => {
      const x = (e.clientX - this.stickOrigin.x) / 42,
        y = (e.clientY - this.stickOrigin.y) / 42,
        n = Math.max(1, Math.hypot(x, y));
      this.stick = { x: x / n, y: y / n };
      knob.style.transform = `translate(calc(-50% + ${this.stick.x * 35}px),calc(-50% + ${this.stick.y * 35}px))`;
    };
    joystick.addEventListener("pointerdown", (e) => {
      if (!this.enabled() || this.stickPointer !== null) return;
      e.preventDefault();
      this.stickPointer = e.pointerId;
      joystick.setPointerCapture(e.pointerId);
      const r = joystick.getBoundingClientRect();
      this.stickOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      update(e);
    });
    joystick.addEventListener("pointermove", (e) => {
      if (e.pointerId === this.stickPointer) update(e);
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      joystick.addEventListener(type, (e) => {
        if ((e as PointerEvent).pointerId === this.stickPointer) release();
      });
    let drag: {
      id: number;
      x: number;
      y: number;
      distance: number;
      startX: number;
      startY: number;
    } | null = null;
    canvas.addEventListener("pointerdown", (e) => {
      if (!this.enabled()) return;
      canvas.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1)
        drag = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          startX: e.clientX,
          startY: e.clientY,
          distance: 0,
        };
      else {
        drag = null;
        const [a, b] = [...this.pointers.values()];
        this.previousPinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!this.pointers.has(e.pointerId) || !this.enabled()) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()],
          d = Math.hypot(a.x - b.x, a.y - b.y);
        this.zoom((this.previousPinch - d) * 0.045);
        this.previousPinch = d;
      } else if (drag?.id === e.pointerId) {
        const dx = e.clientX - drag.x,
          dy = e.clientY - drag.y;
        drag.distance += Math.hypot(dx, dy);
        drag.x = e.clientX;
        drag.y = e.clientY;
        this.look(dx, dy);
      }
    });
    const end = (e: PointerEvent) => {
      const pinching = this.pointers.size > 1;
      this.pointers.delete(e.pointerId);
      if (drag?.id === e.pointerId) {
        if (drag.distance < 8 && this.enabled()) this.tap(e.clientX, e.clientY);
        drag = null;
      }
      if (pinching && this.pointers.size === 1) {
        const [id, p] = [...this.pointers.entries()][0];
        drag = { id, x: p.x, y: p.y, startX: p.x, startY: p.y, distance: 8 };
        this.previousPinch = 0;
      }
      if (this.pointers.size === 0) this.previousPinch = 0;
    };
    canvas.addEventListener("pointerup", end);
    for (const event of ["pointercancel", "lostpointercapture"])
      canvas.addEventListener(event, (e) => {
        this.pointers.delete((e as PointerEvent).pointerId);
        if (drag?.id === (e as PointerEvent).pointerId) drag = null;
      });
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom(e.deltaY * 0.012);
      },
      { passive: false },
    );
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement)?.matches("input,textarea,select")) return;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code,
        )
      )
        e.preventDefault();
      if (!this.enabled()) {
        if (e.code === "Escape") this.action(e.code);
        return;
      }
      this.keys.add(e.code);
      if (!e.repeat) this.action(e.code);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => {
      this.clear();
      release();
      drag = null;
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clear();
        release();
        drag = null;
      }
    });
  }
  clear() {
    this.releaseStick();
    for (const id of this.pointers.keys())
      if (this.canvas.hasPointerCapture(id))
        this.canvas.releasePointerCapture(id);
    this.previousPinch = 0;
    this.keys.clear();
    this.stick.x = this.stick.y = 0;
    this.pointers.clear();
    const knob = document.querySelector<HTMLElement>("#knob");
    if (knob) knob.style.transform = "translate(-50%,-50%)";
  }
  movement() {
    return {
      x:
        (this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0) -
        (this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0) +
        this.stick.x,
      z:
        (this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0) -
        (this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0) +
        this.stick.y,
      run:
        this.running ||
        this.keys.has("ShiftLeft") ||
        this.keys.has("ShiftRight"),
    };
  }
}
