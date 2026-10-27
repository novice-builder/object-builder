import { bodyBox, cellBox, overlaps } from "./core.js";
import { doorSolidAt } from "./door-geometry.js";
const HALF_PI = Math.PI / 2,
  SPEED = HALF_PI / 0.65;
export const DOOR_OPEN_DISTANCE = 2.25,
  DOOR_HOLD_DISTANCE = 3.1,
  DOOR_CLOSE_DELAY = 1.2;
export function initializeDoor(d, open = false, swing = -1) {
  Object.assign(d, {
    open,
    targetOpen: open,
    swing,
    angle: open ? swing * HALF_PI : 0,
    leaveSince: null,
    manualHold: false,
    lastAttempt: -Infinity,
    blocked: false,
  });
  d.pivot.rotation.y = d.baseAngle + d.angle;
}
function near(d, p, radius) {
  return (
    Math.abs(p.y) < 2.3 &&
    Math.hypot(p.x - d.center.x, p.z - d.center.z) < radius
  );
}
export function sweepClear(d, from, to, p, blocks, staticSolids) {
  const n = Math.max(1, Math.ceil(Math.abs(to - from) / 0.02)),
    objects = [bodyBox(p), ...blocks.map(cellBox), ...staticSolids];
  for (let i = 0; i <= n; i++) {
    const shape = doorSolidAt(d, from + ((to - from) * i) / n);
    if (objects.some((b) => overlaps(shape, b))) return false;
  }
  return true;
}
export function requestDoor(
  d,
  opening,
  p,
  blocks,
  staticSolids = [],
  manual = false,
) {
  const from = d.angle ?? (d.open ? (d.swing ?? -1) * HALF_PI : 0);
  if (opening) {
    // Positive Y rotation opens toward the inside. Use the side opposite the player.
    const side =
      (p.x - d.center.x) * Math.sin(d.baseAngle) +
      (p.z - d.center.z) * Math.cos(d.baseAngle);
    const preferred =
      Math.abs(from) > 0.01 ? (d.swing ?? -1) : side >= 0 ? 1 : -1;
    for (const swing of Math.abs(from) > 0.01
      ? [preferred]
      : [preferred, -preferred]) {
      if (sweepClear(d, from, swing * HALF_PI, p, blocks, staticSolids)) {
        d.swing = swing;
        d.targetOpen = d.open = true;
        d.manualHold = manual;
        d.blocked = false;
        return { ok: true };
      }
    }
  } else if (sweepClear(d, from, 0, p, blocks, staticSolids)) {
    d.targetOpen = d.open = false;
    d.manualHold = manual;
    d.blocked = false;
    return { ok: true };
  }
  return {
    ok: false,
    message: opening
      ? "There is something in the door’s swing. Make room beside it."
      : "The door stays open while someone or something is in its way.",
  };
}
export function updateDoors(
  doors,
  p,
  blocks,
  staticSolids,
  automatic,
  now,
  dt,
) {
  let changed = false;
  for (const d of doors) {
    const closeBy = near(d, p, DOOR_HOLD_DISTANCE);
    if (closeBy) d.leaveSince = null;
    else {
      d.leaveSince ??= now;
      d.manualHold = false;
    }
    if (automatic && !d.manualHold && now - d.lastAttempt > 0.3) {
      if (near(d, p, DOOR_OPEN_DISTANCE) && !d.targetOpen) {
        d.lastAttempt = now;
        requestDoor(d, true, p, blocks, staticSolids);
      } else if (
        !closeBy &&
        d.targetOpen &&
        now - d.leaveSince > DOOR_CLOSE_DELAY
      ) {
        d.lastAttempt = now;
        requestDoor(d, false, p, blocks, staticSolids);
      }
    }
    const target = d.targetOpen ? d.swing * HALF_PI : 0;
    let remaining = target - d.angle;
    const travel =
      Math.sign(remaining) *
      Math.min(Math.abs(remaining), Math.max(0, dt) * SPEED);
    const steps = Math.max(1, Math.ceil(Math.abs(travel) / 0.02));
    for (let i = 0; i < steps && Math.abs(travel) > 1e-8; i++) {
      const next = d.angle + travel / steps;
      if (!sweepClear(d, d.angle, next, p, blocks, staticSolids)) {
        d.blocked = true;
        // A player returning during closing wins. Reopen safely on the next tick.
        if (!d.targetOpen) {
          d.targetOpen = d.open = true;
          d.manualHold = false;
          d.leaveSince = null;
        }
        break;
      }
      d.angle = next;
      d.blocked = false;
      changed = true;
    }
    d.pivot.rotation.y = d.baseAngle + d.angle;
  }
  return changed;
}
