import { installWorldGestures } from "../legacy06/gestures.js";
import { installTouchButtons } from "../legacy06/touch-buttons.js";
export class Controls {
  stick = { x: 0, y: 0 };
  keys = new Set<string>();
  private pointer: number | null = null;
  private gestures: any;
  constructor(
    canvas: HTMLCanvasElement,
    enabled: () => boolean,
    handlers: {
      tap: (x: number, y: number) => void;
      hold: (x: number, y: number) => void;
      look: (dx: number, dy: number) => void;
      action: (code: string) => void;
      pose?: () => any;
    },
  ) {
    installTouchButtons();
    let origin: any = null;
    this.gestures = installWorldGestures(canvas, {
      canStart: enabled,
      onStart: () => {
        origin = handlers.pose ? { ...handlers.pose() } : null;
      },
      onTap: handlers.tap,
      onHold: (x: number, y: number) => {
        const p = handlers.pose?.();
        if (
          origin &&
          p &&
          (Math.hypot(p.x - origin.x, p.y - origin.y, p.z - origin.z) > 0.08 ||
            Math.abs(p.yaw - origin.yaw) + Math.abs(p.pitch - origin.pitch) >
              0.01)
        )
          return;
        handlers.hold(x, y);
      },
      onLook: handlers.look,
    });
    const joy = document.querySelector<HTMLElement>("#joystick")!;
    const move = (e: PointerEvent) => {
      const r = joy.getBoundingClientRect(),
        dx = e.clientX - r.left - r.width / 2,
        dy = e.clientY - r.top - r.height / 2,
        n = Math.max(1, Math.hypot(dx, dy) / 40);
      this.stick = { x: dx / n / 40, y: dy / n / 40 };
      document.querySelector<HTMLElement>("#knob")!.style.transform =
        `translate(${this.stick.x * 36}px,${this.stick.y * 36}px)`;
    };
    joy.addEventListener("pointerdown", (e) => {
      if (!enabled() || this.pointer !== null) return;
      e.preventDefault();
      this.pointer = e.pointerId;
      joy.setPointerCapture(e.pointerId);
      move(e);
    });
    joy.addEventListener("pointermove", (e) => {
      if (this.pointer === e.pointerId) move(e);
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      joy.addEventListener(name, (e) => {
        if (this.pointer === (e as PointerEvent).pointerId) this.clear();
      });
    addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement)?.matches("input,textarea,select")) return;
      if (!enabled() && e.code !== "Escape") return;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
      this.keys.add(e.code);
      if (!e.repeat) handlers.action(e.code);
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => this.clear());
  }
  clear() {
    this.keys.clear();
    this.pointer = null;
    this.stick = { x: 0, y: 0 };
    this.gestures?.cancel();
    const knob = document.querySelector<HTMLElement>("#knob");
    if (knob) knob.style.transform = "";
  }
  movement() {
    return {
      forward: +this.keys.has("KeyW") - +this.keys.has("KeyS") - this.stick.y,
      right: +this.keys.has("KeyD") - +this.keys.has("KeyA") + this.stick.x,
    };
  }
}
