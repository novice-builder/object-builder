import * as T from "three";
import { collides } from "../legacy06/core.js";
import { rayBoxNear } from "../build/picking";
export function fly(
  p: any,
  input: { forward: number; right: number },
  vertical: number,
  dt: number,
  solids: any[],
) {
  const n = Math.max(1, Math.hypot(input.forward, input.right)),
    dx =
      ((-Math.sin(p.yaw) * input.forward + Math.cos(p.yaw) * input.right) * 6) /
      n,
    dz =
      ((-Math.cos(p.yaw) * input.forward - Math.sin(p.yaw) * input.right) * 6) /
      n;
  const steps = Math.max(1, Math.ceil(dt / 0.01));
  for (let i = 0; i < steps; i++)
    for (const [axis, speed] of [
      ["x", dx],
      ["z", dz],
      ["y", vertical * 5],
    ] as const) {
      const old = p[axis];
      p[axis] = Math.max(
        axis === "y" ? 0 : -249,
        Math.min(axis === "y" ? 24 : 249, old + (speed * dt) / steps),
      );
      if (collides(p, solids)) p[axis] = old;
    }
  p.vy = 0;
  p.grounded = p.y === 0;
}
export function avatar(color = 0xe4b166) {
  const group = new T.Group(),
    g = new T.BoxGeometry(1, 1, 1);
  const put = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
  ) => {
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ color: c }));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    group.add(m);
    return m;
  };
  put(0, 1.43, 0, 0.4, 0.4, 0.38, 0xf0c49e);
  put(0, 1.66, 0.02, 0.43, 0.12, 0.4, 0x725646);
  put(0, 0.93, 0, 0.48, 0.55, 0.3, color);
  const left = put(-0.14, 0.35, 0, 0.2, 0.65, 0.24, 0x557d83),
    right = put(0.14, 0.35, 0, 0.2, 0.65, 0.24, 0x557d83);
  put(-0.34, 0.92, 0, 0.16, 0.5, 0.2, 0xf0c49e);
  put(0.34, 0.92, 0, 0.16, 0.5, 0.2, 0xf0c49e);
  return { group, left, right };
}
export function followCamera(
  camera: T.PerspectiveCamera,
  p: any,
  solids: any[],
) {
  const target = new T.Vector3(p.x, p.y + 1.3, p.z),
    desired = new T.Vector3(
      p.x + Math.sin(p.yaw) * 4.5,
      p.y + 3,
      p.z + Math.cos(p.yaw) * 4.5,
    ),
    direction = desired.clone().sub(target).normalize(),
    ray = new T.Ray(target, direction);
  let distance = desired.distanceTo(target);
  for (const b of solids) {
    const expanded = {
      ...b,
      minX: b.minX - 0.2,
      maxX: b.maxX + 0.2,
      minY: b.minY - 0.2,
      maxY: b.maxY + 0.2,
      minZ: b.minZ - 0.2,
      maxZ: b.maxZ + 0.2,
      ...(b.obb
        ? {
            obb: {
              ...b.obb,
              halfW: b.obb.halfW + 0.2,
              halfD: b.obb.halfD + 0.2,
            },
          }
        : {}),
    };
    distance = Math.min(distance, rayBoxNear(ray, expanded) - 0.2);
  }
  distance = Math.max(0.15, distance);
  camera.position.copy(target.addScaledVector(direction, distance));
  camera.lookAt(p.x, p.y + 1.3, p.z);
  camera.updateMatrixWorld();
  return distance > 0.7;
}
