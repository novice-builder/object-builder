import * as T from "three";
import type { AssetLibrary } from "./assets";
import { MeshShape, CollisionSpace } from "./mesh-collision";
import type { OwnedObstacle } from "./collision-cache";

export function meshBuilding(asset: string | undefined): boolean {
  return (
    !!asset?.startsWith("building_") && !asset.startsWith("building_bridge")
  );
}
/** Actual architecture is shared by instances; old editor/map footprints remain separate. */
export class OutdoorCollision {
  private shapes = new Map<string, MeshShape>();
  constructor(private library: AssetLibrary) {}
  create(
    group: T.Group,
    built: ReadonlyMap<string, T.Object3D>,
    bodies: readonly OwnedObstacle[],
    ground: (x: number, z: number) => number,
    valid: (x: number, z: number) => boolean,
    moving: string | null,
  ) {
    const space = new CollisionSpace(ground, valid);
    group.updateWorldMatrix(true, true);
    const add = (root: T.Object3D) => {
      const id: string = root.userData.asset;
      if (!meshBuilding(id)) return;
      const key = root.userData.stepKey || id;
      let shape = this.shapes.get(key);
      if (!shape) {
        const source = this.library.create(id, root.scale.x);
        source.scale.setScalar(1);
        shape = new MeshShape(source);
        this.shapes.set(key, shape);
      }
      root.updateWorldMatrix(true, false);
      space.add(shape, root.matrixWorld, true, id);
    };
    group.traverse((root) => {
      if (root.userData.movementSolid) add(root);
    });
    for (const [id, root] of built) if (id !== moving) add(root);
    space.boxes = bodies
      .filter((b) => !meshBuilding(b.name))
      .map((b) => ({
        minX: b.minX,
        maxX: b.maxX,
        minZ: b.minZ,
        maxZ: b.maxZ,
        minY: b.base ?? 0,
        maxY: b.height,
        canStep: false,
        source: b.name,
      }));
    return space;
  }
}
