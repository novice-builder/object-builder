import type { BuildingEntry } from "./building-entry";
import type { Placement } from "./landscape";
import { UPPER_FLOOR } from "./interior-physics";

/** Fresh full-sized inns only. Stored room contents always take precedence. */
export function innFurniture(entry: BuildingEntry): Placement[] | null {
  if (
    entry.kind !== "inn" ||
    entry.levels !== 2 ||
    entry.width < 8 ||
    entry.depth < 9
  )
    return null;
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
    y = 0,
  ) => objects.push({ id, asset, x, z, scale, yaw, y });
  // Keep the centre aisle and right-hand real stair/landings clear. Dining
  // groups face one another across the tables, rather than lining the walls.
  for (const [name, z] of [
    ["rear", -d + 3],
    ["front", d - 3],
  ] as const) {
    add(`${name}-table`, "furniture-table", -w + 1.9, z, 2.3);
    add(`${name}-north-seat`, "furniture-chair", -w + 1.9, z - 1, 2, 0);
    add(`${name}-south-seat`, "furniture-chair", -w + 1.9, z + 1, 2, Math.PI);
  }
  add("serving-table", "furniture-table", -0.1, -d + 1.1, 2.6);
  add("provisions", "barrel", 1.55, -d + 1.1, 3.4);
  add("common-room-shelf", "furniture-bookcaseopen", -w + 0.6, -d + 0.7, 2.2);
  add("welcome-rug", "furniture-rugrectangle", 0, d - 2.1, 2.4);
  add("bed", "furniture-bedsingle", -w + 1.1, -d + 1.8, 1.85, 0, UPPER_FLOOR);
  add(
    "guest-bed",
    "furniture-bedsingle",
    -w + 3.3,
    -d + 1.8,
    1.85,
    0,
    UPPER_FLOOR,
  );
  add(
    "bedside",
    "furniture-cabinetbed",
    -w + 2.2,
    -d + 0.65,
    2.2,
    0,
    UPPER_FLOOR,
  );
  add(
    "upstairs-shelf",
    "furniture-bookcaseopen",
    -w + 0.6,
    d - 0.7,
    2.2,
    0,
    UPPER_FLOOR,
  );
  return objects;
}
