import { FOX } from "./foxglade-data";
export type FoxClearance = (x: number, z: number, yaw: number) => boolean;
/** Small deterministic local behaviour, not a route planner. Blocked legs stop and retry. */
export class FoxWander {
  x = FOX.x;
  z = FOX.z;
  yaw = FOX.yaw;
  clip: "Survey" | "Walk" = "Survey";
  private target: { x: number; z: number } | null = null;
  private wait = 3.5;
  private seed = 17031;
  private random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  pause() {
    this.target = null;
    this.wait = Math.max(this.wait, 1.3);
    this.clip = "Survey";
  }
  update(dt: number, clear: FoxClearance, player: { x: number; z: number }) {
    const time = Math.min(0.05, Math.max(0, dt));
    if (!time) return false;
    if (Math.hypot(this.x - player.x, this.z - player.z) < 1.15) {
      this.pause();
      return false;
    }
    if (!this.target) {
      this.clip = "Survey";
      this.wait -= time;
      if (this.wait > 0) return false;
      for (let i = 0; i < 12; i++) {
        const angle = this.random() * Math.PI * 2,
          radius = 1.4 + this.random() * 1.7,
          x = FOX.x + Math.sin(angle) * radius,
          z = FOX.z + Math.cos(angle) * radius,
          yaw = Math.atan2(x - this.x, z - this.z);
        if (
          Math.hypot(x - this.x, z - this.z) < 0.8 ||
          Math.hypot(x - player.x, z - player.z) < 1.3 ||
          !clear(x, z, yaw)
        )
          continue;
        this.target = { x, z };
        break;
      }
      if (!this.target) {
        this.wait = 1.5;
        return false;
      }
    }
    const dx = this.target.x - this.x,
      dz = this.target.z - this.z,
      distance = Math.hypot(dx, dz);
    if (distance < 0.075) {
      this.target = null;
      this.wait = 2.2 + this.random() * 2.8;
      this.clip = "Survey";
      return false;
    }
    const desired = Math.atan2(dx, dz),
      delta = Math.atan2(
        Math.sin(desired - this.yaw),
        Math.cos(desired - this.yaw),
      ),
      turn = Math.max(-time * 2.6, Math.min(time * 2.6, delta)),
      yaw = this.yaw + turn;
    if (!clear(this.x, this.z, yaw)) {
      this.pause();
      return false;
    }
    // Turn with authored paw motion before translating, avoiding sideways sliding.
    if (Math.abs(delta) > 0.3) {
      this.yaw = yaw;
      this.clip = "Walk";
      return Math.abs(turn) > 0;
    }
    const step = Math.min(time * 0.65, distance),
      x = this.x + (dx / distance) * step,
      z = this.z + (dz / distance) * step;
    if (Math.hypot(x - player.x, z - player.z) < 1.15 || !clear(x, z, yaw)) {
      this.pause();
      return false;
    }
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.clip = "Walk";
    return true;
  }
}
