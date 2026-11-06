import {
  movePlayer,
  collides,
  supportHeight,
  rampHeight,
} from "../player/physics.js";
import type { Obstacle } from "./landscape";
export interface RoomSolid {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  stairLanding?: boolean;
  ramp?: {
    cx: number;
    cz: number;
    c: number;
    s: number;
    width: number;
    length: number;
    rise: number;
    baseY: number;
  };
}
export interface RoomPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  vy?: number;
  grounded?: boolean;
}
export const UPPER_FLOOR = 3;
export function roomStructure(
  width: number,
  depth: number,
  upper: boolean,
): RoomSolid[] {
  const w = width / 2,
    d = depth / 2,
    solid = (
      minX: number,
      maxX: number,
      minZ: number,
      maxZ: number,
      minY: number,
      maxY: number,
    ): RoomSolid => ({ minX, maxX, minZ, maxZ, minY, maxY });
  const walls = [
    solid(-w - 0.2, -w, -d - 0.2, d + 0.2, 0, upper ? 6 : 3),
    solid(w, w + 0.2, -d - 0.2, d + 0.2, 0, upper ? 6 : 3),
    solid(-w, w, -d - 0.2, -d, 0, upper ? 6 : 3),
    solid(-w, w, d, d + 0.2, 0, upper ? 6 : 3),
  ];
  if (!upper) return walls;
  const sx = w - 1,
    top = -d + 1.35,
    bottom = d - 1.3,
    length = bottom - top,
    left = sx - 0.8,
    right = sx + 0.8;
  // Bevel the landing underside by 18 cm: the capsule reaches the top without snagging its edge.
  // The rendered tread/floor meets at top; the existing nine-centimetre landing join stays bounded.
  return [
    ...walls,
    solid(-w, left, -d, d, 2.8, 3),
    solid(right, w, -d, d, 2.8, 3),
    { ...solid(left, right, -d, top - 0.18, 2.8, 3), stairLanding: true },
    solid(left, right, bottom, d, 2.8, 3),
    {
      ...solid(left, right, top, bottom, 0, 3),
      ramp: {
        cx: sx,
        cz: (top + bottom) / 2,
        c: 1,
        s: 0,
        width: 1.6,
        length,
        rise: 3,
        baseY: 0,
      },
    },
    // Continuous inner stair guard, plus the two safe upper-floor edges. Leave both landings open.
    solid(left - 0.08, left + 0.03, top + 0.15, bottom - 0.15, 0, 3.85),
    solid(right - 0.03, right + 0.08, top + 0.15, bottom - 0.15, 0, 3.85),
  ];
}
export function obstacleSolid(b: Obstacle): RoomSolid {
  return {
    minX: b.minX,
    maxX: b.maxX,
    minZ: b.minZ,
    maxZ: b.maxZ,
    minY: b.base ?? 0,
    maxY: b.height,
  };
}
export function moveInRoom(
  p: RoomPose,
  vx: number,
  vz: number,
  dt: number,
  solids: RoomSolid[],
) {
  // The guarded flight and half-metre landings use ramp support. Generic edge protection
  // would stop four foot probes at the bevel even though the capsule has continuous support.
  const yaw = p.yaw;
  p.yaw = 0;
  movePlayer(
    p,
    {
      forward: -vz / 3.4,
      right: vx / 3.4,
      walkSpeed: "normal",
      edgeProtection: !solids.some((b) => {
        if (
          !b.ramp ||
          p.x < b.minX ||
          p.x > b.maxX ||
          p.z < b.minZ - 0.5 ||
          p.z > b.maxZ + 0.5
        )
          return false;
        const y = rampHeight(b, p.x, Math.max(b.minZ, Math.min(b.maxZ, p.z)));
        return y !== null && Math.abs(p.y - y) < 0.3;
      }),
    },
    dt,
    solids,
  );
  p.yaw = yaw;
}
export function safeRoomPose(
  p: RoomPose,
  solids: RoomSolid[],
  width: number,
  depth: number,
): boolean {
  return (
    Math.abs(p.x) < width / 2 - 0.279 &&
    Math.abs(p.z) < depth / 2 - 0.279 &&
    p.y >= 0 &&
    p.y <= 3.05 &&
    !collides(p, solids) &&
    Math.abs(p.y - supportHeight(p, solids)) < 0.08
  );
}

/** Same floor first, then the reserved exit landing. Null means refuse replacement before changing ownership. */
export function recoverRoomPose(
  p: RoomPose,
  solids: RoomSolid[],
  width: number,
  depth: number,
  spawn: { x: number; y: number; z: number },
) {
  if (safeRoomPose(p, solids, width, depth)) return { ...p };
  for (const origin of [{ ...p, y: p.y > 1.5 ? 3 : 0 }, spawn]) {
    for (let radius = 0; radius <= Math.hypot(width, depth); radius += 0.4)
      for (let a = 0; a < 16; a++) {
        const q = {
          ...origin,
          x: origin.x + Math.cos((a * Math.PI) / 8) * radius,
          z: origin.z + Math.sin((a * Math.PI) / 8) * radius,
          yaw: 0,
        };
        if (safeRoomPose(q, solids, width, depth)) return q;
      }
  }
  return null;
}
