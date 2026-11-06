import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Placement } from "./landscape";
import * as T from "three";
import type { RoomSolid } from "./interior-physics";
export const COMPACT_MILL_SIZE = 5.2;
const chamfer = 0.65;
export function compactMillOutline(
  width = COMPACT_MILL_SIZE,
  depth = COMPACT_MILL_SIZE,
) {
  const w = width / 2,
    d = depth / 2;
  return [
    [-w + chamfer, -d],
    [w - chamfer, -d],
    [w, -d + chamfer],
    [w, d - chamfer],
    [w - chamfer, d],
    [-w + chamfer, d],
    [-w, d - chamfer],
    [-w, -d + chamfer],
  ];
}
export function compactMillContains(
  x: number,
  z: number,
  margin = 0,
  width = COMPACT_MILL_SIZE,
  depth = COMPACT_MILL_SIZE,
) {
  return (
    Math.abs(x) <= width / 2 - margin &&
    Math.abs(z) <= depth / 2 - margin &&
    Math.abs(x) + Math.abs(z) <=
      (width + depth) / 2 - chamfer - margin * Math.SQRT2
  );
}
/** Editor/navigation metadata only. Active movement collides with the rendered structure. */
export function compactMillSolids(): RoomSolid[] {
  const solid = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    minY: number,
    maxY: number,
  ): RoomSolid => ({ minX, maxX, minZ, maxZ, minY, maxY });
  return [
    {
      ...solid(0.9, 2, -0.55, 1.65, 0, 1.5),
      ramp: {
        cx: 1.45,
        cz: 0.55,
        c: 1,
        s: 0,
        width: 1.1,
        length: 2.2,
        rise: 1.5,
        baseY: 0,
      },
    },
    {
      ...solid(-0.6, 0.5, -0.55, 1.65, 1.5, 3),
      ramp: {
        cx: -0.05,
        cz: 0.55,
        c: -1,
        s: 0,
        width: 1.1,
        length: 2.2,
        rise: 1.5,
        baseY: 1.5,
      },
    },
    solid(-0.65, 2.15, -1.85, -0.55, 1.3, 1.5),
    solid(-2.6, -0.65, -2.6, 2.6, 2.8, 3),
    solid(-0.65, 2.6, 1.65, 2.6, 2.8, 3),
    solid(-0.65, 2.6, -2.6, -1.85, 2.8, 3),
    solid(-0.69, -0.61, -1.85, 1.65, 3, 3.85),
    solid(-0.65, 2.15, -1.89, -1.81, 3, 3.85),
    solid(0.6, 2.15, 1.61, 1.69, 3, 3.85),
  ];
}
interface Builder {
  group: T.Group;
  upper: T.Group;
  geometry: T.BufferGeometry[];
  walls: { group: T.Group; side: string; normal?: { x: number; z: number } }[];
  wood: T.MeshStandardMaterial;
  rail: T.MeshStandardMaterial;
  box(
    parent: T.Group,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    mat?: T.MeshStandardMaterial,
  ): T.Mesh;
  fit(
    parent: T.Group,
    id: string,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    yaw?: number,
  ): T.Object3D;
}
/** Two ordinary flights turn on a real 1.5m landing; the upper-floor opening clears the player's head. */
export function buildCompactMill(b: Builder) {
  const boxes: T.Mesh[] = [];
  const box = (...args: Parameters<Builder["box"]>) => {
    const mesh = b.box(...args);
    boxes.push(mesh);
    return mesh;
  };
  const outline = compactMillOutline();
  const floor = (
    y: number,
    thickness: number,
    hole = false,
    parent = b.group,
  ) => {
    const shape = new T.Shape(outline.map(([x, z]) => new T.Vector2(x, -z)));
    if (hole)
      shape.holes.push(
        new T.Path(
          [
            [-0.65, -1.85],
            [2.15, -1.85],
            [2.15, 1.65],
            [-0.65, 1.65],
          ].map(([x, z]) => new T.Vector2(x, -z)),
        ),
      );
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
      steps: 1,
      curveSegments: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    b.geometry.push(geometry);
    const mesh = new T.Mesh(geometry, b.wood);
    mesh.position.y = y;
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  floor(-0.13, 0.13);
  b.group.add(b.upper);
  floor(2.8, 0.2, true, b.upper);
  floor(6, 0.13).visible = false;
  box(b.group, 0.75, 1.4, -1.2, 2.8, 0.2, 1.3);
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      end = outline[(i + 1) % outline.length],
      dx = end[0] - a[0],
      dz = end[1] - a[1],
      length = Math.hypot(dx, dz),
      yaw = Math.atan2(-dz, dx),
      cx = (a[0] + end[0]) / 2,
      cz = (a[1] + end[1]) / 2;
    const wall = new T.Group();
    b.group.add(wall);
    b.walls.push({
      group: wall,
      side: "compact-" + i,
      normal: { x: dz / length, z: -dx / length },
    });
    for (let level = 0; level < 2; level++) {
      const front = Math.abs(cz - COMPACT_MILL_SIZE / 2) < 0.001 && level === 0;
      const widths = front
        ? [(length - 1.8) / 2, 1.8, (length - 1.8) / 2]
        : Array.from(
            { length: Math.ceil(length / 2.2) },
            () => length / Math.ceil(length / 2.2),
          );
      let along = -length / 2;
      for (const [index, width] of widths.entries()) {
        const at = along + width / 2;
        along += width;
        b.fit(
          wall,
          front && index === 1
            ? "Wall_Plaster_Door_Flat"
            : "Wall_Plaster_Straight",
          cx + (dx / length) * at,
          level * 3,
          cz + (dz / length) * at,
          width,
          3,
          0.18,
          yaw,
        );
      }
    }
  }
  b.fit(
    b.walls.find((w) => w.normal && w.normal.z > 0.99)?.group || b.group,
    "Door_4_Flat",
    0,
    0,
    COMPACT_MILL_SIZE / 2 - 0.09,
    1.1,
    2.1,
    0.12,
    Math.PI,
  );
  for (const s of compactMillSolids().filter((s) => s.ramp)) {
    const r = s.ramp!,
      steps = 10,
      yaw = Math.atan2(r.s, r.c);
    for (let i = 0; i < steps; i++) {
      const along = r.length / 2 - ((i + 0.5) * r.length) / steps,
        y = r.baseY + ((i + 1) * r.rise) / steps;
      const tread = box(
        b.group,
        r.cx + r.s * along,
        y - 0.075,
        r.cz + r.c * along,
        r.width,
        0.15,
        r.length / steps + 0.015,
      );
      tread.rotation.y = yaw;
    }
    for (const side of [-r.width / 2 - 0.06, r.width / 2 + 0.06]) {
      for (let i = 0; i <= steps; i += 2) {
        const t = i / steps,
          along = r.length / 2 - t * r.length;
        box(
          b.group,
          r.cx + r.c * side + r.s * along,
          r.baseY + t * r.rise + 0.43,
          r.cz - r.s * side + r.c * along,
          0.065,
          0.86,
          0.065,
          b.rail,
        );
      }
      const beam = box(
        b.group,
        r.cx + r.c * side,
        r.baseY + r.rise / 2 + 0.86,
        r.cz - r.s * side,
        0.085,
        0.085,
        Math.hypot(r.length, r.rise),
        b.rail,
      );
      beam.quaternion.setFromEuler(
        new T.Euler(Math.atan2(r.rise, r.length), 0, 0),
      );
      beam.quaternion.premultiply(
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), yaw),
      );
    }
  }
  const guard = (
    parent: T.Group,
    x1: number,
    z1: number,
    x2: number,
    z2: number,
    y: number,
  ) => {
    const dx = x2 - x1,
      dz = z2 - z1,
      length = Math.hypot(dx, dz),
      beam = box(
        parent,
        (x1 + x2) / 2,
        y + 0.8,
        (z1 + z2) / 2,
        length,
        0.09,
        0.08,
        b.rail,
      );
    beam.rotation.y = Math.atan2(-dz, dx);
    const n = Math.ceil(length / 0.5);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      box(parent, x1 + t * dx, y + 0.42, z1 + t * dz, 0.06, 0.84, 0.06, b.rail);
    }
  };
  guard(b.upper, -0.65, -1.85, -0.65, 1.65, 3);
  guard(b.upper, -0.65, -1.85, 2.15, -1.85, 3);
  guard(b.upper, 0.6, 1.65, 2.15, 1.65, 3);
  guard(b.group, -0.65, -1.85, 2.15, -1.85, 1.5);
  guard(b.group, -0.65, -1.85, -0.65, -0.55, 1.5);
  batchJoinery(boxes, b.geometry);
}

export function compactMillFurniture(): Placement[] {
  return [
    {
      id: "worktable",
      asset: "furniture-table",
      x: -1.85,
      z: -0.35,
      y: 0,
      yaw: Math.PI / 2,
      scale: 2.2,
    },
    {
      id: "seat",
      asset: "furniture-chair",
      x: -1.85,
      z: 1.15,
      y: 0,
      yaw: Math.PI,
      scale: 1.9,
    },
    {
      id: "tool-shelf",
      asset: "furniture-bookcaseopen",
      x: -1.85,
      z: -1.85,
      y: 0,
      yaw: 0,
      scale: 1.7,
    },
    {
      id: "grain",
      asset: "crate_A_small",
      x: -1.8,
      z: -0.6,
      y: 3,
      yaw: 0,
      scale: 3.2,
    },
    {
      id: "grain-barrel",
      asset: "barrel",
      x: -1.8,
      z: -1.8,
      y: 3,
      yaw: 0,
      scale: 3,
    },
    {
      id: "mill-shelf",
      asset: "furniture-bookcaseopen",
      x: -1.8,
      z: 0.8,
      y: 3,
      yaw: 0,
      scale: 1.7,
    },
  ];
}

/** Room-local, static joinery only; borrowed GLBs and upper-floor visibility groups stay separate. */
function batchJoinery(meshes: T.Mesh[], owned: T.BufferGeometry[]) {
  const groups = new Map<T.Object3D, Map<T.Mesh["material"], T.Mesh[]>>();
  for (const mesh of meshes) {
    const parent = mesh.parent!;
    let materials = groups.get(parent);
    if (!materials) groups.set(parent, (materials = new Map()));
    let list = materials.get(mesh.material);
    if (!list) materials.set(mesh.material, (list = []));
    list.push(mesh);
  }
  for (const [parent, materials] of groups)
    for (const [material, list] of materials) {
      const parts = list.map((mesh) => {
        mesh.updateMatrix();
        return mesh.geometry.clone().applyMatrix4(mesh.matrix);
      });
      const geometry = mergeGeometries(parts, false);
      for (const part of parts) part.dispose();
      if (!geometry) throw Error("Compact joinery attributes do not match");
      const batch = new T.Mesh(geometry, material);
      batch.castShadow = list.some((m) => m.castShadow);
      batch.receiveShadow = list.some((m) => m.receiveShadow);
      batch.userData.interiorJoinery = true;
      parent.add(batch);
      for (const mesh of list) mesh.removeFromParent();
      owned.push(geometry);
    }
}
