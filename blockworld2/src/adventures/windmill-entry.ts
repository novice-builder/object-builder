import { COMPACT_MILL_SIZE } from "./compact-mill";
import * as T from "three";
import type { AssetLibrary } from "./assets";
import { buildingEntry } from "./building-entry";
/** Opt-in room for an existing nested model; source mesh and placement stay untouched. */
export function windmillEntry(
  library: AssetLibrary,
  root: T.Object3D,
  name = "Windmill",
  compact = false,
) {
  if (root.userData.asset !== "building_windmill_blue") return null;
  root.updateWorldMatrix(true, false);
  const proxy = root.clone(true);
  root.matrixWorld.decompose(proxy.position, proxy.quaternion, proxy.scale);
  // Euler decomposition can express a half-turn as X/Z rotations; entrances need yaw.
  const forward = new T.Vector3(0, 0, 1).transformDirection(root.matrixWorld);
  proxy.rotation.set(0, Math.atan2(forward.x, forward.z), 0);
  const entry = buildingEntry(
    library,
    "building_windmill_blue",
    proxy,
    undefined,
    { windmill: true },
  );
  if (entry) {
    entry.name = name;
    if (compact) {
      entry.profile = "compact-windmill";
      entry.width = COMPACT_MILL_SIZE;
      entry.depth = COMPACT_MILL_SIZE;
    }
  }
  return entry;
}
