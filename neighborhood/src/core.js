// World units are metres. Block coordinates are cell minima; player y is feet.
export const LIMIT = 31,
  MAX_BLOCKS = 800,
  RADIUS = 0.28,
  HEIGHT = 1.65;
export const COMMON = ["wood", "brick", "stone", "glass"];
export const SPECIAL = ["flowers", "lantern", "bench"];
export const ITEMS = [...COMMON, ...SPECIAL];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const key = (b) => `${b.x},${b.y},${b.z}`;
export const cellBox = (b) => ({
  minX: b.x,
  minY: b.y,
  minZ: b.z,
  maxX: b.x + 1,
  maxY: b.y + 1,
  maxZ: b.z + 1,
});
export const bodyBox = (p) => ({
  minX: p.x - RADIUS,
  minY: p.y + 0.001,
  minZ: p.z - RADIUS,
  maxX: p.x + RADIUS,
  maxY: p.y + HEIGHT,
  maxZ: p.z + RADIUS,
});
export const overlaps = (a, b) =>
  a.minX < b.maxX - 1e-5 &&
  a.maxX > b.minX + 1e-5 &&
  a.minY < b.maxY - 1e-5 &&
  a.maxY > b.minY + 1e-5 &&
  a.minZ < b.maxZ - 1e-5 &&
  a.maxZ > b.minZ + 1e-5;
export const collides = (p, solids) =>
  solids.some((b) => overlaps(bodyBox(p), b));
export const HOME = { x: -14.4, y: 0, z: -1.2, yaw: 0, pitch: 0 };
export function freshState() {
  return {
    version: 1,
    blocks: [],
    inventory: { flowers: 0, lantern: 0, bench: 0 },
    selected: "wood",
    player: { ...HOME },
    doors: {},
  };
}
export function movePlayer(p, input, dt, solids) {
  // Fixed small substeps prevent tunnelling at low frame rates. No step teleporting.
  const steps = Math.ceil(Math.min(dt, 0.1) / 0.012),
    h = Math.min(dt, 0.1) / steps;
  let f = clamp(input.forward || 0, -1, 1),
    s = clamp(input.right || 0, -1, 1),
    n = Math.max(1, Math.hypot(f, s));
  const dx = ((-Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) * 3.4) / n;
  const dz = ((-Math.cos(p.yaw) * f - Math.sin(p.yaw) * s) * 3.4) / n;
  for (let i = 0; i < steps; i++) {
    for (const [axis, speed] of [
      ["x", dx],
      ["z", dz],
    ]) {
      const old = p[axis];
      p[axis] = clamp(old + speed * h, -LIMIT + 0.4, LIMIT - 0.4);
      if (collides(p, solids)) p[axis] = old;
    }
    p.vy = (p.vy || 0) - 16 * h;
    const oldY = p.y;
    p.y += p.vy * h;
    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
    } else if (collides(p, solids)) {
      // Resolve precisely onto the nearest crossed top/bottom surface.
      const hits = solids.filter((b) => overlaps(bodyBox(p), b));
      if (p.vy < 0) {
        p.y = Math.max(...hits.map((b) => b.maxY));
        p.grounded = true;
      } else {
        p.y = Math.min(...hits.map((b) => b.minY)) - HEIGHT - 0.002;
        p.grounded = false;
      }
      if (p.y < 0 || collides(p, solids)) p.y = oldY;
      p.vy = 0;
    } else p.grounded = false;
  }
}
export function placementReason(
  b,
  state,
  staticSolids,
  player,
  checkReach = true,
) {
  if (!b || !ITEMS.includes(b.type) || ![b.x, b.y, b.z].every(Number.isInteger))
    return "Choose a building piece";
  if (
    b.x < -LIMIT ||
    b.x >= LIMIT ||
    b.z < -LIMIT ||
    b.z >= LIMIT ||
    b.y < 0 ||
    b.y > 9
  )
    return "Build inside the garden, up to ten blocks high";
  if (state.blocks.length >= MAX_BLOCKS)
    return "Your garden is full. Remove a piece to make room";
  const bb = cellBox(b);
  if (
    staticSolids.some((s) => overlaps(bb, s)) ||
    state.blocks.some((s) => overlaps(bb, cellBox(s)))
  )
    return "Find a clear space";
  if (player && overlaps(bb, bodyBox(player))) return "Take a little step back";
  if (
    checkReach &&
    player &&
    Math.hypot(
      b.x + 0.5 - player.x,
      b.y + 0.5 - player.y,
      b.z + 0.5 - player.z,
    ) > 6
  )
    return "Move a little closer";
  if (
    b.y > 0 &&
    !state.blocks.some(
      (s) =>
        Math.abs(s.x - b.x) + Math.abs(s.y - b.y) + Math.abs(s.z - b.z) === 1,
    )
  )
    return "Join this piece to another block";
  if (SPECIAL.includes(b.type) && state.inventory[b.type] <= 0)
    return "Make this at your crafting table";
  return "";
}
export function validateSave(data, staticSolids = []) {
  if (
    !data ||
    data.version !== 1 ||
    !Array.isArray(data.blocks) ||
    data.blocks.length > MAX_BLOCKS
  )
    throw Error("This is not a supported BlockWorld save");
  const s = freshState(),
    seen = new Set();
  for (const b of data.blocks) {
    if (
      !b ||
      !ITEMS.includes(b.type) ||
      ![b.x, b.y, b.z].every(Number.isInteger) ||
      b.y < 0 ||
      b.y > 9 ||
      b.x < -LIMIT ||
      b.x >= LIMIT ||
      b.z < -LIMIT ||
      b.z >= LIMIT ||
      seen.has(key(b))
    )
      throw Error("The save contains an invalid piece");
    if (staticSolids.some((a) => overlaps(cellBox(b), a)))
      throw Error("A saved piece overlaps the neighborhood");
    seen.add(key(b));
    s.blocks.push({ x: b.x, y: b.y, z: b.z, type: b.type });
  }
  for (const t of SPECIAL) {
    const v = data.inventory?.[t] ?? 0;
    if (!Number.isInteger(v) || v < 0 || v > 999)
      throw Error("The inventory is invalid");
    s.inventory[t] = v;
  }
  const p = data.player;
  if (
    p &&
    ["x", "y", "z", "yaw", "pitch"].every((k) => Number.isFinite(p[k])) &&
    Math.abs(p.x) < LIMIT &&
    Math.abs(p.z) < LIMIT &&
    p.y >= 0 &&
    p.y <= 11
  ) {
    s.player = {
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw % (Math.PI * 2),
      pitch: clamp(p.pitch, -1.3, 1.3),
    };
  }
  if (ITEMS.includes(data.selected)) s.selected = data.selected;
  // Door names are allow-listed by the world, never trusted as object properties.
  for (const id of ["home", "peach", "sage", "rose"])
    s.doors[id] = data.doors?.[id] === true;
  if (collides(s.player, [...staticSolids, ...s.blocks.map(cellBox)]))
    s.player = { ...HOME };
  return s;
}
export class BuildHistory {
  constructor() {
    this.past = [];
  }
  record(action) {
    this.past.push(action);
    if (this.past.length > 50) this.past.shift();
  }
  undo(state, player, solids) {
    const a = this.past.at(-1);
    if (!a) return false;
    if (
      a.kind === "remove" &&
      (overlaps(cellBox(a.block), bodyBox(player)) ||
        solids.some((b) => overlaps(cellBox(a.block), b)))
    )
      return false;
    if (a.kind === "place") {
      const i = state.blocks.findIndex((b) => key(b) === key(a.block));
      if (i < 0) return false;
      state.blocks.splice(i, 1);
      if (SPECIAL.includes(a.block.type)) state.inventory[a.block.type]++;
    } else {
      state.blocks.push({ ...a.block });
      if (SPECIAL.includes(a.block.type)) state.inventory[a.block.type]--;
    }
    this.past.pop();
    return true;
  }
}
