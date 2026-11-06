/** New permanent outdoor footprints belong only to explicit layout9/new records. */
export const OAKFIELD = { id: "oakfield", name: "Oakfield", x: 138, z: 52 };
export const OAKFIELD_ROADS = [
  {
    points: [
      [105, 16],
      [113, 24],
      [119, 31],
      [126, 37],
      [132, 44],
      [138, 51],
      [139, 59],
      [138, 65],
    ],
    width: 3,
  },
  {
    points: [
      [78, 52],
      [78, 43],
      [84, 37],
      [95, 35],
      [115, 34],
      [126, 37],
    ],
    width: 2.6,
  },
  {
    points: [
      [138, 65],
      [129, 68],
      [118, 67],
    ],
    width: 2.2,
  },
  {
    points: [
      [138, 51],
      [138, 46],
    ],
    width: 2.4,
  },
];
export const OAKFIELD_BUILDINGS = [
  {
    asset: "building_home_B_green",
    x: 127,
    z: 48,
    scale: 6.8,
    yaw: Math.PI / 2,
  },
  { asset: "building_tavern_blue", x: 151, z: 51, scale: 7, yaw: -Math.PI / 2 },
  {
    asset: "building_home_A_blue",
    x: 128,
    z: 62,
    scale: 6.5,
    yaw: Math.PI / 2,
  },
  {
    asset: "building_home_A_green",
    x: 151,
    z: 64,
    scale: 6.5,
    yaw: -Math.PI / 2,
  },
  {
    asset: "building_blacksmith_blue",
    x: 139,
    z: 69,
    scale: 6.5,
    yaw: Math.PI,
  },
  { asset: "building_home_A_green", x: 118, z: 62, scale: 6.5, yaw: 0 },
  { asset: "building_market_blue", x: 139, z: 42, scale: 6.2, yaw: 0 },
];
export const OAKFIELD_GARDENS = [
  [123, 47],
  [124, 62],
  [147, 59],
  [149, 68],
  [136, 71],
  [119, 58],
];
export const OAKFIELD_GROVE = [
  [112, 69],
  [118, 72],
  [112, 75],
  [124, 74],
];
/** An intentional town/garden clearing, with an authored small oak grove at its edge. */
export const oakfieldClearing = (x: number, z: number) =>
  x > 108 && x < 158 && z > 36 && z < 78;
