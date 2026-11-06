import { valeRivers } from "./vale-data";
import { NORTH_CROSSING } from "./crossings";
const bx = valeRivers(NORTH_CROSSING.z)[1];
/** An irregular mill hamlet and second woodland/meadow route, only in explicit layout 6. */
export const REEDBANK = { id: "reedbank", name: "Reedbank", x: 12, z: -52 };
export const REEDBANK_ROADS = [
  {
    points: [
      [18, -27],
      [13, -35],
      [12, -44],
      [12, -52],
      [15, -60],
      [16, -66],
      [18, -71],
      [22, -72],
    ],
    width: 2.8,
  },
  {
    points: [
      [12, -51],
      [3, -49],
      [-8, -46],
      [-8, -40],
      [-14, -36],
      [-23, -38],
    ],
    width: 2.4,
  },
  {
    points: [
      [12, -52],
      [bx - 5, NORTH_CROSSING.z],
    ],
    width: 2.8,
  },
  {
    points: [
      [bx + 5, NORTH_CROSSING.z],
      [46, -48],
      [57, -42],
      [75, -39],
      [94, -31],
      [105, -24],
      [113, -18],
      [116, -11],
      [119, -11],
    ],
    width: 2.8,
  },
];
export const REEDBANK_BUILDINGS = [
  { asset: "building_home_B_blue", x: 4, z: -43, scale: 7, yaw: Math.PI / 2 },
  {
    asset: "building_home_A_green",
    x: 4,
    z: -56,
    scale: 6.8,
    yaw: Math.PI / 2,
  },
  { asset: "building_home_A_blue", x: 8, z: -69, scale: 6.8, yaw: 0 },
  {
    asset: "building_home_B_green",
    x: 18.8,
    z: -41,
    scale: 7,
    yaw: -Math.PI / 2,
  },
  { asset: "building_blacksmith_blue", x: -10, z: -56, scale: 6.8, yaw: 0 },
  {
    asset: "building_watermill_blue",
    x: 24.8,
    z: -66,
    scale: 6.5,
    yaw: Math.PI,
  },
];
export const REEDBANK_GARDENS = [
  [1, -41],
  [1, -59],
  [9, -71],
  [21, -39],
  [-13, -52],
  [19, -60],
];
