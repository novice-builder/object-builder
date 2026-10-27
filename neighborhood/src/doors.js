import { bodyBox, cellBox, overlaps } from "./core.js";
import { doorBox } from "./world.js";
// Keep the panel solid; choose the other hinge direction if the usual open
// position is occupied. Never move the player or close on someone in the doorway.
export function doorOperation(door, player, blocks) {
  const opening = !door.open,
    preferred = door.swing ?? -1;
  for (const swing of opening ? [preferred, -preferred] : [preferred]) {
    const next = doorBox(door, opening, swing);
    if (
      !overlaps(bodyBox(player), next) &&
      !blocks.some((b) => overlaps(cellBox(b), next))
    )
      return { ok: true, open: opening, swing };
  }
  return {
    ok: false,
    message: opening
      ? "Make a little room beside the door."
      : "Step clear of the doorway to close it.",
  };
}
