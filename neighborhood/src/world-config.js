import { NEW_LANDMARKS } from "./town-06.js";
import { OUTER_LANDMARKS } from "./expansion-05.js";
// Shared metres-based limits: generation, physics, saves, rendering and map.
export const WORLD = Object.freeze({
  id: "little-block-world-06",
  saveVersion: 4,
  halfSize: 250,
  buildHeight: 24,
  maxBlocks: 12000,
  maxSaveBytes: 4000000,
  chunkSize: 24,
  fogNear: 75,
  fogFar: 155,
  cameraFar: 190,
  saveKey: "blockworld.neighborhood.06",
  preferencesKey: "blockworld.neighborhood.controls.v6",
});
export const WALK_SPEEDS = Object.freeze({
  normal: 3.4,
  quick: 5.1,
  fast: 6.8,
});
export const walkingSpeed = (preset) =>
  typeof WALK_SPEEDS[preset] === "number"
    ? WALK_SPEEDS[preset]
    : WALK_SPEEDS.normal;
export const LANDMARKS = [
  { id: "home", name: "Home", icon: "⌂", x: -14.4, z: -1.2, color: "#cc9168" },
  {
    id: "village",
    name: "Village square",
    icon: "▥",
    x: 49,
    z: -26,
    color: "#d9ac68",
  },
  { id: "park", name: "Play park", icon: "⚑", x: 65, z: 45, color: "#7aa276" },
  {
    id: "pond",
    name: "Willow pond",
    icon: "≈",
    x: 18,
    z: -101,
    color: "#72aebc",
  },
  {
    id: "woods",
    name: "Woodland walk",
    icon: "♠",
    x: -65,
    z: -103,
    color: "#528969",
  },
  {
    id: "meadow",
    name: "Building meadow",
    icon: "▦",
    x: -59,
    z: 61,
    color: "#a9b774",
  },
  {
    id: "orchard",
    name: "Orchard picnic",
    icon: "●",
    x: 81,
    z: 94,
    color: "#b89c78",
  },
  ...OUTER_LANDMARKS,
  ...NEW_LANDMARKS,
];
