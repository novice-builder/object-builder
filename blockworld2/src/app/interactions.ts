export interface Interaction {
  id: string;
  kind: "object" | "seat" | "door" | "vehicle" | "agent" | "aircraft";
  x: number;
  y: number;
  z: number;
  range: number;
  icon: string;
  label: string;
  data: any;
}
export function chooseInteraction(
  player: any,
  targets: Interaction[],
  clear: (target: Interaction) => boolean,
) {
  return targets
    .filter(
      (t) =>
        Math.abs(t.y - player.y) < 1.8 &&
        Math.hypot(t.x - player.x, t.z - player.z) < t.range,
    )
    .sort(
      (a, b) =>
        Math.hypot(a.x - player.x, a.z - player.z) -
        Math.hypot(b.x - player.x, b.z - player.z),
    )
    .find(clear);
}
