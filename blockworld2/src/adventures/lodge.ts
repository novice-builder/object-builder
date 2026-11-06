import * as T from "three";
import { AssetLibrary } from "./assets";
import { bakeNature } from "./nature-batch";
import type { Obstacle, Landmark } from "./landscape";
export const LODGE = { x: 128, z: -42, half: 3.3, floor: 0.06, doorHalf: 0.61 };
const body = (
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  height = 3.5,
  name = "lodge-wall",
): Obstacle => ({
  minX: LODGE.x + minX,
  maxX: LODGE.x + maxX,
  minZ: LODGE.z + minZ,
  maxZ: LODGE.z + maxZ,
  height,
  name,
});
export function lodgeWalls(): Obstacle[] {
  return [
    body(-3.5, -3.1, -3.5, 3.5),
    body(3.1, 3.5, -3.5, 3.5),
    body(-3.5, 3.5, -3.5, -3.1),
    body(-3.5, -0.61, 3.1, 3.5),
    body(0.61, 3.5, 3.1, 3.5),
  ];
}
export function lodgeDoorBody(open: boolean, direction = 1): Obstacle {
  return open
    ? body(
        -0.72,
        -0.5,
        direction > 0 ? 2.02 : 3.28,
        direction > 0 ? 3.32 : 4.58,
        2.4,
        "lodge-door",
      )
    : body(-0.61, 0.61, 3.18, 3.42, 2.4, "lodge-door");
}
export class Lodge {
  group = new T.Group();
  roof = new T.Group();
  front = new T.Group();
  back = new T.Group();
  left = new T.Group();
  right = new T.Group();
  hinge = new T.Group();
  readonly walls = lodgeWalls();
  furniture: Obstacle[] = [];
  readonly roofBodies: Obstacle[] = [
    { ...body(-3.9, 3.9, -4.1, 4.1, 5.8, "lodge-roof"), base: 3.3 },
  ];
  readonly cameraBodies: Obstacle[] = [
    { ...body(-0.61, 0.61, 3.1, 3.5, 3.5, "lodge-header"), base: 2.35 },
  ];
  readonly exteriorCameraBodies: Obstacle[] = [
    ...this.cameraBodies,
    ...this.roofBodies,
  ];
  readonly landmarks: Landmark[] = [
    {
      id: "lodge-door",
      name: "The Meadow Lodge",
      x: 128,
      z: -38.7,
      description: "A shelter beside the meadow road.",
      action: "door",
    },
    {
      id: "lodge-book",
      name: "The lodge guestbook",
      x: 126.8,
      z: -44,
      description:
        "You found a real room inside the lodge. A table, shelves and a quiet place to plan the next adventure.",
    },
  ];
  open: boolean;
  private target: number;
  private angle: number;
  private direction = 1;
  private changing = false;
  private buffers: T.BufferGeometry[] = [];
  private joinMaterial = new T.MeshStandardMaterial({
    color: new T.Color(0.28, 0.12, 0.055),
    roughness: 1,
    metalness: 0,
  });
  private material = new T.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
  });
  constructor(
    readonly library: AssetLibrary,
    open = false,
  ) {
    this.open = open;
    this.target = this.angle = open ? Math.PI / 2 : 0;
    const walls = this.back,
      front = this.front,
      floor = new T.Group(),
      furnishings = new T.Group();
    const add = (
      parent: T.Group,
      id: string,
      x: number,
      y: number,
      z: number,
      scale: number | number[] = 1,
      yaw = 0,
    ) => {
      const o = library.create(id, 1);
      o.position.set(x, y, z);
      o.rotation.y = yaw;
      if (Array.isArray(scale)) o.scale.fromArray(scale);
      else o.scale.setScalar(scale);
      parent.add(o);
      return o;
    };
    for (const x of [-2.2, 0, 2.2]) {
      add(walls, "Wall_Plaster_Straight", x, 0.06, -3.3, 1.1, Math.PI);
      add(
        front,
        x === 0 ? "Wall_Plaster_Door_Flat" : "Wall_Plaster_Straight",
        x,
        0.06,
        3.3,
        1.1,
      );
      for (const z of [-2.2, 0, 2.2])
        add(floor, "Floor_WoodDark", x, 0.04, z, 1.1);
    }
    for (const z of [-2.2, 0, 2.2]) {
      add(this.left, "Wall_Plaster_Straight", -3.3, 0.06, z, 1.1, -Math.PI / 2);
      add(this.right, "Wall_Plaster_Straight", 3.3, 0.06, z, 1.1, Math.PI / 2);
    }
    const corners = new T.Group();
    const joins = new T.BoxGeometry(0.3, 3.5, 0.3);
    this.buffers.push(joins);
    for (const x of [-3.3, 3.3])
      for (const z of [-3.3, 3.3]) {
        const post = new T.Mesh(joins, this.joinMaterial);
        post.position.set(x, 1.8, z);
        corners.add(post);
      }
    add(this.roof, "Roof_RoundTiles_4x6", 0, 3.28, 0, [1.38, 0.5, 0.99]);
    add(this.roof, "Roof_Front_Brick4", 0, 3.37, 3.3, [1.5, 0.69, 1], 0);
    add(this.roof, "Roof_Front_Brick4", 0, 3.37, -3.3, [1.5, 0.69, 1], Math.PI);
    this.hinge.position.set(-0.61, 0.06, 3.3);
    add(this.hinge, "Door_4_Flat", 0.61, 0, 0, 1.1);
    this.hinge.rotation.y = this.angle;
    this.hinge.traverse((o) => {
      o.userData.dynamic = true;
    });
    const prop = (
      id: string,
      x: number,
      z: number,
      scale: number,
      yaw = 0,
      y = 0.06,
      solid = true,
    ) => {
      const o = add(furnishings, id, x, y, z, scale, yaw);
      o.updateMatrixWorld(true);
      if (solid) {
        const b = new T.Box3().setFromObject(o);
        this.furniture.push({
          minX: b.min.x + 128,
          maxX: b.max.x + 128,
          minZ: b.min.z - 42,
          maxZ: b.max.z - 42,
          height: b.max.y,
          name: id,
        });
      }
      return o;
    };
    const table = prop("furniture-table", 1.45, -1.1, 2.5);
    prop("furniture-chair", 1.45, 0.2, 2.2, Math.PI);
    prop("furniture-chair", 1.45, -2.4, 2.2);
    prop("furniture-bookcaseopen", -2.6, -1.6, 2.2, Math.PI / 2);
    prop("furniture-rugrectangle", 0.1, 0.3, 2, 0, 0.065, false);
    prop("furniture-books", 0.6, -1.1, 2, 0, 0.06 + 0.326733977 * 2.5, false);
    for (const group of [
      walls,
      this.left,
      this.right,
      corners,
      front,
      floor,
      furnishings,
      this.roof,
    ]) {
      const merged = bakeNature(group, this.material);
      if (merged) {
        group.clear();
        while (merged.children.length) group.add(merged.children[0]);
        group.traverse((o) => {
          if (o instanceof T.Mesh) {
            this.buffers.push(o.geometry);
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
      }
      this.group.add(group);
    }
    this.group.add(this.hinge);
    this.group.position.set(128, 0, -42);
  }
  inside(p: { x: number; z: number }) {
    return Math.abs(p.x - 128) < 3.35 && Math.abs(p.z + 42) < 3.35;
  }
  doorBody() {
    return lodgeDoorBody(this.changing ? false : this.open, this.direction);
  }
  /** Picking follows the visible cutaway, while walking/placement keep every physical wall. */
  isVisibleOccluder(body: Obstacle) {
    const wall = this.walls.indexOf(body);
    if (wall === 0) return this.left.visible;
    if (wall === 1) return this.right.visible;
    if (wall === 2) return this.back.visible;
    if (wall === 3 || wall === 4) return this.front.visible;
    if (this.roofBodies.includes(body)) return this.roof.visible;
    if (this.cameraBodies.includes(body)) return this.front.visible;
    return true;
  }
  toggle(
    player: { x: number; z: number },
    built: readonly Obstacle[],
  ): string | null {
    if (this.changing) return "Give the door a moment";
    const direction = this.open
      ? this.direction
      : player.z > LODGE.z + LODGE.half
        ? 1
        : -1;
    const sweep = body(
      -0.95,
      0.8,
      direction > 0 ? 1.7 : 3.0,
      direction > 0 ? 3.42 : 4.9,
      2.4,
    );
    const p = sweep;
    if (
      player.x > p.minX - 0.3 &&
      player.x < p.maxX + 0.3 &&
      player.z > p.minZ - 0.3 &&
      player.z < p.maxZ + 0.3
    )
      return "Step away from the doorway to move the door";
    if (
      built.some(
        (o) =>
          o.minX < p.maxX &&
          o.maxX > p.minX &&
          o.minZ < p.maxZ &&
          o.maxZ > p.minZ,
      )
    )
      return "Move the object beside the door first";
    if (!this.open) this.direction = direction;
    this.open = !this.open;
    this.target = this.open ? (this.direction * Math.PI) / 2 : 0;
    this.changing = true;
    return null;
  }
  setCutaway(player: { x: number; z: number }, yaw = 0) {
    const inside = this.inside(player),
      sin = Math.sin(yaw),
      cos = Math.cos(yaw);
    this.roof.visible = !inside;
    this.front.visible = !inside || cos <= 0.15;
    this.back.visible = !inside || cos >= -0.15;
    this.left.visible = !inside || sin >= -0.15;
    this.right.visible = !inside || sin <= 0.15;
  }
  update(dt: number, player: { x: number; z: number }) {
    this.setCutaway(player);
    if (!this.changing) return false;
    this.angle = T.MathUtils.damp(this.angle, this.target, 14, dt);
    this.hinge.rotation.y = this.angle;
    if (Math.abs(this.angle - this.target) < 0.005) {
      this.angle = this.target;
      this.hinge.rotation.y = this.angle;
      this.changing = false;
      return true;
    }
    return false;
  }
  dispose() {
    for (const b of this.buffers) b.dispose();
    this.material.dispose();
    this.joinMaterial.dispose();
    this.group.removeFromParent();
  }
}
