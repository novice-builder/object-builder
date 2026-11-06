import { innFurniture } from "./inn-furniture";
import {
  compactMillFurniture,
  compactMillSolids,
  compactMillContains,
  buildCompactMill,
  batchJoinery,
} from "./compact-mill";
import * as T from "three";
import type { AssetLibrary } from "./assets";
import type { BuildingEntry } from "./building-entry";
import type { Placement, Obstacle } from "./landscape";
import { roomStructure, UPPER_FLOOR, type RoomSolid } from "./interior-physics";
import { CollisionSpace, MeshShape, BODY_RADIUS } from "./mesh-collision";
export interface RoomState {
  entry: BuildingEntry;
  objects: Placement[];
}
export function freshRoom(
  entry: BuildingEntry,
  library?: Pick<AssetLibrary, "bounds">,
): RoomState {
  const w = entry.width / 2,
    d = entry.depth / 2,
    objects: Placement[] = [],
    add = (
      id: string,
      asset: string,
      x: number,
      z: number,
      y = 0,
      yaw = 0,
      scale = 2.2,
    ) => objects.push({ id, asset, x, z, y, yaw, scale });
  const inn = innFurniture(entry);
  if (entry.profile === "compact-windmill")
    objects.push(...compactMillFurniture());
  else if (inn) objects.push(...inn);
  else {
    add("table", "furniture-table", -w + 1.7, -d + 2.1, 0, 0, 2.5);
    add("seat", "furniture-chair", -w + 1.7, -d + 3.25, 0, Math.PI);
    add("shelf", "furniture-bookcaseopen", -w + 0.55, -d + 0.6);
    add("rug", "furniture-rugrectangle", -1, 0, 0, 0, 2);
    if (
      entry.kind === "cottage" ||
      entry.kind === "townhouse" ||
      entry.kind === "inn"
    ) {
      const floor = entry.levels === 1 ? 0 : UPPER_FLOOR;
      add(
        floor ? "upstairs-shelf" : "corner-shelf",
        "furniture-bookcaseopen",
        -w + 0.55,
        d - 0.7,
        floor,
      );
      add(
        "bed",
        "furniture-bedsingle",
        floor ? -w + 1.1 : w - 1.05,
        -d + 1.8,
        floor,
        0,
        1.85,
      );
      add(
        "bedside",
        "furniture-cabinetbed",
        floor ? -w + 2.3 : w - 2.3,
        -d + 0.6,
        floor,
      );
      if (entry.kind === "inn")
        add(
          "guest-bed",
          "furniture-bedsingle",
          -w + 3.3,
          -d + 1.8,
          UPPER_FLOOR,
          0,
          1.85,
        );
    } else if (entry.kind === "mill") {
      add("grain", "crate_A_small", -w + 1, -d + 1, UPPER_FLOOR, 0, 4);
      add("grain-barrel", "barrel", -w + 1, d - 1, UPPER_FLOOR, 0, 4);
      add("mill-shelf", "furniture-bookcaseopen", -w + 0.55, 0, UPPER_FLOOR);
    } else add("supplies", "crate_A_small", w - 1, -d + 1, 0, 0, 4);
  }
  if (entry.levels !== undefined && library)
    for (const p of objects) {
      const bounds = library.bounds.get(p.asset);
      if (!bounds) throw Error(`Missing furnishing bounds: ${p.asset}`);
      const matrix = new T.Matrix4().compose(
          new T.Vector3(),
          new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), p.yaw),
          new T.Vector3().setScalar(p.scale),
        ),
        box = bounds.clone().applyMatrix4(matrix),
        margin = 0.26;
      p.x = T.MathUtils.clamp(
        p.x,
        -w + margin - box.min.x,
        w - margin - box.max.x,
      );
      p.z = T.MathUtils.clamp(
        p.z,
        -d + margin - box.min.z,
        d - margin - box.max.z,
      );
    }
  return { entry: structuredClone(entry), objects };
}
/** Separate local-coordinate room. Shared licensed models remain library-owned; only room joinery is disposed. */
export class Interior {
  private shape?: MeshShape;
  group = new T.Group();
  walls: { group: T.Group; side: string; normal?: { x: number; z: number } }[] =
    [];
  upper = new T.Group();
  solids: RoomSolid[];
  obstacles: Obstacle[];
  private geometry: T.BufferGeometry[] = [];
  private materials: T.Material[] = [];
  readonly upstairs: boolean;
  constructor(
    readonly library: AssetLibrary,
    readonly entry: BuildingEntry,
  ) {
    const w = entry.width / 2,
      d = entry.depth / 2;
    this.upstairs = entry.kind !== "workshop" && entry.levels !== 1;
    this.solids =
      entry.profile === "compact-windmill"
        ? compactMillSolids()
        : roomStructure(entry.width, entry.depth, this.upstairs);
    this.obstacles = this.solids
      .filter((s) => !s.ramp && s.maxY > (this.upstairs ? 3 : 0))
      .map((s) => ({ ...s, base: s.minY, height: s.maxY, name: "room-wall" }));
    const wood = new T.MeshStandardMaterial({ color: 0x896547, roughness: 1 }),
      rail = new T.MeshStandardMaterial({ color: 0x554235, roughness: 1 });
    this.materials.push(wood, rail);
    const boxes: T.Mesh[] = [];
    const unitBox = new T.BoxGeometry(1, 1, 1);
    this.geometry.push(unitBox);
    const box = (
      parent: T.Group,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      mat = wood,
    ) => {
      const m = new T.Mesh(unitBox, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(x, y, z);
      m.receiveShadow = true;
      m.castShadow = true;
      parent.add(m);
      boxes.push(m);
      return m;
    };
    // Reuse the existing CC0 plaster wall and floor modules, fitted to the exterior footprint.
    const fit = (
      parent: T.Group,
      id: string,
      x: number,
      y: number,
      z: number,
      sx: number,
      sy: number,
      sz: number,
      yaw = 0,
    ) => {
      const o = library.create(id, 1),
        b = library.bounds.get(id)!;
      o.scale.set(
        sx / (b.max.x - b.min.x),
        sy / (b.max.y - b.min.y),
        sz / (b.max.z - b.min.z),
      );
      o.position.set(x, y, z);
      o.rotation.y = yaw;
      parent.add(o);
      return o;
    };
    if (entry.profile === "compact-windmill") {
      buildCompactMill({
        group: this.group,
        upper: this.upper,
        walls: this.walls,
        geometry: this.geometry,
        wood,
        rail,
        box,
        fit,
      });
      return;
    }
    fit(
      this.group,
      "Floor_WoodDark",
      0,
      -0.13,
      0,
      entry.width,
      0.13,
      entry.depth,
    );
    for (const [side, x, z, yaw, length] of [
      ["back", 0, -d, 0, entry.width],
      ["front", 0, d, Math.PI, entry.width],
      ["left", -w, 0, Math.PI / 2, entry.depth],
      ["right", w, 0, -Math.PI / 2, entry.depth],
    ] as const) {
      const g = new T.Group();
      this.walls.push({ group: g, side });
      this.group.add(g);
      const count = Math.ceil(length / 2.2),
        segment = length / count;
      for (let i = 0; i < count; i++)
        for (let floor = 0; floor < (this.upstairs ? 2 : 1); floor++) {
          const along = -length / 2 + segment * (i + 0.5),
            px = x + Math.cos(yaw) * along,
            pz = z - Math.sin(yaw) * along;
          const door =
            side === "front" && i === Math.floor(count / 2) && floor === 0;
          fit(
            g,
            door ? "Wall_Plaster_Door_Flat" : "Wall_Plaster_Straight",
            px,
            floor * 3,
            pz,
            segment,
            3,
            0.18,
            yaw,
          );
        }
    }
    // Decorative inner exit door corresponds to the exact persisted exterior entrance.
    fit(
      this.walls.find((w) => w.side === "front")!.group,
      "Door_4_Flat",
      0,
      0,
      d - 0.09,
      1.1,
      2.1,
      0.12,
      Math.PI,
    );
    // The roof is cut away for the player view, while its real underside still limits headroom.
    const ceiling = fit(
      this.group,
      "Floor_WoodDark",
      0,
      this.upstairs ? 6 : 3,
      0,
      entry.width,
      0.13,
      entry.depth,
    );
    ceiling.visible = false;
    if (this.upstairs) {
      this.group.add(this.upper);
      for (const s of this.solids.filter((s) => !s.ramp && s.minY === 2.8))
        fit(
          this.upper,
          "Floor_WoodDark",
          (s.minX + s.maxX) / 2,
          2.8,
          (s.minZ + s.maxZ + (s.stairLanding ? 0.18 : 0)) / 2,
          s.maxX - s.minX,
          0.2,
          s.maxZ - s.minZ + (s.stairLanding ? 0.18 : 0),
        );
      const ramp = this.solids.find((s) => s.ramp)!,
        r = ramp.ramp!,
        steps = 20;
      for (let i = 0; i < steps; i++) {
        const z = r.cz + r.length / 2 - ((i + 0.5) * r.length) / steps,
          y = ((i + 1) * 3) / steps;
        box(
          this.group,
          r.cx,
          y - 0.075,
          z,
          r.width,
          0.15,
          r.length / steps + 0.015,
        );
      }
      // Movement uses these actual treads, posts and sloped rails, including the open space below.
      for (const x of [r.cx - 0.86, r.cx + 0.86]) {
        for (let i = 0; i <= steps; i += 2) {
          const t = i / steps,
            z = r.cz + r.length / 2 - t * r.length,
            y = t * 3;
          box(this.group, x, y + 0.43, z, 0.065, 0.86, 0.065, rail);
        }
        const beam = box(
          this.group,
          x,
          2.36,
          r.cz,
          0.085,
          0.085,
          Math.hypot(r.length, 3),
          rail,
        );
        beam.rotation.x = Math.atan2(3, r.length);
      }
      for (const s of this.solids.filter((s) => s.maxY === 3.85)) {
        box(
          this.upper,
          (s.minX + s.maxX) / 2,
          3.8,
          (s.minZ + s.maxZ) / 2,
          s.maxX - s.minX,
          0.09,
          s.maxZ - s.minZ,
          rail,
        );
        for (let z = s.minZ; z < s.maxZ; z += 0.5)
          box(
            this.upper,
            (s.minX + s.maxX) / 2,
            3.42,
            z,
            0.06,
            0.84,
            0.06,
            rail,
          );
      }
    }
    batchJoinery(boxes, this.geometry);
  }
  cutaway(player: { y: number }, yaw: number) {
    let changed = this.upper.visible !== player.y > 1.35;
    this.upper.visible = player.y > 1.35;
    const sx = Math.sin(yaw),
      sz = Math.cos(yaw);
    for (const wall of this.walls) {
      const visible = wall.normal
        ? wall.normal.x * sx + wall.normal.z * sz < -0.15
        : wall.side === "front"
          ? sz < -0.15
          : wall.side === "back"
            ? sz > 0.15
            : wall.side === "left"
              ? sx > 0.15
              : sx < -0.15;
      changed ||= visible !== wall.group.visible;
      wall.group.visible = visible;
    }
    return changed;
  }
  get spawn() {
    return { x: 0, y: 0, z: this.entry.depth / 2 - 1.2 };
  }
  collision() {
    this.shape ??= new MeshShape(this.group);
    const space = new CollisionSpace(
      () => 0,
      (x, z) =>
        this.entry.profile === "compact-windmill"
          ? compactMillContains(x, z, BODY_RADIUS)
          : Math.abs(x) <= this.entry.width / 2 - BODY_RADIUS &&
            Math.abs(z) <= this.entry.depth / 2 - BODY_RADIUS,
    );
    space.add(this.shape, undefined, true, "room structure");
    return space;
  }
  dispose() {
    this.group.removeFromParent();
    for (const g of this.geometry) g.dispose();
    for (const m of this.materials) m.dispose();
  }
}
