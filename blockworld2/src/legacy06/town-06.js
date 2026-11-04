// Authored street frontages. Empty slots are properties, not random scatter.
export const TOWN_BUILDINGS = [];
export const TOWN_LOTS = [];
const walls = [0xf1dfad, 0xe7b49b, 0xb9cfb4, 0xe0bbbc, 0xd9b88f, 0xb5cbd2];
const roofs = [0x447c80, 0xad6c51, 0x6b7690, 0x6c7980];
function frontage(street, xs, roadZ, side, vacant) {
  xs.forEach((x, i) => {
    const z = roadZ + side * 16,
      angle = side < 0 ? 0 : Math.PI;
    if (vacant.includes(i)) {
      TOWN_LOTS.push({
        id: `${street}-lot-${i}`,
        x,
        z,
        w: 17,
        d: 16,
        angle,
        street,
        roadZ,
        subtle: true,
      });
    } else {
      const two =
        street === "north"
          ? [1, 5].includes(i) && side < 0
          : [2, 5].includes(i) && side > 0;
      TOWN_BUILDINGS.push({
        id: `${street}-${side < 0 ? "n" : "s"}-${i}`,
        name: `${street === "north" ? "Linden" : "Willow"} ${two ? "family home" : "cottage"} ${i + 1}`,
        x,
        z,
        w: two ? 12 : 8 + (i % 3),
        d: two ? 12 : 8 + (i % 2) * 2,
        angle,
        wall: walls[(i + (side + 1) * 2) % walls.length],
        roof: roofs[(i + (side + 1)) % 4],
        style: two ? "gable" : ["hip", "gable", "shed"][i % 3],
        storeys: two ? 2 : 1,
        rooms: two || i % 3 === 0,
        designed: true,
        garden: 0,
        garage: i % 4 === 0,
        street,
      });
    }
  });
}
frontage("north", [-96, -74, -52, -30, -8, 14, 36, 58, 80], -143, -1, [2, 6]);
frontage("north", [-96, -74, -52, -30, -8, 14, 36, 58, 80], -143, 1, [1, 5, 8]);
frontage("south", [-90, -66, -42, -18, 6, 30, 54, 78], 128, -1, [0, 3, 6]);
frontage("south", [-90, -66, -42, -18, 6, 30, 54, 78], 128, 1, [1, 4]);
TOWN_BUILDINGS.push(
  {
    id: "linden-library",
    name: "Linden library",
    x: 60,
    z: -195,
    w: 12,
    d: 12,
    angle: Math.PI,
    route: "trail",
    wall: 0xf1dfad,
    roof: 0x447c80,
    style: "hip",
    shop: true,
    sign: "LIBRARY",
    rooms: true,
    designed: true,
  },
  {
    id: "willow-workshop",
    name: "Willow motor workshop",
    x: -109,
    z: 110,
    w: 12,
    d: 12,
    angle: 0,
    street: "south",
    wall: 0xd9b88f,
    roof: 0x6c7980,
    style: "gable",
    shop: true,
    sign: "WORKSHOP",
    garage: true,
    designed: true,
  },
  {
    id: "manor",
    name: "Magnolia manor",
    x: 103,
    z: 16,
    w: 22,
    d: 18,
    angle: -Math.PI / 2,
    route: "trail",
    wall: 0xf1dfad,
    roof: 0x6b7690,
    style: "hip",
    storeys: 2,
    rooms: true,
    designed: true,
    porch: 5,
  },
  {
    id: "garden-cafe",
    name: "Garden cafe",
    x: 112,
    z: -26,
    w: 10,
    d: 9,
    angle: Math.PI,
    wall: 0xe0bbbc,
    roof: 0xad6c51,
    style: "gable",
    shop: true,
    sign: "GARDEN CAFE",
    designed: true,
  },
);
export const TOWN_ROAD_SPINES = [
  [
    [-108, -143],
    [-64, -143],
    [-8, -143],
    [54, -143],
    [118, -143],
  ],
  [
    [-112, 128],
    [-66, 128],
    [-6, 128],
    [60, 128],
    [119, 128],
  ],
  [
    [72, -28],
    [81, -16],
    [83, 14],
    [83, 39],
    [104, 42],
  ],
];
// A compact inner-west lane fills the gap between the old loop and its cottages.
for (const [i, z] of [-28, -52, -76, -100, -122].entries())
  TOWN_BUILDINGS.push({
    id: `elm-${i}`,
    name: `Elm lane ${i === 2 ? "family house" : "cottage"}`,
    x: -121,
    z,
    w: i === 2 ? 12 : 9,
    d: i === 2 ? 12 : 9,
    angle: -Math.PI / 2,
    wall: walls[i % 6],
    roof: roofs[i % 4],
    style: i % 2 ? "hip" : "gable",
    storeys: i === 2 ? 2 : 1,
    rooms: true,
    designed: true,
    street: "elm",
  });
TOWN_LOTS.push({
  id: "elm-lot",
  x: -150,
  z: -98,
  w: 12,
  d: 14,
  angle: Math.PI / 2,
  street: "elm",
  roadX: -137,
  subtle: true,
});
TOWN_ROAD_SPINES.push([
  [-137, -132],
  [-137, -90],
  [-137, -45],
  [-137, -9],
  [-146, 10],
]);
export const PARK_PATHS = [
  [
    [73, 62],
    [80, 66],
  ],
  [
    [80, 52],
    [84, 52],
  ],
  [
    [53, 25],
    [53, 36],
    [53, 56],
    [65, 62],
    [73, 56],
    [80, 52],
  ],
  [
    [53, 36],
    [61, 34],
    [76, 34],
    [80, 41],
    [80, 52],
  ],
  [
    [65, 62],
    [65, 45],
  ],
  [
    [197, 98],
    [185, 96],
    [181, 82],
    [185, 69],
    [197, 65],
    [208, 72],
    [210, 86],
    [206, 96],
    [197, 98],
  ],
  [
    [185, 96],
    [197, 84],
    [208, 72],
  ],
];
export const NEW_LANDMARKS = [
  {
    id: "linden",
    name: "Linden street",
    icon: "⌂",
    x: -30,
    z: -143,
    color: "#b7a48a",
    signX: -113,
    signZ: -150,
  },
  {
    id: "willow-street",
    name: "Willow street",
    icon: "⌂",
    x: -18,
    z: 128,
    color: "#aebf90",
    signX: -118,
    signZ: 136,
  },
  {
    id: "manor",
    name: "Magnolia manor",
    icon: "♜",
    x: 103,
    z: 16,
    color: "#cfbc97",
    signX: 88,
    signZ: 29,
  },
];

// Pinched collector corners use smaller setbacks/lots rather than clipping roads.
const omit = TOWN_BUILDINGS.findIndex((h) => h.id === "north-n-0");
TOWN_BUILDINGS.splice(omit, 1);
for (const id of ["north-n-1", "north-n-8"])
  TOWN_BUILDINGS.find((h) => h.id === id).z = -154;
TOWN_BUILDINGS.find((h) => h.id === "south-s-0").x = -86;
