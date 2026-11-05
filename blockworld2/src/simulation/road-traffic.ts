import type { Point } from "./navigation";
const nodes: Point[] = [
  { x: -86, z: -82 },
  { x: 8, z: -82 },
  { x: 86, z: -82 },
  { x: -86, z: -56 },
  { x: 8, z: -56 },
  { x: 86, z: -56 },
  { x: -86, z: 82 },
  { x: 8, z: 82 },
  { x: 86, z: 82 },
];
const links = [
  [1, 3],
  [0, 2, 4],
  [1, 5],
  [0, 4, 6],
  [1, 3, 5, 7],
  [2, 4, 8],
  [3, 7],
  [4, 6, 8],
  [5, 7],
];
export interface RoadCar {
  x: number;
  z: number;
  yaw: number;
  from: number;
  to: number;
  previous: number;
  visits: number;
  wait: number;
  blocked: number;
  seed: number;
  reverse: boolean;
}
/** Local lane following, deterministic choices and exclusive occupied-junction tokens. */
export class RoadTraffic {
  cars: RoadCar[] = [];
  reservations = new Map<number, number>();
  constructor() {
    for (const [i, from] of [0, 2, 6, 8].entries()) {
      const to = links[from][0],
        a = nodes[from],
        b = nodes[to],
        d = Math.hypot(b.x - a.x, b.z - a.z),
        dx = (b.x - a.x) / d,
        dz = (b.z - a.z) / d;
      this.cars.push({
        x: a.x + dz * 1.5,
        z: a.z - dx * 1.5,
        yaw: Math.atan2(-dx, -dz),
        from,
        to,
        previous: -1,
        visits: 0,
        wait: i * 0.4,
        blocked: 0,
        seed: i + 1,
        reverse: false,
      });
    }
  }
  update(
    dt: number,
    blocked: (x: number, z: number, yaw: number, index: number) => boolean,
  ) {
    dt = Math.min(dt, 0.1);
    for (const [node, owner] of this.reservations)
      if (
        Math.hypot(
          this.cars[owner].x - nodes[node].x,
          this.cars[owner].z - nodes[node].z,
        ) > 6
      )
        this.reservations.delete(node);
    for (const [i, c] of this.cars.entries()) {
      if (c.wait > 0) {
        c.wait = Math.max(0, c.wait - dt);
        continue;
      }
      const a = nodes[c.from],
        b = nodes[c.to],
        length = Math.hypot(b.x - a.x, b.z - a.z),
        dx = (b.x - a.x) / length,
        dz = (b.z - a.z) / length;
      const goal = c.reverse
          ? { x: a.x + dz * 1.5, z: a.z - dx * 1.5 }
          : { x: b.x + dz * 1.5, z: b.z - dx * 1.5 },
        distance = Math.hypot(goal.x - c.x, goal.z - c.z);
      if (distance < 0.12) {
        const arrived = c.reverse ? c.from : c.to,
          previous = c.reverse ? c.to : c.from;
        c.seed = (c.seed * 1664525 + 1013904223) >>> 0;
        const options = links[arrived].filter((n) => n !== previous),
          next = options[c.seed % options.length] ?? previous;
        c.from = arrived;
        c.to = next;
        c.previous = previous;
        c.visits++;
        c.reverse = false;
        c.blocked = 0;
        c.wait = c.visits % 5 === 0 ? 1.5 : 0.25;
        continue;
      }
      if (!c.reverse && distance < 6) {
        const owner = this.reservations.get(c.to);
        if (owner !== undefined && owner !== i) continue;
        this.reservations.set(c.to, i);
      }
      const speed = 2.8 * dt,
        x = c.x + ((goal.x - c.x) / distance) * Math.min(speed, distance),
        z = c.z + ((goal.z - c.z) / distance) * Math.min(speed, distance),
        yaw = Math.atan2(c.x - x, c.z - z);
      const spacing = this.cars.some(
        (other, n) =>
          n !== i &&
          Math.hypot(x - other.x, z - other.z) < 4.8 &&
          Math.cos(yaw - other.yaw) > 0.6 &&
          (other.x - x) * -Math.sin(yaw) + (other.z - z) * -Math.cos(yaw) > 0,
      );
      if (spacing || blocked(x, z, yaw, i)) {
        c.blocked += dt;
        if (c.blocked > 5 && !spacing && !c.reverse) {
          c.reverse = true;
          c.wait = 0.8;
          if (this.reservations.get(c.to) === i) this.reservations.delete(c.to);
        }
        continue;
      }
      c.x = x;
      c.z = z;
      c.yaw = yaw;
      c.blocked = 0;
    }
  }
}
