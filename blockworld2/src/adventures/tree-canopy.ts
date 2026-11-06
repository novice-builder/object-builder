import * as T from "three";
import type { Obstacle } from "./landscape";

/** GLB primitives can share the whole position accessor. Bounds must use their referenced triangles. */
export function treeCanopyBounds(source: T.Object3D): T.Box3[] {
  const result: T.Box3[] = [],
    point = new T.Vector3();
  source.updateMatrixWorld(true);
  source.traverse((object) => {
    if (!(object instanceof T.Mesh)) return;
    const geometry = object.geometry,
      positions = geometry.getAttribute("position"),
      index = geometry.index,
      materials = Array.isArray(object.material)
        ? object.material
        : [object.material],
      groups = Array.isArray(object.material)
        ? geometry.groups
        : [
            {
              start: 0,
              count: index?.count ?? positions.count,
              materialIndex: 0,
            },
          ];
    for (const group of groups) {
      if (
        !/(leaf|leaves|foliage)/i.test(
          materials[group.materialIndex ?? 0]?.name || "",
        )
      )
        continue;
      const bounds = new T.Box3();
      for (let i = group.start; i < group.start + group.count; i++) {
        point
          .fromBufferAttribute(positions, index ? index.getX(i) : i)
          .applyMatrix4(object.matrixWorld);
        bounds.expandByPoint(point);
      }
      if (!bounds.isEmpty()) result.push(bounds);
    }
  });
  return result;
}

/** Camera-only solids; never add these volumes to walking or placement collision. */
export function canopyBodies(
  bounds: readonly T.Box3[],
  matrix: T.Matrix4,
): Obstacle[] {
  return bounds.map((source) => {
    const box = source.clone().applyMatrix4(matrix);
    return {
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
      base: box.min.y,
      height: box.max.y,
      name: "tree-canopy",
    };
  });
}
