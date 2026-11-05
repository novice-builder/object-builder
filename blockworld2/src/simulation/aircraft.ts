import * as T from "three";
import { overlaps } from "../player/physics.js";
import { safeStanding, safeGround } from "../world/spawn";
import { bakeOpaqueParts } from "../render/bake";
export const AIRCRAFT_PARK = { x: 178, y: 0, z: -156, yaw: 0 };
const FLIGHT = [
  { t: 0, ...AIRCRAFT_PARK },
  { t: 6, x: 222, y: 10, z: -164 },
  { t: 12, x: 222, y: 18, z: -195 },
  { t: 22, x: 100, y: 18, z: -190 },
  { t: 35, x: -160, y: 18, z: -190 },
  { t: 48, x: -190, y: 18, z: 70 },
  { t: 60, x: -80, y: 18, z: 190 },
  { t: 72, x: 180, y: 18, z: 180 },
  { t: 84, x: 215, y: 18, z: -100 },
  { t: 94, ...AIRCRAFT_PARK },
];
export function scenicPose(time: number) {
  const i = FLIGHT.findIndex((p) => p.t >= time),
    end = FLIGHT[i < 0 ? FLIGHT.length - 1 : Math.max(1, i)],
    start =
      FLIGHT[Math.max(0, (i < 0 ? FLIGHT.length - 1 : Math.max(1, i)) - 1)],
    u = Math.max(0, Math.min(1, (time - start.t) / (end.t - start.t))),
    smooth = u * u * (3 - 2 * u);
  return {
    x: T.MathUtils.lerp(start.x, end.x, u),
    y: Math.max(0, Math.min(18, T.MathUtils.lerp(start.y, end.y, smooth))),
    z: T.MathUtils.lerp(start.z, end.z, u),
    yaw: Math.atan2(start.x - end.x, start.z - end.z),
  };
}
export class Aircraft {
  group = new T.Group();
  rampGroup = new T.Group();
  propeller = new T.Group();
  pose = { ...AIRCRAFT_PARK };
  passenger = false;
  elapsed = 0;
  holding = false;
  entry: any = null;
  private localSolids: any[] = [];
  private cacheKey = "";
  private cache: any[] = [];
  constructor(parent: T.Group) {
    parent.add(this.group);
    const cube = new T.BoxGeometry(1, 1, 1),
      materials = new Map<number, T.MeshLambertMaterial>();
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: number,
      solid = true,
      glass = false,
    ) => {
      if (!materials.has(color))
        materials.set(
          color,
          new T.MeshLambertMaterial({
            color,
            transparent: glass,
            opacity: glass ? 0.22 : 1,
            depthWrite: !glass,
          }),
        );
      const m = new T.Mesh(cube, materials.get(color));
      m.position.set(x, y, z);
      m.scale.set(w, h, d);
      this.group.add(m);
      if (solid)
        this.localSolids.push({
          minX: x - w / 2,
          maxX: x + w / 2,
          minY: y - h / 2,
          maxY: y + h / 2,
          minZ: z - d / 2,
          maxZ: z + d / 2,
          owner: "aircraft",
        });
      return m;
    };
    box(0, 0.5, 0, 4.2, 0.2, 16, 0xd6d5c4);
    box(0, 3.35, 0, 4.4, 0.2, 16, 0xe4dfc9);
    const wall = (x: number, z: number, d: number) => {
      box(x, 0.95, z, 0.16, 0.7, d, 0xd6d5c4);
      box(x, 2.05, z, 0.12, 1.5, d, 0xa7cbd0, true, true);
      box(x, 3, z, 0.16, 0.4, d, 0xd6d5c4);
    };
    wall(2.1, 0, 16);
    wall(-2.1, -2, 12);
    wall(-2.1, 7, 2);
    box(-2.1, 3, 5, 0.16, 0.5, 2, 0xd6d5c4);
    box(0, 0.95, -7.95, 4.2, 0.7, 0.18, 0x8aa9a4);
    box(0, 2.05, -7.95, 4.2, 1.5, 0.12, 0xa7cbd0, true, true);
    box(0, 3, -7.95, 4.2, 0.4, 0.18, 0xe4dfc9);
    box(0, 1.95, 7.95, 4.2, 2.9, 0.16, 0xd6d5c4);
    box(0, 1, -8.6, 3, 0.7, 1.3, 0x8aa9a4);
    for (const x of [-4.7, 4.7]) box(x, 1.3, -0.5, 5, 0.18, 2.4, 0xb9c9be);
    box(0, 2.9, 7.2, 7, 0.16, 2, 0x8aa9a4);
    box(0, 3.55, 6.8, 0.2, 1.3, 2, 0x8aa9a4);
    for (const x of [-1.3, 1.3])
      for (const z of [-3, 0, 3]) {
        box(x, 1.08, z, 0.85, 0.2, 0.9, 0xb9967a);
        box(x, 1.55, z + 0.4, 0.85, 1.1, 0.15, 0x8faaa2);
      }
    for (const x of [-1.4, 1.4]) box(x, 0.2, 3, 0.25, 0.4, 0.65, 0x4d625b);
    box(0, 0.2, -6, 0.25, 0.4, 0.65, 0x4d625b);
    for (const x of [-3.5, 3.5]) {
      box(x, 1.4, -1.4, 0.65, 0.8, 1.6, 0x8aa9a4);
      const blade = new T.Mesh(
        new T.BoxGeometry(0.12, 2.1, 0.12),
        new T.MeshLambertMaterial({ color: 0x667e76 }),
      );
      blade.position.set(x, 1.4, -2.25);
      this.propeller.add(blade);
    }
    this.group.add(this.propeller);
    // Ramp runs upward toward +x, meeting the cabin floor exactly at x=-2.1.
    const ramp = {
      minX: -5.1,
      maxX: -2.1,
      minY: 0,
      maxY: 0.6,
      minZ: 4.1,
      maxZ: 5.9,
      ramp: {
        cx: -3.6,
        cz: 5,
        c: 0,
        s: -1,
        width: 1.8,
        length: 3,
        rise: 0.6,
        baseY: 0,
      },
      owner: "aircraft:ramp",
    };
    this.localSolids.push(ramp);
    const rampMesh = new T.Mesh(
      new T.BoxGeometry(3, 0.1, 1.8),
      new T.MeshLambertMaterial({ color: 0xb8ad8e }),
    );
    rampMesh.position.set(-3.6, 0.3, 5);
    rampMesh.rotation.z = Math.atan(0.6 / 3);
    this.rampGroup.add(rampMesh);
    this.group.add(this.rampGroup);
    bakeOpaqueParts(this.group);
    this.sync();
  }
  point(x: number, y: number, z: number) {
    const c = Math.cos(this.pose.yaw),
      s = Math.sin(this.pose.yaw);
    return {
      x: this.pose.x + x * c + z * s,
      y: this.pose.y + y,
      z: this.pose.z - x * s + z * c,
    };
  }
  private sync() {
    this.group.position.set(this.pose.x, this.pose.y, this.pose.z);
    this.group.rotation.y = this.pose.yaw;
    this.cacheKey = "";
    this.rampGroup.visible = !this.passenger;
  }
  solids() {
    const key = JSON.stringify(this.pose) + this.passenger;
    if (key === this.cacheKey) return this.cache;
    this.cacheKey = key;
    const c = Math.cos(this.pose.yaw),
      s = Math.sin(this.pose.yaw);
    this.cache = this.localSolids
      .filter((b) => !this.passenger || !b.ramp)
      .map((b) => {
        const hw = (b.maxX - b.minX) / 2,
          hd = (b.maxZ - b.minZ) / 2,
          p = this.point((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2),
          wx = Math.abs(c) * hw + Math.abs(s) * hd,
          wz = Math.abs(s) * hw + Math.abs(c) * hd;
        return {
          ...b,
          minX: p.x - wx,
          maxX: p.x + wx,
          minZ: p.z - wz,
          maxZ: p.z + wz,
          minY: this.pose.y + b.minY,
          maxY: this.pose.y + b.maxY,
          obb: { cx: p.x, cz: p.z, c, s, halfW: hw, halfD: hd },
          ...(b.ramp
            ? {
                ramp: {
                  ...b.ramp,
                  c: Math.cos(this.pose.yaw - Math.PI / 2),
                  s: Math.sin(this.pose.yaw - Math.PI / 2),
                  cx: this.point(b.ramp.cx, 0, b.ramp.cz).x,
                  cz: this.point(b.ramp.cx, 0, b.ramp.cz).z,
                  baseY: this.pose.y,
                },
              }
            : {}),
        };
      });
    return this.cache;
  }
  target() {
    return {
      ...this.point(-1.3, 0.6, -3),
      id: "aircraft:tour",
      kind: "aircraft" as const,
      range: 2.3,
      icon: "✈",
      label: "Scenic flight",
      data: this,
    };
  }
  board(p: any) {
    if (this.passenger) return;
    if (
      p.y < 0.5 ||
      p.y > 0.8 ||
      Math.hypot(p.x - this.target().x, p.z - this.target().z) > 2.3
    )
      throw Error("Walk up the ramp and choose a passenger seat");
    this.entry = { ...p };
    this.passenger = true;
    this.elapsed = 0;
    this.holding = false;
    this.sync();
    this.attach(p);
  }
  private attach(p: any) {
    Object.assign(p, { ...this.point(-1.3, 0.6, -3), vy: 0, grounded: true });
  }
  returnToPark(p: any, solids: any[]) {
    const previous = this.pose,
      wasPassenger = this.passenger;
    this.pose = { ...AIRCRAFT_PARK };
    this.passenger = false;
    this.sync();
    const obstacles = [
      ...solids.filter((s) => !String(s.owner).startsWith("aircraft")),
      ...this.solids(),
    ];
    try {
      let exit;
      try {
        exit = safeStanding(this.entry || this.point(0, 0.6, 5), obstacles);
      } catch {
        exit = safeGround(this.point(-6, 0, 5), obstacles);
      }
      Object.assign(p, exit);
      this.holding = false;
    } catch (error) {
      this.pose = previous;
      this.passenger = wasPassenger;
      this.sync();
      throw error;
    }
  }
  update(dt: number, p: any, query: (p: any, r: number) => any[]) {
    if (!this.passenger) return null;
    if (this.holding) {
      this.attach(p);
      return null;
    }
    this.elapsed = Math.min(94, this.elapsed + dt);
    const next = scenicPose(this.elapsed),
      previous = this.pose;
    const turn =
      ((next.yaw - previous.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    next.yaw = previous.yaw + Math.max(-dt, Math.min(dt, turn));
    this.pose = next;
    this.sync();
    const obstacles = query(this.pose, 12).filter(
      (s) => !String(s.owner).startsWith("aircraft"),
    );
    if (
      this.elapsed >= 94 ||
      this.solids().some((b) => obstacles.some((s) => overlaps(b, s)))
    ) {
      try {
        this.returnToPark(p, query(AIRCRAFT_PARK, 15));
      } catch {
        this.pose = previous;
        this.sync();
        this.holding = true;
        this.attach(p);
        return "✈ Arrival blocked · use Home or the map for recovery";
      }
      return this.elapsed >= 94
        ? "✈ Welcome back to Sunbeam"
        : "✈ Route blocked · safely back at the airfield";
    }
    this.attach(p);
    this.propeller.children.forEach((o) => (o.rotation.z += dt * 24));
    return null;
  }
}
