import type { Block } from "../build/commands";
export const PLAY = new Set(["swing", "seesaw", "bounce", "slide", "rock"]);
export function playDuration(kind: string) {
  return kind === "slide" ? 1.8 : 4;
}
export function playPose(kind: string, b: Block, time: number) {
  const a = ((b.rotation || 0) * Math.PI) / 180,
    t = Math.min(time / playDuration(kind), 1);
  let x = 0,
    z = 0,
    y = 0.3,
    yaw = a;
  if (kind === "slide") {
    z = -0.65 + t * 1.3;
    y = 1 - t;
    yaw += Math.PI;
  }
  if (kind === "swing") {
    z = Math.sin(time * 2) * 0.65;
    y = 0.3 + (1 - Math.cos(time * 2)) * 0.18;
  }
  if (kind === "seesaw") {
    x = 1.2;
    y = 0.4 + Math.sin(time * 2) * 0.2;
  }
  if (kind === "bounce") y = 0.5 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.85;
  if (kind === "rock") y = 0.2 + Math.sin(time * 3) * 0.04;
  return {
    x: b.x + 0.5 + x * Math.cos(a) + z * Math.sin(a),
    y: b.y + y,
    z: b.z + 0.5 - x * Math.sin(a) + z * Math.cos(a),
    yaw,
  };
}
