import { ITEMS, blockColliders, blockBounds } from "./registry";
import { overlaps, bodyBox } from "../player/physics.js";
import type { Block } from "./commands";
import { SpatialIndex } from "../legacy06/spatial.js";
// Horizontal cell anchors stay predictable; vertical anchors follow real slab
// and furniture surfaces. Hundredth-metre precision avoids drift in save keys.
const validAnchor = (b: Block) =>
  Number.isInteger(b.x) &&
  Number.isInteger(b.z) &&
  Number.isFinite(b.y) &&
  Math.abs(b.y * 100 - Math.round(b.y * 100)) < 1e-7;
export function validateBlocks(blocks: Block[]) {
  if (!Array.isArray(blocks) || blocks.length > 12000)
    throw Error("Unsupported build capacity");
  const seen = new Set<string>(),
    index = new SpatialIndex(4);
  for (const b of blocks) {
    if (
      !b ||
      !ITEMS.has(b.type) ||
      !validAnchor(b) ||
      b.x < -250 ||
      b.x >= 250 ||
      b.z < -250 ||
      b.z >= 250 ||
      b.y < 0 ||
      b.y >= 24 ||
      (b.rotation !== undefined && !Number.isFinite(b.rotation)) ||
      Math.abs(b.rotation || 0) > 36000 ||
      (b.open !== undefined && typeof b.open !== "boolean") ||
      (b.on !== undefined && typeof b.on !== "boolean")
    )
      throw Error("Invalid catalogue object");
    const k = `${b.x},${b.y},${b.z}`;
    if (seen.has(k)) throw Error("Duplicate build anchor");
    seen.add(k);
    const bounds = blockBounds(b);
    if (bounds.maxY > 24.001) throw Error("Object exceeds build ceiling");
    for (const shape of blockColliders(b)) {
      if (index.query(shape).some((s) => overlaps(shape, s)))
        throw Error("Saved objects overlap");
    }
    for (const shape of blockColliders(b)) index.add(shape);
  }
}
export function reason(
  b: Block,
  blocks: Block[],
  obstacles: any[],
  player: any,
  reach = true,
) {
  if (!b || !ITEMS.has(b.type)) return "Choose a building piece";
  if (
    !validAnchor(b) ||
    b.x < -250 ||
    b.x >= 250 ||
    b.z < -250 ||
    b.z >= 250 ||
    b.y < 0 ||
    b.y >= 24
  )
    return "Build inside the world";
  if (blocks.length >= 12000) return "World geometry capacity reached";
  const bounds = blockBounds(b);
  if (bounds.maxY > 24.001) return "That is above the build ceiling";
  if (
    reach &&
    Math.hypot(
      b.x + 0.5 - player.x,
      b.y + 0.5 - player.y,
      b.z + 0.5 - player.z,
    ) > 6
  )
    return "Move a little closer";
  if (blocks.some((x) => x.x === b.x && x.y === b.y && x.z === b.z))
    return "Find a clear space";
  const shapes = blockColliders(b),
    others = [...obstacles, ...blocks.flatMap(blockColliders)];
  if (shapes.some((shape) => overlaps(shape, bodyBox(player))))
    return "Take a little step back";
  if (
    shapes.some((shape) =>
      others.some((s) => overlaps(shape, s.ramp ? { ...s, ramp: null } : s)),
    )
  )
    return "Find a clear space";
  if (
    b.y > 0 &&
    !blocks.some(
      (s) =>
        Math.abs(s.x - b.x) + Math.abs(s.y - b.y) + Math.abs(s.z - b.z) <= 1,
    ) &&
    !others.some(
      (s) =>
        Math.abs(s.maxY - b.y) < 0.02 &&
        s.minX < bounds.maxX &&
        s.maxX > bounds.minX &&
        s.minZ < bounds.maxZ &&
        s.maxZ > bounds.minZ,
    )
  )
    return "Join this piece to a surface";
  return "";
}
