import * as T from "three";
import { avatar } from "../player/modes";
import { overlaps, bodyBox } from "../legacy06/core.js";
import { safeGround } from "../world/spawn";
export interface CarState {
  x: number;
  z: number;
  yaw: number;
}
function carModel(color: number) {
  const g = new T.Group(),
    cube = new T.BoxGeometry(1, 1, 1);
  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    c: number,
  ) => {
    const m = new T.Mesh(cube, new T.MeshLambertMaterial({ color: c }));
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
  };
  box(0, 0.65, 0, 1.5, 0.65, 3, color);
  box(0, 1.2, 0, 1.25, 0.6, 1.4, 0xc8e2dc);
  box(0, 1.56, 0, 1.4, 0.12, 1.6, color);
  for (const x of [-0.78, 0.78])
    for (const z of [-0.95, 0.95]) box(x, 0.32, z, 0.22, 0.58, 0.58, 0x3f514d);
  box(0, 0.65, -1.52, 0.9, 0.2, 0.06, 0xffecb6);
  return g;
}
export function carBox(c: CarState) {
  const co = Math.cos(c.yaw),
    s = Math.sin(c.yaw),
    w = Math.abs(co) * 0.8 + Math.abs(s) * 1.6,
    d = Math.abs(s) * 0.8 + Math.abs(co) * 1.6;
  return {
    minX: c.x - w,
    maxX: c.x + w,
    minY: 0,
    maxY: 1.7,
    minZ: c.z - d,
    maxZ: c.z + d,
    obb: { cx: c.x, cz: c.z, c: co, s, halfW: 0.8, halfD: 1.6 },
  };
}
export class Activity {
  group = new T.Group();
  car: CarState = { x: -28, z: -2, yaw: 0 };
  vehicle = carModel(0xe6b466);
  driving = false;
  time = 0;
  agents: {
    model: T.Group;
    phase: number;
    animal: boolean;
    left?: T.Mesh;
    right?: T.Mesh;
  }[] = [];
  traffic: T.Group[] = [];
  progress = [0, 152];
  constructor(scene: T.Scene) {
    scene.add(this.group);
    this.group.add(this.vehicle);
    for (let i = 0; i < 4; i++) {
      const a = avatar([0xd99a7a, 0x8aafa3, 0xd7bf76, 0x91a8bd][i]);
      this.group.add(a.group);
      this.agents.push({
        model: a.group,
        phase: i * 0.25,
        animal: false,
        left: a.left,
        right: a.right,
      });
    }
    for (let i = 0; i < 2; i++) {
      const g = new T.Group(),
        geometry = new T.BoxGeometry(1, 1, 1),
        mat = new T.MeshLambertMaterial({ color: i ? 0xffedb7 : 0xc8b19a });
      for (const [x, y, z, w, h, d] of [
        [0, 0.3, 0, 0.65, 0.4, 0.4],
        [0, 0.57, -0.3, 0.35, 0.3, 0.3],
        [-0.2, 0.1, 0, 0.1, 0.3, 0.1],
        [0.2, 0.1, 0, 0.1, 0.3, 0.1],
        [0, 0.58, -0.53, 0.2, 0.1, 0.2],
      ]) {
        const m = new T.Mesh(geometry, mat);
        m.position.set(x, y, z);
        m.scale.set(w, h, d);
        g.add(m);
      }
      this.group.add(g);
      this.agents.push({ model: g, phase: i * 0.5, animal: true });
    }
    for (let i = 0; i < 2; i++) {
      const c = carModel([0xb97f6d, 0x83a7a4][i]);
      this.traffic.push(c);
      this.group.add(c);
    }
    this.sync();
  }
  private sync() {
    this.vehicle.position.set(this.car.x, 0, this.car.z);
    this.vehicle.rotation.y = this.car.yaw;
  }
  load(value: any) {
    if (value?.car) {
      const c = value.car;
      if (
        ![c.x, c.z, c.yaw].every(Number.isFinite) ||
        Math.abs(c.x) > 249 ||
        Math.abs(c.z) > 249
      )
        throw Error("Invalid saved car");
      this.car = { ...c };
    }
    this.driving = false;
    this.sync();
  }
  snapshot() {
    return { car: { ...this.car } };
  }
  use(p: any, solids: any[]) {
    if (this.driving) {
      const exit = safeGround(
        {
          x: this.car.x + Math.cos(this.car.yaw) * 2,
          z: this.car.z - Math.sin(this.car.yaw) * 2,
          yaw: this.car.yaw,
        },
        [...solids, carBox(this.car)],
      );
      Object.assign(p, exit);
      this.driving = false;
      return "✓ Parked — ready to walk";
    }
    if (
      Math.abs(p.y) < 2 &&
      Math.hypot(p.x - this.car.x, p.z - this.car.z) < 3
    ) {
      this.driving = true;
      p.y = 0;
      this.sync();
      return "🚗 Drive with the stick · tap Use to leave";
    }
    const a = this.agents.find(
      (a) =>
        Math.hypot(a.model.position.x - p.x, a.model.position.z - p.z) < 2.5,
    );
    return a
      ? a.animal
        ? "♡ Hello, little friend!"
        : "👋 Hello, neighbour!"
      : null;
  }
  update(
    dt: number,
    p: any,
    input: { forward: number; right: number },
    solids: any[],
  ) {
    this.time += dt;
    if (this.driving) {
      const c = {
          ...this.car,
          yaw:
            this.car.yaw -
            input.right * dt * 1.3 * Math.sign(input.forward || 1),
        },
        speed = input.forward * 6;
      c.x -= Math.sin(c.yaw) * speed * dt;
      c.z -= Math.cos(c.yaw) * speed * dt;
      if (
        Math.abs(c.x) < 47 &&
        Math.abs(c.z) < 47 &&
        !solids.some((s) => overlaps(carBox(c), s))
      ) {
        this.car = c;
      }
      Object.assign(p, {
        x: this.car.x,
        y: 0,
        z: this.car.z,
        yaw: this.car.yaw,
        vy: 0,
        grounded: true,
      });
      this.sync();
    }
    for (const a of this.agents) {
      const angle = a.phase * Math.PI * 2 + dt * (a.animal ? 0.13 : 0.08),
        x = (a.animal ? 22 : 17) + Math.cos(angle) * (a.animal ? 3 : 9),
        z = (a.animal ? 22 : 8) + Math.sin(angle) * (a.animal ? 2 : 2);
      const candidate = { x, y: 0, z };
      if (
        Math.hypot(x - p.x, z - p.z) > 1 &&
        !solids.some((s) => overlaps(bodyBox(candidate), s))
      ) {
        a.phase = angle / (Math.PI * 2);
        a.model.position.set(x, 0, z);
        a.model.rotation.y = -angle - Math.PI / 2;
      }
      if (a.left && a.right) {
        a.left.rotation.x = Math.sin(this.time * 5 + a.phase) * 0.25;
        a.right.rotation.x = -a.left.rotation.x;
      }
    }
    for (let i = 0; i < this.traffic.length; i++) {
      const u = (this.progress[i] + dt * 2) % 304;
      const pos =
        u < 80
          ? { x: -40 + u, z: -36, yaw: -Math.PI / 2 }
          : u < 152
            ? { x: 40, z: -36 + u - 80, yaw: Math.PI }
            : u < 232
              ? { x: 40 - (u - 152), z: 36, yaw: Math.PI / 2 }
              : { x: -40, z: 36 - (u - 232), yaw: 0 };
      const car = this.traffic[i];
      if (
        Math.hypot(pos.x - p.x, pos.z - p.z) > 3 &&
        !solids.some((s) => overlaps(carBox(pos), s))
      ) {
        this.progress[i] = u;
        car.position.set(pos.x, 0, pos.z);
        car.rotation.y = pos.yaw;
      }
    }
  }
  dispose() {
    const gs = new Set<T.BufferGeometry>(),
      ms = new Set<T.Material>();
    this.group.traverse((o: any) => {
      if (o.isMesh) {
        gs.add(o.geometry);
        ms.add(o.material);
      }
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m) => m.dispose());
    this.group.removeFromParent();
  }
}
