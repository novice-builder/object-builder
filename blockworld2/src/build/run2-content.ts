import type { Item, Part } from "./registry";
type Add = (
  id: string,
  label: string,
  category: string,
  parts: Part[],
  options?: Partial<Item>,
) => void;
type Box = (
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: number,
  shape?: Part["shape"],
) => Part;
/** Original, curated compound models. No colour-variant item multiplication. */
export function addRun2Content(add: Add, b: Box) {
  const oak = 0xb68d60,
    pale = 0xeee1c5,
    teal = 0x779c93,
    metal = 0x677c7d,
    glass = 0xa0c6ce,
    clay = 0xc88d72;
  const legs = (w: number, d: number, h = 0.7) =>
    [-w / 2 + 0.1, w / 2 - 0.1].flatMap((x) =>
      [-d / 2 + 0.1, d / 2 - 0.1].map((z) => b(x, h / 2, z, 0.1, h, 0.1, oak)),
    );
  const frame = (w: number, h: number, d = 0.2) => [
    b(-w / 2, h / 2, 0, 0.2, h, d, pale),
    b(w / 2, h / 2, 0, 0.2, h, d, pale),
    b(0, h, 0, w + 0.2, 0.2, d, pale),
  ];
  const shelf = (w: number, h: number, d: number, n: number) => [
    b(-w / 2, h / 2, 0, 0.12, h, d, oak),
    b(w / 2, h / 2, 0, 0.12, h, d, oak),
    ...Array.from({ length: n }, (_, i) =>
      b(0, 0.08 + (i * (h - 0.16)) / (n - 1), 0, w, 0.12, d, oak),
    ),
  ];
  const seat = [
    b(0, 0.45, 0, 0.8, 0.15, 0.8, teal),
    b(0, 0.85, 0.35, 0.8, 0.7, 0.12, teal),
    ...legs(0.7, 0.7, 0.4),
  ];
  for (const [id, label, color, surface] of [
    ["parquet", "Parquet flooring", 0xc09b6d, "parquet"],
    ["herringbone-brick", "Herringbone paving", 0xc28669, "herringbone"],
    ["river-stone", "River stone", 0x96a89d, "river"],
    ["corrugated-metal", "Corrugated sheet", 0xa2b4b6, "corrugated"],
    ["woven-bamboo", "Woven bamboo", 0xc6b581, "woven"],
    ["shingles", "Roof shingles", 0x8b8677, "shingles"],
  ] as [string, string, number, string][])
    add(id, label, "Materials", [b(0, 0.5, 0, 1, 1, 1, color)], {
      cube: true,
      surface,
    });
  add("window-wall", "Wall with window opening", "Shapes", [
    b(-0.8, 1.25, 0, 0.4, 2.5, 0.2, pale),
    b(0.8, 1.25, 0, 0.4, 2.5, 0.2, pale),
    b(0, 0.4, 0, 1.2, 0.8, 0.2, pale),
    b(0, 2.25, 0, 1.2, 0.5, 0.2, pale),
  ]);
  add("doorway-wall", "Wall with clear doorway", "Shapes", frame(1.5, 2.5));
  add("wide-floor", "Four-metre floor", "Shapes", [
    b(0, 0.075, 0, 4, 0.15, 4, oak),
  ]);
  add("long-slab", "Long half slab", "Shapes", [
    b(0, 0.25, 0, 3, 0.5, 1, clay),
  ]);
  add("half-block", "Half-width block", "Shapes", [
    b(0, 0.5, 0, 0.5, 1, 1, pale),
  ]);
  add("corner-pillar", "L-shaped pillar", "Shapes", [
    b(-0.25, 1.25, 0, 0.25, 2.5, 0.8, clay),
    b(0, 1.25, -0.25, 0.8, 2.5, 0.25, clay),
  ]);
  add("fluted-column", "Fluted column", "Shapes", [
    b(0, 0.12, 0, 0.9, 0.24, 0.9, pale),
    b(0, 1.4, 0, 0.4, 2.6, 0.7, pale),
    b(0, 1.4, 0, 0.7, 2.6, 0.4, pale),
    b(0, 2.8, 0, 0.9, 0.2, 0.9, pale),
  ]);
  add("roof-ridge", "Roof ridge cap", "Shapes", [
    b(0, 0.15, 0, 1, 0.3, 2, clay),
    b(0, 0.36, 0, 0.45, 0.18, 2, clay),
  ]);
  add("roof-corner", "Roof corner", "Shapes", [
    b(0, 0.5, 0, 1, 1, 1, clay, "wedge"),
    { ...b(0.5, 0.5, 0.5, 1, 1, 1, clay, "wedge"), yaw: Math.PI / 2 },
  ]);
  add(
    "brick-stairs",
    "Wide masonry stairs",
    "Shapes",
    Array.from({ length: 6 }, (_, i) =>
      b(0, (i + 1) / 6, 1.25 - i * 0.5, 2, (i + 1) / 3, 0.5, clay),
    ),
    { ramp: true, rampLength: 3 },
  );
  add(
    "long-ramp",
    "Long accessible ramp",
    "Shapes",
    [b(0, 1, 0, 2, 2, 4, oak, "wedge")],
    { ramp: true, rampLength: 4 },
  );
  add("balcony", "Balcony platform", "Shapes", [
    b(0, 0.1, 0, 2, 0.2, 2, oak),
    ...[-0.95, 0.95].map((x) => b(x, 0.7, 0, 0.1, 1.2, 2, metal)),
    b(0, 0.7, -0.95, 2, 1.2, 0.1, metal),
  ]);
  add(
    "casement-window",
    "Opening casement window",
    "Openings",
    [
      ...frame(1.2, 1.2, 0.12),
      b(0, 0.05, 0, 1.2, 0.1, 0.12, pale),
      b(0, 0.6, 0, 1.04, 1.05, 0.08, glass),
    ],
    { interaction: "door" },
  );
  add(
    "stable-door",
    "Stable half door",
    "Openings",
    [...frame(1.4, 1.2), b(0, 0.6, 0, 1.2, 1.05, 0.12, oak)],
    { interaction: "door" },
  );
  add(
    "field-gate",
    "Wide field gate",
    "Openings",
    [...frame(2.5, 1.25), b(0, 0.65, 0, 2.3, 1, 0.1, teal)],
    { interaction: "door" },
  );
  add("lattice-fence", "Lattice fence", "Openings", [
    b(-0.65, 0.65, 0, 0.1, 1.3, 0.12, oak),
    b(0.65, 0.65, 0, 0.1, 1.3, 0.12, oak),
    ...[-0.4, 0, 0.4].flatMap((x) => [
      b(x, 0.45, 0, 0.1, 0.8, 0.12, oak),
      b(0, 0.3 + x, 0, 1.3, 0.08, 0.12, oak),
    ]),
  ]);
  add(
    "garage-frame",
    "Wide garage opening frame",
    "Openings",
    frame(4.5, 3, 0.35),
  );
  add("round-table", "Octagonal dining table", "Furniture", [
    b(0, 0.76, 0, 1.4, 0.14, 1, oak),
    b(0, 0.76, 0, 1, 0.14, 1.4, oak),
    b(0, 0.38, 0, 0.25, 0.76, 0.25, metal),
    b(0, 0.08, 0, 0.9, 0.16, 0.9, metal),
  ]);
  add("rocking-chair", "Rocking chair", "Furniture", [
    ...seat,
    b(-0.3, 0.08, 0, 0.12, 0.16, 1.1, oak),
    b(0.3, 0.08, 0, 0.12, 0.16, 1.1, oak),
  ]);
  add(
    "beanbag",
    "Beanbag seat",
    "Furniture",
    [
      b(0, 0.25, 0, 0.9, 0.5, 0.9, clay),
      b(0, 0.5, 0.2, 0.8, 0.35, 0.55, clay),
      b(0, 0.18, -0.25, 1, 0.25, 0.7, clay),
    ],
    { interaction: "seat" },
  );
  add("loft-bed", "Loft bed with desk", "Furniture", [
    b(0, 1.6, 0, 1.2, 0.25, 2, teal),
    ...legs(1.2, 2, 1.6),
    b(0, 0.75, -0.5, 1, 0.12, 0.7, oak),
    b(0, 1.85, -0.95, 1.2, 0.4, 0.1, oak),
  ]);
  add(
    "chaise",
    "Chaise lounge",
    "Furniture",
    [
      b(0, 0.4, 0, 0.85, 0.35, 1.8, teal),
      b(0, 0.75, 0.7, 0.85, 0.7, 0.25, teal),
      ...legs(0.8, 1.7, 0.25),
    ],
    { interaction: "seat" },
  );
  add("wall-clock", "Wall clock", "Furniture", [
    b(0, 0.45, 0, 0.8, 0.9, 0.1, oak),
    b(0, 0.45, 0.07, 0.64, 0.72, 0.04, pale),
    b(0, 0.58, 0.1, 0.04, 0.27, 0.03, metal),
    b(0.15, 0.45, 0.1, 0.3, 0.04, 0.03, metal),
  ]);
  add("picture-frame", "Landscape picture", "Furniture", [
    b(0, 0.45, 0, 1.1, 0.9, 0.1, oak),
    b(0, 0.46, 0.07, 0.95, 0.7, 0.04, glass),
    b(0, 0.23, 0.1, 0.95, 0.25, 0.02, teal),
    b(0.25, 0.65, 0.1, 0.15, 0.15, 0.02, 0xf3d786),
  ]);
  add("coat-rack", "Coat stand", "Furniture", [
    b(0, 0.9, 0, 0.12, 1.8, 0.12, oak),
    b(0, 1.5, 0, 0.8, 0.1, 0.15, oak),
    b(0, 1.25, 0, 0.15, 0.1, 0.7, oak),
    b(0, 0.06, 0, 0.7, 0.12, 0.7, metal),
  ]);
  add("shoe-rack", "Open shoe rack", "Furniture", shelf(1, 0.65, 0.4, 3));
  add(
    "folding-screen",
    "Folding room screen",
    "Furniture",
    [-1, 0, 1].map((i) => ({
      ...b(i * 0.6, 1, Math.abs(i) * 0.18, 0.6, 2, 0.08, teal),
      yaw: i * 0.35,
    })),
  );
  add("corner-counter", "Corner kitchen counter", "Kitchen", [
    b(-0.35, 0.5, 0, 0.6, 1, 1.3, teal),
    b(0.3, 0.5, -0.35, 0.7, 1, 0.6, teal),
    b(-0.35, 1.05, 0, 0.68, 0.1, 1.4, pale),
    b(0.3, 1.05, -0.35, 0.7, 0.1, 0.68, pale),
  ]);
  add("dishwasher", "Dishwasher", "Kitchen", [
    b(0, 0.5, 0, 0.8, 1, 0.7, pale),
    b(0, 0.5, 0.37, 0.65, 0.65, 0.04, metal),
    b(0, 0.9, 0.38, 0.5, 0.06, 0.04, teal),
  ]);
  add("washing-machine", "Washing machine", "Kitchen", [
    b(0, 0.5, 0, 0.85, 1, 0.75, pale),
    b(0, 0.45, 0.39, 0.55, 0.55, 0.06, metal),
    b(0, 0.45, 0.43, 0.35, 0.35, 0.02, glass),
    b(0.25, 0.9, 0.4, 0.1, 0.1, 0.04, teal),
  ]);
  add("microwave", "Microwave", "Kitchen", [
    b(0, 0.22, 0, 0.65, 0.44, 0.45, pale),
    b(-0.08, 0.22, 0.24, 0.4, 0.3, 0.03, metal),
    b(0.23, 0.3, 0.25, 0.07, 0.08, 0.03, teal),
  ]);
  add("kettle", "Electric kettle", "Kitchen", [
    b(0, 0.18, 0, 0.28, 0.36, 0.28, teal),
    b(0.18, 0.2, 0, 0.12, 0.08, 0.12, teal),
    b(-0.18, 0.22, 0, 0.1, 0.22, 0.12, metal),
    b(0, 0.03, 0, 0.35, 0.06, 0.35, metal),
  ]);
  add("toaster", "Toaster", "Kitchen", [
    b(0, 0.15, 0, 0.42, 0.3, 0.28, clay),
    b(-0.1, 0.31, 0, 0.06, 0.02, 0.2, metal),
    b(0.1, 0.31, 0, 0.06, 0.02, 0.2, metal),
    b(0.23, 0.2, 0, 0.04, 0.06, 0.08, metal),
  ]);
  add("cup-rack", "Cup rack", "Kitchen", [
    b(0, 0.06, 0, 0.5, 0.12, 0.4, oak),
    b(0, 0.4, 0, 0.08, 0.7, 0.08, oak),
    b(0, 0.55, 0, 0.55, 0.06, 0.08, oak),
    ...[-0.2, 0.2].map((x) => b(x, 0.42, 0, 0.15, 0.2, 0.16, pale)),
  ]);
  add("dining-hutch", "Dining hutch", "Kitchen", [
    b(0, 0.45, 0, 1.5, 0.9, 0.6, oak),
    ...shelf(1.4, 1, 0.35, 3).map((p) => ({
      ...p,
      y: p.y + 0.9,
      z: p.z - 0.1,
    })),
    b(0, 1.4, -0.3, 1.5, 1, 0.08, oak),
  ]);
  add("corner-bath", "Corner bath", "Bathroom", [
    b(-0.2, 0.3, 0, 0.9, 0.6, 1.4, pale),
    b(0.35, 0.3, -0.3, 0.8, 0.6, 0.8, pale),
    b(-0.2, 0.62, 0, 0.65, 0.03, 1.1, glass),
  ]);
  add("laundry-basket", "Laundry basket", "Bathroom", [
    b(0, 0.05, 0, 0.65, 0.1, 0.55, oak),
    ...[-0.3, 0.3].map((x) => b(x, 0.35, 0, 0.07, 0.7, 0.55, oak)),
    ...[-0.25, 0.25].map((z) => b(0, 0.35, z, 0.6, 0.7, 0.06, oak)),
    b(0, 0.67, 0, 0.5, 0.08, 0.4, pale),
  ]);
  add("bath-mat", "Bath mat", "Bathroom", [
    b(0, 0.02, 0, 1.1, 0.04, 0.65, teal),
    ...[-0.4, -0.2, 0, 0.2, 0.4].map((x) =>
      b(x, 0.045, 0, 0.06, 0.01, 0.6, pale),
    ),
  ]);
  add("soap-dispenser", "Soap dispenser", "Bathroom", [
    b(0, 0.15, 0, 0.18, 0.3, 0.18, clay),
    b(0, 0.34, 0, 0.06, 0.08, 0.06, metal),
    b(0.06, 0.39, 0, 0.18, 0.03, 0.05, metal),
  ]);
  add(
    "shower-stool",
    "Shower stool",
    "Bathroom",
    [b(0, 0.45, 0, 0.6, 0.1, 0.5, pale), ...legs(0.5, 0.4, 0.4)],
    { interaction: "seat" },
  );
  add("car-lift", "Garage service lift", "Workshop", [
    b(-1.4, 1.4, 0, 0.3, 2.8, 0.5, teal),
    b(1.4, 1.4, 0, 0.3, 2.8, 0.5, teal),
    b(-0.8, 0.18, 0, 0.45, 0.2, 4, metal),
    b(0.8, 0.18, 0, 0.45, 0.2, 4, metal),
  ]);
  add("air-compressor", "Air compressor", "Workshop", [
    b(0, 0.4, 0, 1.1, 0.5, 0.5, clay),
    b(0, 0.78, 0, 0.45, 0.25, 0.35, metal),
    ...[-0.4, 0.4].map((x) => b(x, 0.15, 0, 0.2, 0.3, 0.65, metal)),
    b(0.55, 0.9, 0, 0.1, 0.5, 0.1, metal),
  ]);
  add("tool-board", "Tool pegboard", "Workshop", [
    b(0, 0.65, 0, 1.6, 1.3, 0.1, oak),
    ...[-0.55, 0, 0.55].flatMap((x, i) => [
      b(x, 0.6, 0.1, 0.08, 0.65, 0.07, metal),
      b(x, 0.9, 0.1, i === 1 ? 0.3 : 0.16, 0.1, 0.07, metal),
    ]),
  ]);
  add("wheelbarrow", "Wheelbarrow", "Workshop", [
    b(0, 0.55, 0, 0.8, 0.25, 1, teal),
    b(-0.35, 0.65, 0.7, 0.08, 0.1, 1, oak),
    b(0.35, 0.65, 0.7, 0.08, 0.1, 1, oak),
    b(0, 0.2, -0.5, 0.2, 0.4, 0.4, metal),
    b(-0.3, 0.25, 0.3, 0.06, 0.5, 0.06, metal),
    b(0.3, 0.25, 0.3, 0.06, 0.5, 0.06, metal),
  ]);
  add("sawhorse", "Folding sawhorse", "Workshop", [
    b(0, 0.8, 0, 1.4, 0.15, 0.2, oak),
    ...[-0.55, 0.55].flatMap((x) =>
      [-0.3, 0.3].map((z) => b(x, 0.4, z, 0.1, 0.8, 0.1, oak)),
    ),
  ]);
  add("bench-vice", "Bench vice", "Workshop", [
    b(0, 0.08, 0, 0.6, 0.16, 0.4, metal),
    b(-0.18, 0.27, 0, 0.15, 0.3, 0.4, teal),
    b(0.18, 0.27, 0, 0.15, 0.3, 0.4, teal),
    b(0.35, 0.2, 0, 0.4, 0.06, 0.06, metal),
  ]);
  add("bicycle-rack", "Bicycle parking rack", "Workshop", [
    b(0, 0.08, 0, 2, 0.16, 0.65, metal),
    ...[-0.7, 0, 0.7].map((x) => b(x, 0.4, 0, 0.08, 0.8, 0.65, metal)),
  ]);
  add("willow", "Weeping willow", "Garden", [
    b(0, 1.3, 0, 0.35, 2.6, 0.35, oak),
    b(0, 3, 0, 2.8, 1.4, 2.8, teal),
    ...[-1.2, 1.2].flatMap((x) =>
      [-1.2, 1.2].map((z) => b(x, 1.9, z, 0.35, 2, 0.35, teal)),
    ),
  ]);
  add("birch", "Birch tree", "Garden", [
    b(0, 1.6, 0, 0.25, 3.2, 0.25, pale),
    b(0, 3.1, 0, 1.3, 1.8, 1.4, 0x98b482),
    b(0.5, 2.7, 0, 0.9, 1.1, 1, 0x98b482),
    ...Array.from({ length: 6 }, (_, i) =>
      b(0, 0.3 + i * 0.4, 0.13, 0.25, 0.06, 0.02, metal),
    ),
  ]);
  add(
    "fern",
    "Fern",
    "Garden",
    [-1, 0, 1].flatMap((i) => [
      b(i * 0.23, 0.25, 0, 0.18, 0.5, 0.8, teal),
      b(0, 0.2, i * 0.23, 0.8, 0.4, 0.18, teal),
    ]),
  );
  add("flower-arch", "Flowered garden arch", "Garden", [
    ...frame(2.4, 2.8, 0.3),
    ...[-1.15, 1.15].flatMap((x) => [
      b(x, 1.4, 0, 0.4, 1.8, 0.4, teal),
      b(x, 2.3, 0, 0.5, 0.4, 0.5, clay),
    ]),
    b(0, 2.9, 0, 2.3, 0.25, 0.5, teal),
  ]);
  add("raised-bed", "Raised vegetable bed", "Garden", [
    b(0, 0.2, 0, 2, 0.4, 1.3, oak),
    b(0, 0.42, 0, 1.8, 0.04, 1.1, 0x8c765b),
    ...[-0.6, 0, 0.6].flatMap((x) =>
      [-0.3, 0.3].map((z) => b(x, 0.58, z, 0.3, 0.3, 0.3, teal)),
    ),
  ]);
  add(
    "stone-path",
    "Stepping stone path",
    "Garden",
    [-0.65, 0, 0.65].map((z, i) =>
      b(i % 2 ? 0.1 : -0.1, 0.03, z, 0.85, 0.06, 0.5, 0xacb5a0),
    ),
  );
  add(
    "pond-bridge",
    "Garden footbridge",
    "Garden",
    [
      b(0, 0.18, 0, 1.6, 0.2, 3, oak),
      ...[-0.85, 0.85].flatMap((x) => [
        b(x, 0.65, 0, 0.1, 0.1, 3, oak),
        ...[-1.3, 0, 1.3].map((z) => b(x, 0.35, z, 0.1, 0.7, 0.1, oak)),
      ]),
    ].map((p) => ({ ...p, color: p.color || oak })),
  );
  add("watering-can", "Watering can", "Garden", [
    b(0, 0.22, 0, 0.4, 0.44, 0.35, teal),
    { ...b(0.35, 0.24, 0, 0.5, 0.12, 0.12, teal), yaw: 0 },
    b(-0.25, 0.3, 0, 0.12, 0.35, 0.12, metal),
    b(0, 0.5, 0, 0.35, 0.08, 0.12, metal),
  ]);
  add(
    "wall-sconce",
    "Wall sconce",
    "Lighting",
    [
      b(0, 0.35, -0.1, 0.3, 0.7, 0.1, metal),
      b(0, 0.45, 0.12, 0.35, 0.4, 0.35, 0xffdf95),
    ],
    { interaction: "light" },
  );
  add(
    "desk-lamp",
    "Articulated desk lamp",
    "Lighting",
    [
      b(0, 0.04, 0, 0.5, 0.08, 0.4, metal),
      b(-0.15, 0.3, 0, 0.06, 0.55, 0.06, teal),
      b(0, 0.55, 0, 0.4, 0.08, 0.08, teal),
      b(0.18, 0.5, 0, 0.3, 0.2, 0.25, 0xffdf95),
    ],
    { interaction: "light" },
  );
  add(
    "string-lights",
    "Garden string lights",
    "Lighting",
    [
      b(-1.5, 1.1, 0, 0.1, 2.2, 0.1, oak),
      b(1.5, 1.1, 0, 0.1, 2.2, 0.1, oak),
      b(0, 2.15, 0, 3, 0.04, 0.04, metal),
      ...[-1, -0.33, 0.33, 1].map((x) =>
        b(x, 2, 0, 0.15, 0.25, 0.15, 0xffdf95),
      ),
    ],
    { interaction: "light" },
  );
  add(
    "camp-lantern",
    "Camping lantern",
    "Lighting",
    [
      b(0, 0.07, 0, 0.4, 0.14, 0.4, metal),
      b(0, 0.3, 0, 0.28, 0.35, 0.28, 0xffdf95),
      b(0, 0.5, 0, 0.4, 0.08, 0.4, teal),
      b(0, 0.65, 0, 0.25, 0.2, 0.05, metal),
    ],
    { interaction: "light" },
  );
  add("swing", "Playground swing", "Play", [
    b(-1, 1.3, 0, 0.15, 2.6, 0.8, teal),
    b(1, 1.3, 0, 0.15, 2.6, 0.8, teal),
    b(0, 2.5, 0, 2.2, 0.15, 0.15, oak),
    b(-0.35, 1.55, 0, 0.04, 1.8, 0.04, metal),
    b(0.35, 1.55, 0, 0.04, 1.8, 0.04, metal),
    b(0, 0.65, 0, 0.8, 0.12, 0.45, clay),
  ]);
  add("seesaw", "Seesaw", "Play", [
    b(0, 0.3, 0, 0.4, 0.6, 0.7, teal),
    b(0, 0.65, 0, 3, 0.15, 0.4, oak),
    b(-1.2, 0.8, 0, 0.5, 0.15, 0.55, clay),
    b(1.2, 0.8, 0, 0.5, 0.15, 0.55, clay),
  ]);
  add("spring-rider", "Spring pony", "Play", [
    b(0, 0.25, 0, 0.25, 0.5, 0.25, metal),
    b(0, 0.65, 0, 0.45, 0.5, 0.9, clay),
    b(0, 1, -0.4, 0.3, 0.5, 0.25, clay),
    b(0, 0.9, 0, 0.6, 0.1, 0.1, teal),
  ]);
  add("trampoline", "Garden trampoline", "Play", [
    b(0, 0.4, 0, 2, 0.15, 2, teal),
    b(0, 0.49, 0, 1.7, 0.04, 1.7, metal),
    ...legs(1.9, 1.9, 0.35),
  ]);
  add("teddy", "Teddy bear", "Play", [
    b(0, 0.25, 0, 0.3, 0.4, 0.25, oak),
    b(0, 0.55, 0, 0.35, 0.3, 0.28, oak),
    ...[-0.18, 0.18].flatMap((x) => [
      b(x, 0.7, 0, 0.12, 0.14, 0.12, oak),
      b(x, 0.1, 0.1, 0.15, 0.15, 0.2, oak),
    ]),
    b(0, 0.54, 0.16, 0.12, 0.07, 0.04, metal),
  ]);
  add("toy-train", "Toy train", "Play", [
    b(0, 0.18, 0, 0.4, 0.2, 1, clay),
    b(0, 0.4, 0.2, 0.4, 0.4, 0.35, teal),
    b(0, 0.4, -0.25, 0.25, 0.25, 0.35, metal),
    ...[-0.23, 0.23].flatMap((x) =>
      [-0.32, 0.32].map((z) => b(x, 0.12, z, 0.12, 0.22, 0.2, metal)),
    ),
  ]);
  add("toy-blocks", "Wooden toy blocks", "Play", [
    b(-0.2, 0.12, 0, 0.25, 0.24, 0.3, clay),
    b(0.15, 0.17, 0, 0.3, 0.34, 0.3, teal),
    b(0.1, 0.42, 0, 0.6, 0.16, 0.3, pale),
  ]);
  add("chalkboard", "Standing chalkboard", "Play", [
    b(0, 0.95, 0, 1.4, 1, 0.12, oak),
    b(0, 0.95, 0.08, 1.2, 0.8, 0.03, 0x385b52),
    ...[-0.55, 0.55].map((x) => b(x, 0.5, 0, 0.12, 1, 0.5, oak)),
    b(0, 0.9, 0.11, 0.6, 0.04, 0.02, pale),
  ]);
  add("post-box", "Post box", "Street", [
    b(0, 0.5, 0, 0.5, 1, 0.5, clay),
    b(0, 1.05, 0, 0.6, 0.15, 0.6, clay),
    b(0, 0.85, 0.26, 0.35, 0.06, 0.02, metal),
  ]);
  add("bus-shelter", "Bus shelter", "Street", [
    b(0, 2.3, 0, 3, 0.2, 1.8, teal),
    ...[-1.3, 1.3].map((x) => b(x, 1.1, -0.6, 0.12, 2.2, 0.12, metal)),
    b(0, 1.2, -0.7, 2.8, 1.8, 0.08, glass),
    b(0, 0.5, -0.3, 2, 0.15, 0.45, oak),
    b(-0.8, 0.25, -0.3, 0.1, 0.5, 0.1, metal),
    b(0.8, 0.25, -0.3, 0.1, 0.5, 0.1, metal),
  ]);
  add("street-sign", "Direction signpost", "Street", [
    b(0, 1.1, 0, 0.12, 2.2, 0.12, oak),
    b(0.25, 1.9, 0, 1, 0.3, 0.1, teal),
    b(-0.25, 1.5, 0, 1, 0.3, 0.1, clay),
  ]);
  add("park-bin", "Park recycling bin", "Street", [
    b(0, 0.5, 0, 0.65, 1, 0.65, teal),
    b(0, 1.05, 0, 0.75, 0.12, 0.75, metal),
    b(0, 0.85, 0.34, 0.4, 0.16, 0.03, metal),
  ]);
  add("hydrant", "Street hydrant", "Street", [
    b(0, 0.4, 0, 0.3, 0.8, 0.3, clay),
    b(0, 0.85, 0, 0.4, 0.12, 0.4, clay),
    b(0, 0.6, 0, 0.7, 0.18, 0.18, metal),
  ]);
  add("bollard", "Path bollard", "Street", [
    b(0, 0.45, 0, 0.2, 0.9, 0.2, metal),
    b(0, 0.75, 0, 0.23, 0.15, 0.23, pale),
  ]);
  add("feeding-trough", "Animal feeding trough", "Farm", [
    b(0, 0.2, 0, 1.5, 0.4, 0.6, oak),
    b(0, 0.42, 0, 1.3, 0.04, 0.4, teal),
    b(-0.55, 0.12, 0, 0.12, 0.24, 0.75, metal),
    b(0.55, 0.12, 0, 0.12, 0.24, 0.75, metal),
  ]);
  add("hay-bale", "Hay bale", "Farm", [
    b(0, 0.35, 0, 1.2, 0.7, 0.75, 0xd5bd7d),
    b(-0.35, 0.35, 0, 0.06, 0.72, 0.78, oak),
    b(0.35, 0.35, 0, 0.06, 0.72, 0.78, oak),
  ]);
  add("chicken-coop", "Chicken coop", "Farm", [
    ...legs(1.4, 1, 0.4),
    b(0, 0.5, 0, 1.4, 0.2, 1, oak),
    b(-0.6, 0.9, 0, 0.2, 0.8, 1, pale),
    b(0.6, 0.9, 0, 0.2, 0.8, 1, pale),
    b(0, 0.9, -0.45, 1.2, 0.8, 0.1, pale),
    b(0, 1.35, 0, 1.6, 0.25, 1.2, clay, "wedge"),
  ]);
  add("kennel", "Dog kennel", "Farm", [
    b(-0.4, 0.35, 0, 0.15, 0.7, 1, oak),
    b(0.4, 0.35, 0, 0.15, 0.7, 1, oak),
    b(0, 0.35, -0.45, 0.8, 0.7, 0.1, oak),
    b(0, 0.8, 0, 1, 0.25, 1.1, teal, "wedge"),
  ]);
  add("hitching-post", "Hitching rail", "Farm", [
    b(-0.8, 0.6, 0, 0.15, 1.2, 0.15, oak),
    b(0.8, 0.6, 0, 0.15, 1.2, 0.15, oak),
    b(0, 1, 0, 1.8, 0.15, 0.15, oak),
  ]);
  add("beehive", "Garden beehive", "Farm", [
    b(0, 0.1, 0, 0.85, 0.2, 0.75, oak),
    ...[0, 1, 2].map((i) => b(0, 0.3 + i * 0.24, 0, 0.65, 0.22, 0.6, 0xd8bc78)),
    b(0, 0.92, 0, 0.8, 0.12, 0.75, teal),
  ]);
}
