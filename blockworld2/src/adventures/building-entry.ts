import * as T from "three";
import type { AssetLibrary } from "./assets";
export type RoomKind = "cottage" | "townhouse" | "inn" | "workshop" | "mill";
export interface BuildingEntry {
  id: string;
  name: string;
  kind: RoomKind;
  x: number;
  z: number;
  yaw: number;
  width: number;
  depth: number;
  /** Missing means the saved legacy room: preserve its original upper floor. */
  levels?: 1 | 2;
  /** Version-4 fresh tower room. Missing preserves the saved rectangular template. */
  profile?: "compact-windmill";
  threshold?: { x: number; y: number; z: number };
}
export function entryDistance(
  entry: BuildingEntry,
  point: { x: number; z: number },
) {
  const a = Math.hypot(entry.x - point.x, entry.z - point.z),
    t = entry.threshold;
  return t ? Math.min(a, Math.hypot(t.x - point.x, t.z - point.z)) : a;
}
export function buildingKind(asset: string): RoomKind | null {
  if (asset.startsWith("building_home_A")) return "cottage";
  if (asset.startsWith("building_home_B")) return "townhouse";
  if (asset.startsWith("building_tavern")) return "inn";
  if (asset.startsWith("building_blacksmith")) return "workshop";
  if (asset.startsWith("building_watermill")) return "mill";
  return null;
}
/** Grounded models face +Z, like the existing driveway authoring. IDs do not depend on array order. */
export function buildingEntry(
  library: AssetLibrary,
  asset: string,
  root: T.Object3D,
  id?: string,
  options: { windmill?: boolean } = {},
): BuildingEntry | null {
  const windmill = options.windmill && asset === "building_windmill_blue",
    kind = buildingKind(asset) || (windmill ? "mill" : null),
    box = library.bounds.get(asset);
  if (!kind || !box) return null;
  const x = root.position.x,
    z = root.position.z,
    yaw = root.rotation.y,
    face = box.max.z * root.scale.z + 1.05;
  root.updateMatrixWorld(true);
  const world = new T.Box3().setFromObject(root),
    dx = Math.sin(yaw),
    dz = Math.cos(yaw),
    tx =
      Math.abs(dx) > 0.001
        ? ((dx > 0 ? world.max.x - x : x - world.min.x) - 0.45) / Math.abs(dx)
        : Infinity,
    tz =
      Math.abs(dz) > 0.001
        ? ((dz > 0 ? world.max.z - z : z - world.min.z) - 0.45) / Math.abs(dz)
        : Infinity,
    front = Math.max(face, Math.min(tx, tz) + 0.85),
    lateral = root.userData.entryLateral || 0,
    threshold = root.userData.entryThreshold
      ? root.localToWorld(
          new T.Vector3().fromArray(root.userData.entryThreshold),
        )
      : null;
  return {
    id: id || `${asset}:${x.toFixed(3)}:${z.toFixed(3)}:${yaw.toFixed(3)}`,
    name: windmill
      ? "Windmill"
      : {
          cottage: "Cottage",
          townhouse: "Town house",
          inn: "Village inn",
          workshop: "Smith's workshop",
          mill: "The millhouse",
        }[kind],
    kind,
    levels: kind === "cottage" || kind === "workshop" ? 1 : 2,
    x: x + Math.sin(yaw) * front + Math.cos(yaw) * lateral,
    z: z + Math.cos(yaw) * front - Math.sin(yaw) * lateral,
    yaw,
    width: windmill
      ? Math.max(5.8, Math.min(6.8, (box.max.z - box.min.z) * root.scale.z))
      : Math.max(5.8, Math.min(10, (box.max.x - box.min.x) * root.scale.x)),
    depth: Math.max(6.8, Math.min(12, (box.max.z - box.min.z) * root.scale.z)),
    ...(threshold
      ? { threshold: { x: threshold.x, y: threshold.y, z: threshold.z } }
      : {}),
  };
}
