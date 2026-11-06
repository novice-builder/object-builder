import {
  BODY_HEIGHT,
  BODY_RADIUS,
  CollisionSpace,
  type FootPose,
} from "./mesh-collision";
export const MAX_STEP_HEIGHT = 0.3,
  GROUND_SNAP = 0.31,
  GRAVITY = 20,
  JUMP_SPEED = 5.2;
const SKIN = 0.002;
export interface CharacterPose extends FootPose {
  vy?: number;
  grounded?: boolean;
}
export interface MotionInput {
  vx: number;
  vz: number;
  jump?: boolean;
}
/** Revalidate saved footing against actual triangles, keeping the same floor before trying the exit. */
export function recoverCharacter<T extends CharacterPose>(
  pose: T,
  space: CollisionSpace,
  fallback: FootPose,
  radiusLimit: number,
): T | null {
  if (space.valid(pose.x, pose.z) && space.supported(pose) && space.clear(pose))
    return { ...pose, vy: 0, grounded: true };
  for (const origin of [pose, fallback]) {
    for (let radius = 0; radius <= radiusLimit; radius += 0.4) {
      for (let a = 0; a < (radius ? 16 : 1); a++) {
        const x = origin.x + Math.cos((a * Math.PI) / 8) * radius,
          z = origin.z + Math.sin((a * Math.PI) / 8) * radius;
        if (!space.valid(x, z)) continue;
        const floor = space.floor(x, z, origin.y + 0.31, origin.y - 0.31);
        if (!floor) continue;
        const q = { ...pose, x, y: floor.y + SKIN, z, vy: 0, grounded: true };
        if (space.clear(q)) return q;
      }
    }
  }
  return null;
}
/** Geometry-based auto stepping, independent of stair labels or collision ramps. All distances are metres. */
export function moveCharacter(
  p: CharacterPose,
  input: MotionInput,
  dt: number,
  space: CollisionSpace,
  maxStep = MAX_STEP_HEIGHT,
) {
  const time = Math.min(0.1, Math.max(0, dt)),
    steps = Math.max(1, Math.ceil(time / 0.008)),
    h = time / steps;
  if (input.jump && p.grounded) {
    p.vy = JUMP_SPEED;
    p.grounded = false;
  }
  for (let i = 0; i < steps; i++) {
    const vx = input.vx,
      vz = input.vz,
      len = Math.hypot(vx, vz),
      ux = len ? vx / len : 0,
      uz = len ? vz / len : 0;
    // A rounded foot can meet a tread corner before its centre reaches the top.
    // Recover nearby real support rather than treating that small contact as a jump.
    if (!p.grounded && (p.vy ?? 0) <= 0 && (p.vy ?? 0) > -1) {
      for (const offset of [0, BODY_RADIUS / 2, BODY_RADIUS + 0.04]) {
        const support = space.floor(
          p.x + ux * offset,
          p.z + uz * offset,
          p.y + 0.06,
          p.y - 0.06,
        );
        if (support && space.clear({ ...p, y: support.y + SKIN })) {
          p.y = support.y + SKIN;
          p.vy = 0;
          p.grounded = true;
          break;
        }
      }
    }
    const attempt = (dx: number, dz: number) => {
      const old = { x: p.x, y: p.y, z: p.z },
        nx = p.x + dx,
        nz = p.z + dz;
      if (!space.valid(nx, nz)) return false;
      if (space.ground(nx, nz) > p.y + maxStep + 0.001) return false;
      const q = { x: nx, y: p.y, z: nz },
        floor = space.floor(nx, nz, p.y + maxStep, p.y - GROUND_SNAP, true);
      if (p.grounded && floor && floor.y > p.y + 0.003) q.y = floor.y + SKIN;
      let hit = space.contact(q);
      if (hit && p.grounded && hit.canStep && hit.normal.y > -0.3 && len) {
        const ahead = BODY_RADIUS + 0.04,
          top = space.floor(
            nx + ux * ahead,
            nz + uz * ahead,
            p.y + maxStep,
            p.y + 0.005,
            true,
          );
        if (top) {
          const further = space.floor(
            nx + ux * (ahead + 0.12),
            nz + uz * (ahead + 0.12),
            top.y + maxStep,
            top.y - 0.04,
            true,
          );
          const a = space.floor(
              nx + ux * ahead + uz * 0.12,
              nz + uz * ahead - ux * 0.12,
              top.y + 0.03,
              top.y - 0.04,
              true,
            ),
            b = space.floor(
              nx + ux * ahead - uz * 0.12,
              nz + uz * ahead + ux * 0.12,
              top.y + 0.03,
              top.y - 0.04,
              true,
            );
          const raised = { x: nx, y: top.y + SKIN, z: nz };
          if (
            further &&
            a &&
            b &&
            top.y - old.y <= maxStep + 0.00001 &&
            space.clear(raised) &&
            space.clear(
              {
                x: nx + ux * ahead,
                y: raised.y + maxStep + 0.01,
                z: nz + uz * ahead,
              },
              BODY_RADIUS,
              BODY_HEIGHT - maxStep - 0.01,
            )
          ) {
            q.y = raised.y;
            hit = null;
          }
        }
      }
      if (hit && hit.depth > 0.0003) {
        const n2 = hit.normal.x ** 2 + hit.normal.z ** 2;
        if (n2 < 0.01) return false;
        q.x += (hit.normal.x * (hit.depth + 0.001)) / n2;
        q.z += (hit.normal.z * (hit.depth + 0.001)) / n2;
        if (
          Math.hypot(q.x - old.x, q.z - old.z) > Math.hypot(dx, dz) + 0.01 ||
          !space.valid(q.x, q.z) ||
          !space.clear(q)
        )
          return false;
      }
      p.x = q.x;
      p.y = q.y;
      p.z = q.z;
      return true;
    };
    if (!attempt(vx * h, vz * h)) {
      attempt(vx * h, 0);
      attempt(0, vz * h);
    }
    const floor = space.support(p, 0.004, GROUND_SNAP);
    if (
      (p.vy ?? 0) <= 0 &&
      (p.grounded || (p.vy ?? 0) > -2) &&
      floor &&
      p.y - floor.y <= GROUND_SNAP &&
      space.clear({ ...p, y: floor.y + SKIN })
    ) {
      p.y = floor.y + SKIN;
      p.vy = 0;
    } else {
      const oldY = p.y;
      p.vy = (p.vy ?? 0) - GRAVITY * h;
      p.y += p.vy * h;
      for (let j = 0; j < 4; j++) {
        const hit = space.contact(p);
        if (!hit || hit.depth < 0.001) break;
        p.x += hit.normal.x * (hit.depth + 0.001);
        p.y += hit.normal.y * (hit.depth + 0.001);
        p.z += hit.normal.z * (hit.depth + 0.001);
        if (hit.normal.y > 0.65 && p.vy < 0) {
          p.vy = 0;
          p.grounded = true;
        } else if (hit.normal.y < -0.3 && p.vy > 0) p.vy = 0;
      }
      const ground = space.ground(p.x, p.z);
      if (p.y < ground) {
        p.y = ground + SKIN;
        p.vy = 0;
        p.grounded = true;
      }
      const landing = space.floor(p.x, p.z, oldY + 0.006, p.y - 0.02);
      if (
        p.vy <= 0 &&
        landing &&
        p.y <= landing.y + 0.015 &&
        space.clear({ ...p, y: landing.y + SKIN })
      ) {
        p.y = landing.y + SKIN;
        p.vy = 0;
        p.grounded = true;
      } else if (p.vy !== 0) p.grounded = false;
    }
  }
}
