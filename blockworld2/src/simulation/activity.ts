import { stepRoute, trafficPose, type RouteState } from "./routes";
import { RoadTraffic } from "./road-traffic";
import { animalModel, type Species } from "./animals";
import * as T from "three";
import { avatar } from "../player/modes";
import { createAvatar, APPEARANCES } from "../player/appearance";
import { overlaps, bodyBox } from "../player/physics.js";
import { safeGround } from "../world/spawn";
export interface CarState {
  x: number;
  z: number;
  yaw: number;
}
export function carModel(color: number, style = 0) {
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
    const m = new T.Mesh(
      cube,
      new T.MeshLambertMaterial({
        color: c,
        transparent: c === 0xc8e2dc,
        opacity: c === 0xc8e2dc ? 0.35 : 1,
        depthWrite: c !== 0xc8e2dc,
      }),
    );
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    g.add(m);
  };
  box(0, 0.65, 0, 1.5, 0.65, 3, color);
  box(0, 1.2, 0, 1.25, 0.6, 1.4, 0xc8e2dc);
  if (style !== 2)
    box(
      0,
      1.56,
      style === 1 ? 0.3 : 0,
      1.4,
      0.12,
      style === 1 ? 2.2 : 1.6,
      color,
    );
  if (style === 1) box(0, 1.15, 0.85, 1.4, 0.7, 1.2, color);
  if (style === 2) {
    box(-0.4, 1, 0, 0.35, 0.5, 0.7, 0x716a5e);
    box(0.4, 1, 0, 0.35, 0.5, 0.7, 0x716a5e);
  }
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
    species?: Species;
    route: { x: number; z: number }[];
    state: RouteState;
    greetUntil: number;
    limbs: T.Mesh[];
  }[] = [];
  traffic: T.Group[] = [];
  progress = [0, 152];
  roadTraffic: RoadTraffic | null = null;
  constructor(
    scene: T.Scene,
    readonly range = 47,
    readonly query?: (point: any, radius: number) => any[],
  ) {
    scene.add(this.group);
    this.group.add(this.vehicle);
    const routes = [
      [
        [26, 8],
        [22, 10],
        [12, 10],
        [12, 6],
        [22, 6],
      ],
      [
        [12, 6],
        [17, 6],
        [24, 9],
        [17, 10],
      ],
      [
        [56, -12],
        [56, -20.6],
        [58, -20.6],
        [56, -12],
      ],
      [
        [56, 0],
        [56, 9],
        [58, 5.4],
      ],
      [
        [14, 32],
        [29, 32],
        [25, 31],
      ],
      [
        [-9, 16],
        [-9, 22],
        [-2, 22],
        [3, 16],
      ],
    ];
    const addAgent = (
      model: T.Group,
      route: number[][],
      animal: boolean,
      limbs: T.Mesh[],
      species?: Species,
      start = 0,
    ) => {
      const points = route.map(([x, z]) => ({ x, z })),
        state = {
          ...points[start % points.length],
          target: (start + 1) % points.length,
          wait: 0,
          stuck: 0,
        };
      model.position.set(state.x, 0, state.z);
      this.group.add(model);
      this.agents.push({
        model,
        route: points,
        state,
        phase: this.agents.length * 0.4,
        animal,
        limbs,
        greetUntil: 0,
        species,
      });
    };
    for (
      let i = 0;
      i < (range > 200 ? 16 : range > 100 ? 12 : range > 47 ? 6 : 4);
      i++
    ) {
      const a =
        range > 100
          ? createAvatar(APPEARANCES[i % APPEARANCES.length].id)
          : avatar(
              [0xd99a7a, 0x8aafa3, 0xd7bf76, 0x91a8bd, 0xb29ab1, 0xb9b786][
                i % 6
              ],
            );
      const outer = [
        [
          [-91, -75],
          [-91, -30],
          [-94, -12],
          [-91, -30],
        ],
        [
          [-80, -88],
          [-40, -88],
          [0, -88],
          [-40, -88],
        ],
        [
          [91, -45],
          [91, 0],
          [100, 14],
          [91, 0],
        ],
        [
          [91, 45],
          [91, 70],
          [70, 88],
          [91, 70],
        ],
        [
          [-91, 55],
          [-91, 85],
          [-70, 88],
          [-91, 85],
        ],
        [
          [20, 88],
          [50, 88],
          [70, 98],
          [50, 88],
        ],
      ];
      addAgent(
        a.group,
        range > 200 && i >= 12
          ? [
              [
                [-120, -205],
                [-40, -205],
                [-120, -205],
              ],
              [
                [-205, 80],
                [-205, 130],
                [-205, 80],
              ],
              [
                [204, 90],
                [204, 170],
                [204, 90],
              ],
              [
                [40, 204],
                [140, 204],
                [40, 204],
              ],
            ][i - 12]
          : range > 100 && i >= 6
            ? outer[i - 6]
            : routes[range > 47 ? i : i % 2],
        false,
        [a.left, a.right],
        undefined,
        range <= 47 ? Math.floor(i / 2) : 0,
      );
    }
    const species: Species[] =
      range > 100
        ? ["dog", "cat", "duck", "horse", "cow", "sheep", "chicken", "rabbit"]
        : range > 47
          ? ["dog", "cat", "duck", "horse"]
          : ["cat", "duck"];
    const habitats: Record<Species, number[][]> = {
      cow: [
        [-83, 130],
        [-78, 130],
        [-78, 137],
        [-83, 137],
      ],
      sheep: [
        [-69, 130],
        [-63, 130],
        [-63, 138],
        [-69, 138],
      ],
      chicken: [
        [-61, 117],
        [-56, 117],
        [-56, 120],
        [-61, 120],
      ],
      rabbit: [
        [48, 119],
        [52, 119],
        [52, 124],
        [48, 124],
      ],
      dog: [
        [14, 17],
        [22, 17],
        [22, 20],
        [14, 20],
      ],
      cat: [
        [-12, -5],
        [-8, -5],
        [-8, 0],
        [-12, 0],
      ],
      duck: [
        [28, 24],
        [32, 24],
        [32, 27],
        [28, 27],
      ],
      horse: [
        [-54, 42],
        [-48, 42],
        [-48, 47],
        [-54, 47],
      ],
    };
    if (range > 100)
      habitats.duck = [
        [87, -112],
        [87, -121],
        [88, -125],
        [87, -121],
      ];
    for (const name of species) {
      const a = animalModel(name);
      addAgent(a.group, habitats[name], true, a.limbs, name);
    }
    if (range > 200) {
      const horse = animalModel("horse");
      addAgent(
        horse.group,
        [
          [173, 133],
          [173, 141],
          [160, 141],
          [160, 133],
        ],
        true,
        horse.limbs,
        "horse",
      );
    }
    if (range > 100) this.roadTraffic = new RoadTraffic(range > 200 ? 210 : 86);
    for (let i = 0; i < (this.roadTraffic ? 4 : 2); i++) {
      const c = carModel([0xb97f6d, 0x83a7a4, 0xc9b17e, 0x90a9b5][i], i % 3);
      this.traffic.push(c);
      const pose = this.roadTraffic?.cars[i] || trafficPose(this.progress[i]);
      c.position.set(pose.x, 0, pose.z);
      c.rotation.y = pose.yaw;
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
    if (a && Math.abs(p.y) < 2) {
      a.greetUntil = this.time + 2;
      a.model.rotation.y = Math.atan2(p.x - a.state.x, p.z - a.state.z);
      return a.animal ? `♡ Hello, ${a.species}!` : "👋 Hello, neighbour!";
    }
    return null;
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
        Math.abs(c.x) < this.range &&
        Math.abs(c.z) < this.range &&
        ![
          ...(this.query?.(c, 3) || solids),
          ...this.traffic.map((m) =>
            carBox({ x: m.position.x, z: m.position.z, yaw: m.rotation.y }),
          ),
        ].some((s) => overlaps(carBox(c), s))
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
    const parked = carBox(this.car);
    for (const a of this.agents) {
      const distance = Math.hypot(a.state.x - p.x, a.state.z - p.z);
      a.model.visible = distance < 105;
      if (distance > 80) continue;
      const before = { x: a.state.x, z: a.state.z };
      let moving = false;
      const targetBefore = a.state.target;
      if (this.time >= a.greetUntil)
        moving = stepRoute(
          a.state,
          a.route,
          dt,
          a.animal ? 0.65 : 1,
          (x, z) =>
            Math.hypot(x - p.x, z - p.z) < 0.8 ||
            this.agents.some(
              (other) =>
                other !== a &&
                Math.hypot(x - other.state.x, z - other.state.z) < 0.65,
            ) ||
            [
              ...(this.query?.({ x, y: 0, z }, 1.2) || solids),
              parked,
              ...this.traffic.map((m) =>
                carBox({ x: m.position.x, z: m.position.z, yaw: m.rotation.y }),
              ),
            ].some((s) => {
              const radius =
                a.species === "horse" || a.species === "cow"
                  ? 0.4
                  : a.animal
                    ? 0.22
                    : 0.28;
              const height =
                a.species === "horse"
                  ? 2
                  : a.species === "cow"
                    ? 1.5
                    : a.animal
                      ? 0.95
                      : 1.65;
              return overlaps(
                {
                  minX: x - radius,
                  maxX: x + radius,
                  minZ: z - radius,
                  maxZ: z + radius,
                  minY: 0.001,
                  maxY: height,
                },
                s,
              );
            }),
        );
      if (targetBefore !== a.state.target) a.state.wait = a.animal ? 2 : 1;
      a.model.position.set(
        a.state.x,
        moving && a.species === "rabbit"
          ? Math.abs(Math.sin(this.time * 6)) * 0.15
          : 0,
        a.state.z,
      );
      if (moving)
        a.model.rotation.y = Math.atan2(
          -(a.state.x - before.x),
          -(a.state.z - before.z),
        );
      a.limbs.forEach(
        (limb, i) =>
          (limb.rotation.x = moving
            ? Math.sin(this.time * 5 + a.phase + (i % 2 ? Math.PI : 0)) * 0.2
            : 0),
      );
    }
    if (this.roadTraffic) {
      this.roadTraffic.update(
        dt,
        (x, z, yaw, i) =>
          Math.hypot(x - p.x, z - p.z) < 3 ||
          this.agents.some(
            (a) => Math.hypot(x - a.state.x, z - a.state.z) < 2,
          ) ||
          [
            ...(this.query?.({ x, y: 0, z }, 3) || solids),
            parked,
            ...this.roadTraffic!.cars.filter((_, n) => n !== i).map(carBox),
          ].some((s) => overlaps(carBox({ x, z, yaw }), s)),
      );
      this.roadTraffic.cars.forEach((c, i) => {
        this.traffic[i].position.set(c.x, 0, c.z);
        this.traffic[i].rotation.y = c.yaw;
      });
      return;
    }
    for (let i = 0; i < this.traffic.length; i++) {
      const u = (this.progress[i] + dt * 2) % 304,
        pos = trafficPose(u),
        shape = carBox(pos),
        other = this.traffic
          .filter((_, n) => n !== i)
          .map((m) =>
            carBox({ x: m.position.x, z: m.position.z, yaw: m.rotation.y }),
          );
      const headway = this.progress.some(
        (p, n) => n !== i && (p - u + 304) % 304 < 6,
      );
      if (
        !headway &&
        Math.hypot(pos.x - p.x, pos.z - p.z) > 3 &&
        !this.agents.some(
          (a) => Math.hypot(a.state.x - pos.x, a.state.z - pos.z) < 2.5,
        ) &&
        ![...(this.query?.(pos, 3) || solids), parked, ...other].some((s) =>
          overlaps(shape, s),
        )
      ) {
        this.progress[i] = u;
        this.traffic[i].position.set(pos.x, 0, pos.z);
        this.traffic[i].rotation.y = pos.yaw;
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
