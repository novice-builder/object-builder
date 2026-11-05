import { PARTS } from "../legacy06/pieces.js";
import { cellBox } from "../legacy06/core.js";
import type { Block } from "./commands";
import { addRun2Content } from "./run2-content";
export interface Part {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: number;
  shape?: "box" | "wedge";
  yaw?: number;
}
export interface Item {
  id: string;
  label: string;
  category: string;
  icon: string;
  color: number;
  parts: Part[];
  cube?: boolean;
  ramp?: boolean;
  rampLength?: number;
  surface?: string;
  interaction?:
    | "door"
    | "light"
    | "seat"
    | "cabinet"
    | "swing"
    | "seesaw"
    | "bounce"
    | "slide"
    | "rock";
}
export const LEGACY = new Set([
  "wood",
  "brick",
  "stone",
  "glass",
  "flowers",
  "lantern",
  "bench",
]);
const box = (
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: number,
  shape: Part["shape"] = "box",
): Part => ({ x, y, z, w, h, d, color, shape });
const wood = 0xab8059,
  cream = 0xf1e4c8,
  dark = 0x58736e,
  glass = 0x9dc7ce;
export const CATALOGUE: Item[] = [];
function add(
  id: string,
  label: string,
  category: string,
  parts: Part[],
  options: Partial<Item> = {},
) {
  CATALOGUE.push({
    id,
    label,
    category,
    parts,
    icon:
      category === "Garden"
        ? "🌿"
        : category === "Lighting"
          ? "💡"
          : category === "Openings"
            ? "🚪"
            : category === "Furniture"
              ? "🪑"
              : "▦",
    color: parts[0]?.color || wood,
    ...options,
  });
}
for (const [id, label, color] of [
  ["wood", "Wood", 0xbd9567],
  ["brick", "Brick", 0xc78264],
  ["stone", "Stone", 0x9ca9a5],
  ["glass", "Glass", glass],
] as const)
  add(id, label, "Materials", [box(0, 0.5, 0, 1, 1, 1, color)], {
    cube: true,
    icon:
      id === "wood" ? "▥" : id === "brick" ? "▦" : id === "stone" ? "▧" : "◈",
  });
for (const [id, label, icon] of [
  ["flowers", "Flowers", "🌷"],
  ["lantern", "Lantern", "🏮"],
  ["bench", "Bench", "🪑"],
] as const)
  add(
    id,
    label,
    id === "flowers" ? "Garden" : "Furniture",
    (PARTS as any)[id].map(([x, y, z, w, h, d, color]: number[]) =>
      box(x - 0.5, y, z - 0.5, w, h, d, color),
    ),
    { icon },
  );
for (const [id, label, color, surface] of [
  ["oak-planks", "Oak planks", 0xbd9160, "wood"],
  ["bamboo", "Bamboo", 0xc2bf79, "bamboo"],
  ["log-end", "Timber logs", 0xa68254, "log"],
  ["white-brick", "White brick", 0xdbd6bf, "brick"],
  ["cobble", "Cobblestone", 0x929a8e, "cobble"],
  ["sandstone", "Sandstone", 0xdcc495, "stone"],
  ["marble", "Marble", 0xe2ddd0, "marble"],
  ["slate", "Slate", 0x697b80, "stone"],
  ["concrete", "Concrete", 0xb2b1a0, "concrete"],
  ["terracotta", "Terracotta", 0xbd805e, "tile"],
  ["mosaic", "Mosaic tiles", 0x82a99f, "mosaic"],
  ["checker-tile", "Checker tiles", 0xd9d1b3, "checker"],
  ["copper", "Copper panels", 0xb98264, "metal"],
  ["steel", "Steel plate", 0xa9bac0, "metal"],
  ["grass", "Turf", 0x88ad6c, "grass"],
  ["sand", "Sand", 0xe3d39f, "sand"],
] as [string, string, number, string][])
  add(id, label, "Materials", [box(0, 0.5, 0, 1, 1, 1, color)], {
    cube: true,
    surface,
  });
for (const [id, label, w, h, d, shape] of [
  ["slab", "Half slab", 1, 0.5, 1, "box"],
  ["floor-panel", "Floor panel", 1, 0.15, 1, "box"],
  ["wall-panel", "Wall panel", 1, 2, 0.15, "box"],
  ["half-wall", "Half wall", 1, 1, 0.15, "box"],
  ["pillar", "Square pillar", 0.35, 2.5, 0.35, "box"],
  ["beam", "Long beam", 3, 0.25, 0.25, "box"],
  ["post", "Fence post", 0.18, 1.2, 0.18, "box"],
  ["roof-slope", "Roof slope", 1, 1, 1, "wedge"],
  ["roof-slab", "Roof sheet", 2, 0.15, 2, "box"],
  ["ramp", "Walking ramp", 1, 1, 2, "wedge"],
  ["wide-ramp", "Wide ramp", 2, 1, 2, "wedge"],
  ["step", "Low step", 1, 0.25, 0.5, "box"],
  ["foundation", "Foundation plinth", 2, 0.4, 2, "box"],
] as [string, string, number, number, number, "box" | "wedge"][])
  add(
    id,
    label,
    "Shapes",
    [box(0, h / 2, 0, w, h, d, id.includes("roof") ? 0x937b6c : wood, shape)],
    { ramp: shape === "wedge" },
  );
add(
  "stairs",
  "Timber stairs",
  "Shapes",
  Array.from({ length: 4 }, (_, i) =>
    box(0, (i + 1) * 0.125, 0.75 - i * 0.5, 1, (i + 1) * 0.25, 0.5, wood),
  ),
  { ramp: true },
);
add("arch", "Wide arch", "Shapes", [
  box(-0.8, 1, 0, 0.3, 2, 0.4, 0xc0ae8c),
  box(0.8, 1, 0, 0.3, 2, 0.4, 0xc0ae8c),
  box(0, 2, 0, 1.9, 0.35, 0.4, 0xc0ae8c),
]);
add("corner-wall", "Corner wall", "Shapes", [
  box(-0.42, 1, 0, 0.16, 2, 1, cream),
  box(0, 1, -0.42, 1, 2, 0.16, cream),
]);
for (const [id, label, width, height, color] of [
  ["door", "Timber door", 1, 2.2, wood],
  ["glass-door", "Glass door", 1, 2.2, glass],
  ["double-door", "Double-width door", 2, 2.2, wood],
  ["garden-gate", "Garden gate", 1.4, 1.2, 0x9cae86],
] as [string, string, number, number, number][])
  add(
    id,
    label,
    "Openings",
    [
      box(-width / 2, height / 2, 0, 0.1, height, 0.18, dark),
      box(width / 2, height / 2, 0, 0.1, height, 0.18, dark),
      box(0, height, 0, width + 0.1, 0.1, 0.18, dark),
      box(0, height / 2, 0, width - 0.16, height - 0.1, 0.1, color),
    ],
    { interaction: "door" },
  );
for (const [id, label, width, height] of [
  ["window", "Window", 1.2, 1.2],
  ["wide-window", "Wide window", 2, 1.2],
  ["tall-window", "Tall window", 0.8, 2],
  ["skylight", "Skylight", 1.2, 0.35],
] as [string, string, number, number][])
  add(id, label, "Openings", [
    box(0, height / 2, 0, width, height, 0.09, glass),
    box(-width / 2, height / 2, 0, 0.08, height, 0.15, cream),
    box(width / 2, height / 2, 0, 0.08, height, 0.15, cream),
    box(0, height, 0, width + 0.08, 0.08, 0.15, cream),
    box(0, 0.04, 0, width + 0.08, 0.08, 0.15, cream),
    box(0, height / 2, 0, 0.06, height, 0.16, cream),
  ]);
for (const [id, label, color] of [
  ["picket-fence", "Picket fence", cream],
  ["rail-fence", "Timber rail fence", wood],
  ["metal-rail", "Metal railing", dark],
] as [string, string, number][])
  add(id, label, "Openings", [
    ...[-0.48, 0.48].map((x) => box(x, 0.6, 0, 0.1, 1.2, 0.1, color)),
    box(0, 0.9, 0, 1, 0.1, 0.1, color),
    box(0, 0.4, 0, 1, 0.1, 0.1, color),
    ...(id === "picket-fence"
      ? [-0.25, 0, 0.25].map((x) => box(x, 0.55, 0, 0.09, 1.1, 0.1, color))
      : []),
  ]);
const table = (w = 1.5, d = 1, h = 0.75, c = wood) => [
  box(0, h, 0, w, 0.12, d, c),
  ...[-w * 0.38, w * 0.38].flatMap((x) =>
    [-d * 0.35, d * 0.35].map((z) => box(x, h / 2, z, 0.1, h, 0.1, dark)),
  ),
];
const seat = (w = 1, c = 0x97b4a0) => [
  box(0, 0.4, 0, w, 0.25, 0.8, c),
  box(0, 0.8, 0.34, w, 0.6, 0.16, c),
  ...[-w * 0.36, w * 0.36].map((x) => box(x, 0.15, 0, 0.1, 0.3, 0.6, wood)),
];
add("chair", "Dining chair", "Furniture", seat(0.6), { interaction: "seat" });
add(
  "armchair",
  "Armchair",
  "Furniture",
  [
    ...seat(1),
    box(-0.48, 0.55, 0, 0.18, 0.4, 0.8, 0x97b4a0),
    box(0.48, 0.55, 0, 0.18, 0.4, 0.8, 0x97b4a0),
  ],
  { interaction: "seat" },
);
add("sofa", "Two-seat sofa", "Furniture", seat(1.9, 0x8ba7b2), {
  interaction: "seat",
});
add(
  "corner-sofa",
  "Corner sofa",
  "Furniture",
  [...seat(1.8, 0xb3a0b4), box(-0.6, 0.4, -0.7, 0.6, 0.25, 1.2, 0xb3a0b4)],
  { interaction: "seat" },
);
add(
  "stool",
  "Stool",
  "Furniture",
  [
    box(0, 0.55, 0, 0.55, 0.12, 0.55, 0xd5ad75),
    ...[-0.2, 0.2].flatMap((x) =>
      [-0.2, 0.2].map((z) => box(x, 0.25, z, 0.08, 0.5, 0.08, wood)),
    ),
  ],
  { interaction: "seat" },
);
add("dining-table", "Dining table", "Furniture", table(1.8, 1));
add("coffee-table", "Coffee table", "Furniture", table(1.2, 0.7, 0.4));
add("desk", "Writing desk", "Furniture", [
  ...table(1.5, 0.8),
  box(0.5, 0.5, 0, 0.4, 0.5, 0.65, 0xd9c7a1),
]);
for (const [id, label, w, d] of [
  ["single-bed", "Single bed", 0.95, 2],
  ["double-bed", "Double bed", 1.75, 2.1],
] as [string, string, number, number][])
  add(id, label, "Furniture", [
    box(0, 0.25, 0, w, 0.5, d, wood),
    box(0, 0.55, 0, w, 0.15, d, 0xe7bb80),
    box(0, 0.68, -d * 0.33, w * 0.8, 0.18, 0.45, cream),
    box(0, 0.65, -d / 2, w, 0.8, 0.12, wood),
  ]);
add("bunk-bed", "Bunk beds", "Furniture", [
  box(0, 0.5, 0, 1, 0.2, 2, 0xdfbf8b),
  box(0, 1.7, 0, 1, 0.2, 2, 0xdfbf8b),
  ...[-0.47, 0.47].flatMap((x) =>
    [-0.95, 0.95].map((z) => box(x, 1, z, 0.1, 2, 0.1, wood)),
  ),
  ...Array.from({ length: 5 }, (_, i) =>
    box(-0.58, 0.2 + i * 0.33, 0.6, 0.25, 0.08, 0.18, wood),
  ),
]);
add("crib", "Crib", "Furniture", [
  box(0, 0.4, 0, 0.9, 0.15, 1.5, cream),
  ...[-0.45, 0.45].flatMap((x) =>
    [-0.65, -0.3, 0, 0.3, 0.65].map((z) =>
      box(x, 0.75, z, 0.06, 0.8, 0.06, wood),
    ),
  ),
]);
add("wardrobe", "Wardrobe", "Furniture", [
  box(0, 1, 0, 1.2, 2, 0.6, wood),
  box(0, 1, 0.32, 0.04, 1.8, 0.05, cream),
]);
add("dresser", "Dresser", "Furniture", [
  box(0, 0.6, 0, 1.4, 1.2, 0.65, wood),
  ...Array.from({ length: 3 }, (_, i) =>
    box(0, 0.25 + i * 0.35, 0.34, 1.25, 0.04, 0.04, cream),
  ),
]);
add("nightstand", "Nightstand", "Furniture", [
  box(0, 0.3, 0, 0.55, 0.6, 0.5, wood),
  box(0, 0.4, 0.27, 0.1, 0.06, 0.05, dark),
]);
add("bookcase", "Bookcase", "Furniture", [
  box(0, 1, 0, 1.4, 2, 0.35, wood),
  ...Array.from({ length: 6 }, (_, i) =>
    box(
      -0.55 + i * 0.22,
      1.35,
      0.2,
      0.16,
      0.55,
      0.08,
      [0xc98b6f, 0x82a89a, 0xd3bd79][i % 3],
    ),
  ),
]);
add("shelf", "Wall shelf", "Furniture", [
  box(0, 0.2, 0, 1.5, 0.12, 0.35, wood),
  box(-0.55, 0.1, 0.08, 0.1, 0.2, 0.1, dark),
  box(0.55, 0.1, 0.08, 0.1, 0.2, 0.1, dark),
]);
add("tv-cabinet", "TV cabinet", "Furniture", [
  box(0, 0.35, 0, 1.5, 0.7, 0.5, wood),
  box(0, 1, 0.05, 1.2, 0.65, 0.12, dark),
  box(0, 0.95, 0.13, 1.05, 0.5, 0.03, 0xa6c7b9),
]);
add("rug", "Woven rug", "Furniture", [
  box(0, 0.025, 0, 1.8, 0.05, 1.3, 0xc9aa86),
  box(0, 0.055, 0, 1.5, 0.01, 1, 0xe4cc9d),
]);
const cabinet = (c = 0xc4cdb3) => [
  box(0, 0.5, 0, 0.98, 1, 0.6, c),
  box(0, 1.04, 0, 1, 0.08, 0.68, cream),
  box(0, 0.75, 0.32, 0.25, 0.05, 0.06, dark),
];
add("kitchen-counter", "Kitchen counter", "Kitchen", cabinet());
add("sink", "Kitchen sink", "Kitchen", [
  ...cabinet(),
  box(0, 1.09, 0, 0.6, 0.04, 0.4, 0x8ca9a9),
  box(0.28, 1.3, -0.2, 0.06, 0.45, 0.06, dark),
]);
add("stove", "Cooker", "Kitchen", [
  ...cabinet(0xd4d8cc),
  ...[-0.25, 0.25].flatMap((x) =>
    [-0.18, 0.18].map((z) => box(x, 1.1, z, 0.25, 0.02, 0.22, dark)),
  ),
  box(0, 0.55, 0.32, 0.7, 0.45, 0.04, dark),
]);
add("fridge", "Fridge", "Kitchen", [
  box(0, 1, 0, 0.85, 2, 0.8, 0xdce3d3),
  box(0.28, 1, 0.42, 0.06, 0.6, 0.06, dark),
]);
add("oven", "Oven", "Kitchen", [
  ...cabinet(0xb2bcb6),
  box(0, 0.5, 0.32, 0.7, 0.5, 0.05, dark),
]);
add("kitchen-island", "Kitchen island", "Kitchen", [
  box(0, 0.5, 0, 2, 1, 0.8, 0xa5b9ad),
  box(0, 1.05, 0, 2.2, 0.12, 1, cream),
]);
add("wall-cupboard", "Wall cupboard", "Kitchen", [
  box(0, 0.4, 0, 1, 0.8, 0.35, 0xd6ddc4),
  box(0, 0.4, 0.2, 0.04, 0.7, 0.03, dark),
]);
add("bin", "Kitchen bin", "Kitchen", [
  box(0, 0.4, 0, 0.5, 0.8, 0.5, dark),
  box(0, 0.82, 0, 0.55, 0.08, 0.55, 0xb3bcb1),
]);
add("toilet", "Toilet", "Bathroom", [
  box(0, 0.22, 0, 0.4, 0.44, 0.5, cream),
  box(0, 0.48, -0.05, 0.6, 0.15, 0.7, cream),
  box(0, 0.72, -0.3, 0.6, 0.6, 0.18, cream),
]);
add("bath", "Bath", "Bathroom", [
  box(0, 0.25, 0, 0.9, 0.5, 1.8, cream),
  box(0, 0.52, 0, 0.7, 0.03, 1.5, 0x99c5ca),
  box(0.32, 0.7, -0.55, 0.05, 0.35, 0.05, dark),
]);
add("shower", "Shower", "Bathroom", [
  box(0, 0.04, 0, 1, 0.08, 1, cream),
  box(0, 1, -0.46, 0.9, 2, 0.06, glass),
  box(0.44, 1, 0, 0.06, 2, 1, glass),
  box(-0.3, 1.4, -0.4, 0.05, 1, 0.05, dark),
  box(-0.3, 1.95, -0.2, 0.3, 0.07, 0.3, dark),
]);
add("washbasin", "Washbasin", "Bathroom", [
  box(0, 0.5, 0, 0.7, 1, 0.5, 0xbbc9bc),
  box(0, 1.05, 0, 0.8, 0.12, 0.6, cream),
  box(0.2, 1.2, -0.2, 0.05, 0.3, 0.05, dark),
]);
add("mirror", "Mirror", "Bathroom", [
  box(0, 0.65, 0, 0.8, 1.3, 0.1, wood),
  box(0, 0.65, 0.06, 0.68, 1.15, 0.04, glass),
]);
add("towel-rail", "Towel rail", "Bathroom", [
  box(0, 0.6, 0, 0.9, 0.08, 0.08, dark),
  box(0, 0.4, 0.04, 0.6, 0.45, 0.04, 0xd4b4a3),
]);
add("workbench", "Workbench", "Workshop", [
  ...table(2, 0.9, 0.9),
  box(0, 1.4, -0.35, 2, 0.8, 0.1, wood),
]);
add("tool-cabinet", "Tool cabinet", "Workshop", [
  box(0, 0.7, 0, 1.1, 1.4, 0.55, 0x8baaa1),
  ...Array.from({ length: 4 }, (_, i) =>
    box(0, 0.25 + i * 0.3, 0.29, 0.8, 0.04, 0.05, dark),
  ),
]);
add("garage-shelf", "Garage shelving", "Workshop", [
  ...[-0.7, 0.7].flatMap((x) =>
    [-0.3, 0.3].map((z) => box(x, 1, z, 0.08, 2, 0.08, dark)),
  ),
  ...Array.from({ length: 4 }, (_, i) =>
    box(0, 0.2 + i * 0.55, 0, 1.5, 0.08, 0.7, wood),
  ),
]);
add("storage-crate", "Storage crate", "Workshop", [
  box(0, 0.4, 0, 0.8, 0.8, 0.8, wood),
  box(0, 0.42, 0.41, 0.7, 0.1, 0.04, cream),
]);
add("traffic-cone", "Traffic cone", "Workshop", [
  box(0, 0.06, 0, 0.6, 0.12, 0.6, 0x5f7471),
  box(0, 0.3, 0, 0.35, 0.5, 0.35, 0xd59b64),
  box(0, 0.6, 0, 0.2, 0.2, 0.2, 0xf4e7cb),
]);
add("tyre-stack", "Tyre stack", "Workshop", [
  box(0, 0.18, 0, 0.7, 0.3, 0.7, dark),
  box(0, 0.52, 0, 0.7, 0.3, 0.7, dark),
]);
for (const [id, label, w, h, c] of [
  ["oak-tree", "Oak tree", 2.4, 3.5, 0x719969],
  ["pine-tree", "Pine tree", 1.6, 4, 0x5d947f],
  ["palm-tree", "Palm tree", 2.5, 3.2, 0x87aa6e],
  ["fruit-tree", "Fruit tree", 2, 2.8, 0x96b578],
] as [string, string, number, number, number][])
  add(id, label, "Garden", [
    box(0, h * 0.35, 0, 0.25, h * 0.7, 0.25, wood),
    ...(id === "pine-tree"
      ? [0, 1, 2].map((tier) =>
          box(
            0,
            h * 0.48 + tier * 0.75,
            0,
            w * (1 - tier * 0.23),
            1,
            w * (1 - tier * 0.23),
            c,
          ),
        )
      : id === "palm-tree"
        ? [
            box(0, h * 0.86, 0, w, 0.3, 0.45, c),
            box(0, h * 0.88, 0, 0.45, 0.3, w, c),
            box(0, h * 0.95, 0, 0.8, 0.5, 0.8, c),
          ]
        : [
            box(0, h * 0.75, 0, w * 0.75, h * 0.5, w * 0.75, c),
            ...[-1, 1].map((side) =>
              box(side * w * 0.3, h * 0.71, 0, w * 0.4, h * 0.33, w * 0.65, c),
            ),
          ]),
    ...(id === "fruit-tree"
      ? [-0.65, 0, 0.65].map((x) =>
          box(x, h * 0.75, 0.8, 0.2, 0.2, 0.2, 0xe0ac6d),
        )
      : []),
  ]);
add("hedge", "Hedge", "Garden", [box(0, 0.5, 0, 1.5, 1, 0.7, 0x77a174)]);
add("flower-bed", "Flower bed", "Garden", [
  box(0, 0.12, 0, 1.5, 0.24, 0.8, wood),
  ...[-0.5, 0, 0.5].map((x) => box(x, 0.45, 0, 0.3, 0.5, 0.3, 0xd6b0a1)),
]);
add("planter", "Square planter", "Garden", [
  box(0, 0.25, 0, 0.7, 0.5, 0.7, 0xbf946b),
  box(0, 0.65, 0, 0.5, 0.5, 0.5, 0x88aa75),
]);
add("vegetable-patch", "Vegetable patch", "Garden", [
  box(0, 0.06, 0, 1.8, 0.12, 1.5, 0xa58565),
  ...[-0.5, 0, 0.5].flatMap((x) =>
    [-0.45, 0, 0.45].map((z) => box(x, 0.22, z, 0.2, 0.3, 0.2, 0x89a96d)),
  ),
]);
add("boulder", "Boulder", "Garden", [
  box(0, 0.35, 0, 1.3, 0.7, 1.1, 0x9eaa9e),
  box(0.2, 0.8, 0, 0.8, 0.3, 0.8, 0x9eaa9e),
]);
add("birdhouse", "Birdhouse", "Garden", [
  box(0, 0.8, 0, 0.1, 1.6, 0.1, wood),
  box(0, 1.65, 0, 0.5, 0.5, 0.45, 0xd4b17e),
  box(0, 1.95, 0, 0.65, 0.12, 0.6, 0x8ca59a),
]);
add("pergola", "Pergola", "Garden", [
  ...[-1, 1].flatMap((x) =>
    [-1, 1].map((z) => box(x, 1.25, z, 0.15, 2.5, 0.15, wood)),
  ),
  ...[-1, -0.5, 0, 0.5, 1].map((x) => box(x, 2.55, 0, 0.15, 0.15, 2.3, wood)),
]);
for (const [id, label, height, w] of [
  ["table-lamp", "Table lamp", 0.65, 0.4],
  ["floor-lamp", "Floor lamp", 1.8, 0.6],
  ["street-lamp", "Street lamp", 3, 0.7],
  ["garden-light", "Garden light", 0.7, 0.35],
  ["ceiling-light", "Ceiling lamp", 0.3, 0.7],
  ["wall-light", "Wall light", 0.5, 0.3],
] as [string, string, number, number][])
  add(
    id,
    label,
    "Lighting",
    [
      box(0, height * 0.4, 0, 0.08, height * 0.8, 0.08, dark),
      box(0, height * 0.85, 0, w, height * 0.3, w, 0xffdf95),
      box(0, 0.04, 0, w * 0.7, 0.08, w * 0.7, dark),
    ],
    { interaction: "light" },
  );
add("toy-box", "Toy box", "Play", [
  box(0, 0.3, 0, 1.1, 0.6, 0.7, 0xd3b681),
  box(0, 0.65, 0, 1.15, 0.1, 0.75, 0x8baea1),
]);
add("dollhouse", "Doll house", "Play", [
  box(0, 0.25, 0, 0.8, 0.5, 0.55, 0xddb4a5),
  box(0, 0.6, 0, 0.9, 0.25, 0.65, 0x8ea69c, "wedge"),
]);
add("sandpit", "Sandpit", "Play", [
  box(0, 0.08, 0, 2, 0.16, 2, wood),
  box(0, 0.18, 0, 1.7, 0.08, 1.7, 0xe3d19f),
]);
add("play-slide", "Play slide", "Play", [
  box(0, 0.5, 0, 0.6, 1, 1.7, 0xd8b579, "wedge"),
  box(-0.4, 1, 0.7, 0.12, 2, 0.12, dark),
  box(0.4, 1, 0.7, 0.12, 2, 0.12, dark),
]);
add("goal", "Play goal", "Play", [
  box(-1, 0.7, 0, 0.1, 1.4, 0.1, cream),
  box(1, 0.7, 0, 0.1, 1.4, 0.1, cream),
  box(0, 1.4, 0, 2.1, 0.1, 0.1, cream),
]);
addRun2Content(add, box);
for (const [id, interaction] of [
  ["swing", "swing"],
  ["seesaw", "seesaw"],
  ["spring-rider", "rock"],
  ["rocking-chair", "rock"],
  ["trampoline", "bounce"],
  ["play-slide", "slide"],
  ["bench", "seat"],
  ["lantern", "light"],
] as [string, Item["interaction"]][])
  CATALOGUE.find((i) => i.id === id)!.interaction = interaction;
const hutch = CATALOGUE.find((i) => i.id === "dining-hutch")!;
hutch.interaction = "cabinet";
hutch.parts = [
  box(-0.7, 0.45, 0, 0.1, 0.9, 0.6, wood),
  box(0.7, 0.45, 0, 0.1, 0.9, 0.6, wood),
  box(0, 0.45, -0.25, 1.4, 0.9, 0.1, wood),
  box(0, 0.05, 0, 1.4, 0.1, 0.6, wood),
  box(0, 0.87, 0, 1.5, 0.12, 0.6, wood),
  ...hutch.parts.slice(1),
  box(0, 0.45, 0.32, 1.3, 0.72, 0.08, 0xa5b8a2),
];
export const ITEMS = new Map(CATALOGUE.map((i) => [i.id, i]));
export function partsFor(b: Block, doorAmount?: number): Part[] {
  const item = ITEMS.get(b.type);
  if (!item) throw Error("Unknown catalogue item");
  const parts = item.parts.map((p) => ({ ...p }));
  if (
    ["door", "cabinet"].includes(item.interaction || "") &&
    (b.open || doorAmount !== undefined)
  ) {
    const p = parts.at(-1)!;
    const angle =
      (((doorAmount ?? (b.open ? 1 : 0)) * Math.PI) / 2) *
      (item.interaction === "cabinet" ? -1 : 1);
    p.x += -p.w / 2 + (Math.cos(angle) * p.w) / 2;
    p.z += (-Math.sin(angle) * p.w) / 2;
    p.yaw = angle;
  }
  if (item.interaction === "light" && b.on === false)
    for (const p of parts) if (p.color === 0xffdf95) p.color = 0xc5c2af;
  return parts;
}
function collidersAt(b: Block, doorAmount?: number): any[] {
  if (LEGACY.has(b.type)) return [cellBox(b)];
  const a = ((b.rotation || 0) * Math.PI) / 180,
    c = Math.cos(a),
    s = Math.sin(a),
    item = ITEMS.get(b.type)!;
  if (item.ramp) {
    const w = Math.max(...item.parts.map((p) => p.w)),
      d = item.rampLength || (b.type === "stairs" ? 2 : item.parts[0].d),
      h = Math.max(...item.parts.map((p) => p.y + p.h / 2));
    return [
      {
        minX: b.x + 0.5 - (Math.abs(c) * w + Math.abs(s) * d) / 2,
        maxX: b.x + 0.5 + (Math.abs(c) * w + Math.abs(s) * d) / 2,
        minZ: b.z + 0.5 - (Math.abs(s) * w + Math.abs(c) * d) / 2,
        maxZ: b.z + 0.5 + (Math.abs(s) * w + Math.abs(c) * d) / 2,
        minY: b.y,
        maxY: b.y + h,
        ramp: {
          cx: b.x + 0.5,
          cz: b.z + 0.5,
          c,
          s,
          width: w,
          length: d,
          rise: h,
          baseY: b.y,
        },
      },
    ];
  }
  return partsFor(b, doorAmount).map((p) => {
    const angle = a + (p.yaw || 0),
      co = Math.cos(angle),
      si = Math.sin(angle),
      cx = b.x + 0.5 + p.x * c + p.z * s,
      cz = b.z + 0.5 - p.x * s + p.z * c,
      wx = (Math.abs(co) * p.w + Math.abs(si) * p.d) / 2,
      wz = (Math.abs(si) * p.w + Math.abs(co) * p.d) / 2;
    return {
      minX: cx - wx,
      maxX: cx + wx,
      minZ: cz - wz,
      maxZ: cz + wz,
      minY: b.y + p.y - p.h / 2,
      maxY: b.y + p.y + p.h / 2,
      obb: { cx, cz, c: co, s: si, halfW: p.w / 2, halfD: p.d / 2 },
    };
  });
}
export function blockColliders(b: Block): any[] {
  return collidersAt(b);
}
export function doorSweepColliders(b: Block, fraction: number): any[] {
  return collidersAt(b, fraction);
}
export function blockBounds(b: Block) {
  const boxes = blockColliders(b);
  return {
    minX: Math.min(...boxes.map((x) => x.minX)),
    maxX: Math.max(...boxes.map((x) => x.maxX)),
    minY: Math.min(...boxes.map((x) => x.minY)),
    maxY: Math.max(...boxes.map((x) => x.maxY)),
    minZ: Math.min(...boxes.map((x) => x.minZ)),
    maxZ: Math.max(...boxes.map((x) => x.maxZ)),
  };
}
export interface Prefab {
  id: string;
  label: string;
  category: string;
  icon: string;
  color: number;
  blocks: Block[];
}
export const PREFABS: Prefab[] = [
  {
    id: "set-bedroom",
    label: "Bedroom set",
    category: "Presets",
    icon: "🛏",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "single-bed" },
      { x: 2, y: 0, z: 0, type: "nightstand" },
      { x: 2, y: 0, z: 2, type: "floor-lamp" },
    ],
  },
  {
    id: "set-kitchen",
    label: "Kitchen run",
    category: "Presets",
    icon: "🍳",
    color: cream,
    blocks: [
      { x: 0, y: 0, z: 0, type: "kitchen-counter" },
      { x: 1, y: 0, z: 0, type: "sink" },
      { x: 2, y: 0, z: 0, type: "stove" },
    ],
  },
  {
    id: "set-garden",
    label: "Garden seating",
    category: "Presets",
    icon: "🌷",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "bench" },
      { x: -2, y: 0, z: 0, type: "planter" },
      { x: 2, y: 0, z: 0, type: "planter" },
    ],
  },
  {
    id: "set-workshop",
    label: "Workshop set",
    category: "Presets",
    icon: "🛠",
    color: dark,
    blocks: [
      { x: 0, y: 0, z: 0, type: "workbench" },
      { x: 3, y: 0, z: 0, type: "tool-cabinet" },
      { x: 0, y: 0, z: 2, type: "storage-crate" },
    ],
  },
];
PREFABS.push(
  {
    id: "set-dining",
    label: "Family dining",
    category: "Presets",
    icon: "🍽",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "round-table" },
      { x: -2, y: 0, z: 0, type: "chair", rotation: 270 },
      { x: 2, y: 0, z: 0, type: "chair", rotation: 90 },
      { x: 0, y: 0, z: 2, type: "chair" },
    ],
  },
  {
    id: "set-bathroom",
    label: "Bathroom suite",
    category: "Presets",
    icon: "🛁",
    color: cream,
    blocks: [
      { x: 0, y: 0, z: 0, type: "washbasin" },
      { x: 2, y: 0, z: 0, type: "toilet" },
      { x: 4, y: 0, z: 0, type: "bath" },
    ],
  },
  {
    id: "set-study",
    label: "Reading and study",
    category: "Presets",
    icon: "📚",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "desk" },
      { x: 0, y: 0.81, z: 0, type: "desk-lamp" },
      { x: 0, y: 0, z: 2, type: "chair" },
      { x: 3, y: 0, z: 0, type: "bookcase" },
    ],
  },
  {
    id: "set-playground",
    label: "Little playground",
    category: "Presets",
    icon: "🛝",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "swing" },
      { x: 4, y: 0, z: 0, type: "play-slide" },
      { x: 0, y: 0, z: 4, type: "sandpit" },
    ],
  },
  {
    id: "set-farm",
    label: "Animal care corner",
    category: "Presets",
    icon: "🐾",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "feeding-trough" },
      { x: 3, y: 0, z: 0, type: "kennel" },
      { x: -3, y: 0, z: 0, type: "hay-bale" },
    ],
  },
  {
    id: "set-bus-stop",
    label: "Neighbourhood bus stop",
    category: "Presets",
    icon: "🚏",
    color: dark,
    blocks: [
      { x: 0, y: 0, z: 0, type: "bus-shelter" },
      { x: 3, y: 0, z: 0, type: "street-sign" },
      { x: -3, y: 0, z: 0, type: "park-bin" },
    ],
  },
  {
    id: "set-picnic",
    label: "Picnic corner",
    category: "Presets",
    icon: "☀",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "round-table" },
      { x: 0, y: 0, z: 2, type: "bench" },
      { x: 0, y: 0, z: -2, type: "bench", rotation: 180 },
      { x: 3, y: 0, z: 0, type: "planter" },
    ],
  },
  {
    id: "set-pavilion",
    label: "Open garden pavilion",
    category: "Presets",
    icon: "⌂",
    color: wood,
    blocks: [
      { x: 0, y: 0, z: 0, type: "wide-floor" },
      ...[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => ({ x, y: 0.15, z, type: "pillar" })),
      ),
      { x: 0, y: 2.65, z: 0, type: "wide-floor" },
    ],
  },
);
export const CHOICES = [...CATALOGUE, ...PREFABS];
export function expandPrefab(b: Block): Block[] {
  const set = PREFABS.find((p) => p.id === b.type);
  if (!set) return [b];
  const a = ((b.rotation || 0) * Math.PI) / 180,
    c = Math.round(Math.cos(a)),
    s = Math.round(Math.sin(a));
  return set.blocks.map((p) => ({
    x: b.x + p.x * c + p.z * s,
    y: b.y + p.y,
    z: b.z - p.x * s + p.z * c,
    type: p.type,
    rotation: ((b.rotation || 0) + (p.rotation || 0)) % 360,
  }));
}
