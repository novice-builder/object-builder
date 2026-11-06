import type { BuildingEntry } from "./building-entry";
import type { Placement } from "./landscape";
export const HALL_HEIGHT = 4.5;
/** Community seating leaves a broad centre aisle and two side circulation lanes. */
export function hallFurniture(entry: BuildingEntry): Placement[] {
  const w = entry.width / 2,
    d = entry.depth / 2,
    objects: Placement[] = [];
  const add = (
    id: string,
    asset: string,
    x: number,
    z: number,
    scale = 2.2,
    yaw = 0,
  ) => objects.push({ id, asset, x, z, y: 0, scale, yaw });
  for (const [row, z] of [-1.4, 0.1, 1.6].entries())
    for (const [column, x] of [-2.9, -1.6, 1.6, 2.9].entries())
      add(`hall-seat-${row}-${column}`, "furniture-chair", x, z, 2, Math.PI);
  add("reading-table", "furniture-table", 0, -d + 1.3, 2.3);
  add("hall-shelf-left", "furniture-bookcaseopen", -w + 0.6, -d + 0.7);
  add("hall-shelf-right", "furniture-bookcaseopen", w - 0.6, -d + 0.7);
  add("hall-rug", "furniture-rugrectangle", 0, d - 1.8, 2);
  return objects;
}
