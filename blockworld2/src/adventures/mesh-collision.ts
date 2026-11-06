import * as T from "three";
import { Octree } from "three/examples/jsm/math/Octree.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
export const BODY_RADIUS = 0.28,
  BODY_HEIGHT = 1.75;
export interface FootPose {
  x: number;
  y: number;
  z: number;
}
export interface Contact {
  normal: T.Vector3;
  depth: number;
  canStep: boolean;
  source: string;
}
export interface FloorHit {
  y: number;
  canStep: boolean;
  source: string;
}
export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  canStep?: boolean;
  source?: string;
}
class PaddedOctree extends Octree {
  private reverse = new T.Triangle();
  override triangleCapsuleIntersect(capsule: Capsule, triangle: T.Triangle) {
    // Saved/imported poses and jumps may approach the back of a thin surface.
    // Keep openings, but test both sides of the real triangle.
    return (
      super.triangleCapsuleIntersect(capsule, triangle) ||
      super.triangleCapsuleIntersect(
        capsule,
        this.reverse.set(triangle.c, triangle.b, triangle.a),
      )
    );
  }
  override build() {
    // Three r160 pads only the minimum. Floating point subdivision can otherwise
    // discard triangles on the maximum plane (notably the final stair tread).
    this.bounds.expandByScalar(0.00001);
    return super.build();
  }
}
/** Cached actual triangle topology. Openings remain open; a building's broad bounds never block movement. */
export class MeshShape {
  readonly tree = new PaddedOctree();
  readonly bounds: T.Box3;
  readonly triangles: number;
  constructor(source: T.Object3D) {
    source.updateWorldMatrix(true, true);
    this.bounds = new T.Box3().setFromObject(source);
    let count = 0;
    source.traverse((o) => {
      if (o instanceof T.Mesh)
        count +=
          (o.geometry.index?.count ??
            o.geometry.getAttribute("position").count) / 3;
    });
    this.triangles = count;
    this.tree.fromGraphNode(source);
  }
}
interface Instance {
  shape: MeshShape;
  matrix: T.Matrix4;
  inverse: T.Matrix4;
  normal: T.Matrix3;
  scale: number;
  bounds: T.Box3;
  canStep: boolean;
  source: string;
}
/** Uniformly scaled/rotated model instances share one local tree. Bake nonuniform geometry before adding it. */
export class CollisionSpace {
  private instances: Instance[] = [];
  boxes: readonly CollisionBox[] = [];
  private capsule = new Capsule();
  private ray = new T.Ray();
  private triangles: T.Triangle[] = [];
  private point = new T.Vector3();
  private normal = new T.Vector3();
  constructor(
    readonly ground: (x: number, z: number) => number = () => 0,
    readonly valid: (x: number, z: number) => boolean = () => true,
  ) {}
  add(
    shape: MeshShape,
    matrix = new T.Matrix4(),
    canStep = true,
    source = "mesh",
  ) {
    const p = new T.Vector3(),
      q = new T.Quaternion(),
      s = new T.Vector3();
    matrix.decompose(p, q, s);
    if (Math.max(s.x, s.y, s.z) - Math.min(s.x, s.y, s.z) > 1e-5 || s.x <= 0)
      throw Error(
        "Collision instances require uniform positive scale; bake nonuniform transforms first",
      );
    this.instances.push({
      shape,
      matrix: matrix.clone(),
      inverse: matrix.clone().invert(),
      normal: new T.Matrix3().getNormalMatrix(matrix),
      scale: s.x,
      bounds: shape.bounds.clone().applyMatrix4(matrix),
      canStep,
      source,
    });
  }
  contact(
    p: FootPose,
    radius = BODY_RADIUS,
    height = BODY_HEIGHT,
    ignoreSource?: string,
  ): Contact | null {
    let best: Contact | null = null;
    for (const item of this.instances) {
      if (ignoreSource && item.source === ignoreSource) continue;
      const b = item.bounds;
      if (
        p.x + radius < b.min.x ||
        p.x - radius > b.max.x ||
        p.z + radius < b.min.z ||
        p.z - radius > b.max.z ||
        p.y + height < b.min.y ||
        p.y > b.max.y
      )
        continue;
      this.capsule.start.set(p.x, p.y + radius, p.z).applyMatrix4(item.inverse);
      this.capsule.end
        .set(p.x, p.y + height - radius, p.z)
        .applyMatrix4(item.inverse);
      this.capsule.radius = radius / item.scale;
      const hit = item.shape.tree.capsuleIntersect(this.capsule);
      if (
        hit &&
        hit.depth * item.scale > 0.0001 &&
        (!best || hit.depth * item.scale > best.depth)
      )
        best = {
          normal: hit.normal.applyMatrix3(item.normal).normalize(),
          depth: hit.depth * item.scale,
          canStep: item.canStep,
          source: item.source,
        };
    }
    for (const b of this.boxes) {
      if (ignoreSource && b.source === ignoreSource) continue;
      if (
        p.x + radius < b.minX ||
        p.x - radius > b.maxX ||
        p.z + radius < b.minZ ||
        p.z - radius > b.maxZ ||
        p.y + height < b.minY ||
        p.y > b.maxY
      )
        continue;
      const ay = T.MathUtils.clamp(
          (b.minY + b.maxY) / 2,
          p.y + radius,
          p.y + height - radius,
        ),
        dx = p.x - T.MathUtils.clamp(p.x, b.minX, b.maxX),
        dy = ay - T.MathUtils.clamp(ay, b.minY, b.maxY),
        dz = p.z - T.MathUtils.clamp(p.z, b.minZ, b.maxZ),
        distance = Math.hypot(dx, dy, dz);
      if (distance >= radius - 0.0001) continue;
      let normal = new T.Vector3(dx, dy, dz),
        depth = radius - distance;
      if (distance > 0.00001) normal.multiplyScalar(1 / distance);
      else {
        const moves = [
          { d: b.maxX + radius - p.x, n: [1, 0, 0] },
          { d: p.x - b.minX + radius, n: [-1, 0, 0] },
          { d: b.maxZ + radius - p.z, n: [0, 0, 1] },
          { d: p.z - b.minZ + radius, n: [0, 0, -1] },
          { d: b.maxY - p.y, n: [0, 1, 0] },
          { d: p.y + height - b.minY, n: [0, -1, 0] },
        ]
          .filter((v) => v.d >= 0)
          .sort((a, b) => a.d - b.d);
        depth = moves[0].d;
        normal.fromArray(moves[0].n);
      }
      if (!best || depth > best.depth)
        best = {
          normal,
          depth,
          canStep: b.canStep ?? false,
          source: b.source ?? "object",
        };
    }
    return best;
  }
  floor(
    x: number,
    z: number,
    maxY: number,
    minY: number,
    stepOnly = false,
  ): FloorHit | null {
    const ground = this.ground(x, z);
    let best: FloorHit | null =
      ground <= maxY + 0.00001 && ground >= minY
        ? { y: ground, canStep: true, source: "ground" }
        : null;
    for (const item of this.instances) {
      if (stepOnly && !item.canStep) continue;
      const b = item.bounds;
      if (
        x < b.min.x ||
        x > b.max.x ||
        z < b.min.z ||
        z > b.max.z ||
        b.min.y > maxY ||
        b.max.y < minY
      )
        continue;
      this.ray.origin.set(x, maxY, z).applyMatrix4(item.inverse);
      this.ray.direction.set(0, -1, 0).transformDirection(item.inverse);
      this.triangles.length = 0;
      item.shape.tree.getRayTriangles(this.ray, this.triangles);
      for (const triangle of this.triangles) {
        triangle.getNormal(this.normal).applyMatrix3(item.normal).normalize();
        if (this.normal.y < 0.65) continue;
        if (
          !this.ray.intersectTriangle(
            triangle.a,
            triangle.b,
            triangle.c,
            true,
            this.point,
          )
        )
          continue;
        const y = this.point.applyMatrix4(item.matrix).y;
        if (y < minY - 0.00001 || y > maxY + 0.00001 || (best && best.y >= y))
          continue;
        best = { y, canStep: item.canStep, source: item.source };
      }
    }
    if (!stepOnly)
      for (const b of this.boxes)
        if (
          b.maxY <= maxY + 0.00001 &&
          b.maxY >= minY &&
          x >= b.minX &&
          x <= b.maxX &&
          z >= b.minZ &&
          z <= b.maxZ &&
          (!best || b.maxY > best.y)
        )
          best = {
            y: b.maxY,
            canStep: b.canStep ?? false,
            source: b.source ?? "object",
          };
    return best;
  }
  clear(p: FootPose, radius = BODY_RADIUS, height = BODY_HEIGHT) {
    const hit = this.contact(p, radius, height);
    return !hit || hit.depth < 0.0005;
  }
  support(p: FootPose, above = 0.004, below = 0.31) {
    let best = this.floor(p.x, p.z, p.y + above, p.y - below);
    if (best && Math.abs(best.y - p.y) < 0.01) return best;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4,
        r = BODY_RADIUS * 0.93,
        floor = this.floor(
          p.x + Math.cos(angle) * r,
          p.z + Math.sin(angle) * r,
          p.y + above,
          p.y - below,
        );
      if (floor && (!best || floor.y > best.y)) best = floor;
    }
    return best;
  }
  supported(p: FootPose, tolerance = 0.03) {
    return !!this.support(p, 0.004, tolerance);
  }
  cameraFraction(origin: T.Vector3, offset: T.Vector3) {
    const length = offset.length();
    if (!length) return 1;
    const direction = offset.clone().normalize(),
      right = new T.Vector3()
        .crossVectors(direction, new T.Vector3(0, 1, 0))
        .normalize()
        .multiplyScalar(0.18),
      up = new T.Vector3()
        .crossVectors(right, direction)
        .normalize()
        .multiplyScalar(0.18);
    const bounds = new T.Box3()
        .setFromPoints([origin, origin.clone().add(offset)])
        .expandByScalar(0.18),
      rays = [
        new T.Vector3(),
        right,
        right.clone().negate(),
        up,
        up.clone().negate(),
      ].map((shift) => new T.Ray(origin.clone().add(shift), direction.clone()));
    let fraction = 1;
    for (const item of this.instances) {
      if (!bounds.intersectsBox(item.bounds)) continue;
      for (const ray of rays) {
        if (!ray.intersectsBox(item.bounds)) continue;
        this.ray.copy(ray).applyMatrix4(item.inverse);
        const hit = item.shape.tree.rayIntersect(this.ray);
        if (hit)
          fraction = Math.min(
            fraction,
            Math.max(0, (hit.distance * item.scale - 0.18) / length),
          );
      }
    }
    return fraction;
  }
  stats() {
    return {
      instances: this.instances.length,
      cachedTriangles: [...new Set(this.instances.map((i) => i.shape))].reduce(
        (n, s) => n + s.triangles,
        0,
      ),
      boxes: this.boxes.length,
    };
  }
}
