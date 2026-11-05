import { findDetour, type Point } from "./navigation";
export interface RouteState {
  x: number;
  z: number;
  target: number;
  wait: number;
  stuck: number;
  detour?: Point[];
  replans?: number;
}
export function stepRoute(
  state: RouteState,
  points: { x: number; z: number }[],
  dt: number,
  speed: number,
  blocked: (x: number, z: number) => boolean,
) {
  if (!points.length) return false;
  if (state.wait > 0) {
    state.wait = Math.max(0, state.wait - dt);
    return false;
  }
  const target = state.detour?.[0] || points[state.target % points.length],
    dx = target.x - state.x,
    dz = target.z - state.z,
    distance = Math.hypot(dx, dz);
  if (distance < 0.15) {
    if (state.detour?.length) {
      state.detour.shift();
      return false;
    }
    state.target = (state.target + 1) % points.length;
    state.wait = 0.6;
    return false;
  }
  const step = Math.min(distance, speed * Math.min(dt, 0.1)),
    x = state.x + (dx / distance) * step,
    z = state.z + (dz / distance) * step;
  if (blocked(x, z)) {
    state.stuck += dt;
    if (
      state.stuck > 0.4 &&
      !state.detour?.length &&
      (state.replans || 0) < 1
    ) {
      state.replans = (state.replans || 0) + 1;
      state.detour =
        findDetour(state, points[state.target % points.length], blocked) ||
        undefined;
    }
    if (state.stuck > 2) {
      state.target = (state.target + 1) % points.length;
      state.stuck = 0;
      state.wait = 0.5;
      state.detour = undefined;
      state.replans = 0;
    }
    return false;
  }
  state.x = x;
  state.z = z;
  state.stuck = 0;
  if (!state.detour?.length) state.replans = 0;
  return true;
}
export function trafficPose(progress: number) {
  const u = ((progress % 304) + 304) % 304;
  return u < 80
    ? { x: -40 + u, z: -36, yaw: -Math.PI / 2 }
    : u < 152
      ? { x: 40, z: -36 + u - 80, yaw: Math.PI }
      : u < 232
        ? { x: 40 - (u - 152), z: 36, yaw: Math.PI / 2 }
        : { x: -40, z: 36 - (u - 232), yaw: 0 };
}
