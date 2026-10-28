import { WORLD, walkingSpeed } from "./world-config.js";
import { SpatialIndex } from "./spatial.js";
// World units are metres. Block coordinates are cell minima; player y is feet.
export const LIMIT = WORLD.halfSize,
  MAX_BLOCKS = WORLD.maxBlocks,
  RADIUS = 0.28,
  HEIGHT = 1.65;
export const COMMON = ["wood", "brick", "stone", "glass"];
export const SPECIAL = ["flowers", "lantern", "bench"];
export const ITEMS = [...COMMON, ...SPECIAL];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const key = (b) => `${b.x},${b.y},${b.z}`;
export const cellBox = (b) => {
  const angle = ((b.rotation || 0) * Math.PI) / 180,
    c = Math.abs(Math.cos(angle)),
    s = Math.abs(Math.sin(angle));
  const padX =
    b.type === "bench" ? Math.max(0, (0.94 * c + 0.64 * s - 1) / 2) : 0;
  const padZ =
    b.type === "bench" ? Math.max(0, (0.94 * s + 0.64 * c - 1) / 2) : 0;
  return {
    minX: b.x - padX,
    minY: b.y,
    minZ: b.z - padZ,
    maxX: b.x + 1 + padX,
    maxY: b.y + 1,
    maxZ: b.z + 1 + padZ,
  };
};
export const bodyBox = (p) => ({
  minX: p.x - RADIUS,
  minY: p.y + 0.001,
  minZ: p.z - RADIUS,
  maxX: p.x + RADIUS,
  maxY: p.y + HEIGHT,
  maxZ: p.z + RADIUS,
});
function rectangle(b) {
  return (
    b.obb ?? {
      cx: (b.minX + b.maxX) / 2,
      cz: (b.minZ + b.maxZ) / 2,
      c: 1,
      s: 0,
      halfW: (b.maxX - b.minX) / 2,
      halfD: (b.maxZ - b.minZ) / 2,
    }
  );
}
export function overlaps(a, b) {
  if (
    !(
      a.minX < b.maxX - 1e-5 &&
      a.maxX > b.minX + 1e-5 &&
      a.minY < b.maxY - 1e-5 &&
      a.maxY > b.minY + 1e-5 &&
      a.minZ < b.maxZ - 1e-5 &&
      a.maxZ > b.minZ + 1e-5
    )
  )
    return false;
  if (!a.obb && !b.obb) return true;
  const A = rectangle(a),
    B = rectangle(b),
    dx = B.cx - A.cx,
    dz = B.cz - A.cz;
  for (const [x, z] of [
    [A.c, -A.s],
    [A.s, A.c],
    [B.c, -B.s],
    [B.s, B.c],
  ]) {
    const ra =
      A.halfW * Math.abs(x * A.c - z * A.s) +
      A.halfD * Math.abs(x * A.s + z * A.c);
    const rb =
      B.halfW * Math.abs(x * B.c - z * B.s) +
      B.halfD * Math.abs(x * B.s + z * B.c);
    if (Math.abs(dx * x + dz * z) >= ra + rb - 1e-5) return false;
  }
  return true;
}
export const collides = (p, solids) =>
  solids.some((b) => overlaps(bodyBox(p), b));
export const HOME = { x: -14.4, y: 0, z: -1.2, yaw: 0, pitch: 0 };
export function freshState() {
  return {
    version: WORLD.saveVersion,
    world: WORLD.id,
    blocks: [],
    inventory: { flowers: 0, lantern: 0, bench: 0 },
    selected: "hand",
    player: { ...HOME },
    doors: {},
    doorSwings: {},
  };
}
export function supportHeight(p, solids) {
  let top = 0;
  for (const b of solids)
    if (
      b.maxY <= p.y + 0.02 &&
      b.maxY > top &&
      p.x + RADIUS > b.minX + 0.01 &&
      p.x - RADIUS < b.maxX - 0.01 &&
      p.z + RADIUS > b.minZ + 0.01 &&
      p.z - RADIUS < b.maxZ - 0.01
    )
      top = b.maxY;
  return top;
}
export function safeFooting(p, solids) {
  if (p.y <= 0.35) return true;
  // Four small probes under the player's feet. Adjacent blocks can jointly
  // support them, so seams are walkable while true platform edges stop motion.
  return [-0.12, 0.12].every((dx) =>
    [-0.12, 0.12].every((dz) =>
      solids.some((b) => {
        if (b.maxY > p.y + 0.025 || b.maxY < p.y - 0.3) return false;
        const probe = {
          minX: p.x + dx - 0.001,
          maxX: p.x + dx + 0.001,
          minZ: p.z + dz - 0.001,
          maxZ: p.z + dz + 0.001,
          minY: b.maxY - 0.003,
          maxY: b.maxY + 0.003,
        };
        return overlaps(probe, b);
      }),
    ),
  );
}
function recoveryDistance(p, solids) {
  let distance = Infinity;
  for (const b of solids) {
    if (b.maxY > p.y + 0.025 || b.maxY < p.y - 0.3) continue;
    const dx = Math.max(b.minX + 0.12 - p.x, 0, p.x - (b.maxX - 0.12));
    const dz = Math.max(b.minZ + 0.12 - p.z, 0, p.z - (b.maxZ - 0.12));
    distance = Math.min(distance, dx * dx + dz * dz);
  }
  return distance;
}
export function movePlayer(p, input, dt, solids) {
  // Fixed small substeps prevent tunnelling at low frame rates. No step teleporting.
  const steps = Math.ceil(Math.min(dt, 0.1) / 0.012),
    h = Math.min(dt, 0.1) / steps;
  const speed = walkingSpeed(input.walkSpeed);
  let f = clamp(input.forward || 0, -1, 1),
    s = clamp(input.right || 0, -1, 1),
    n = Math.max(1, Math.hypot(f, s));
  const dx = ((-Math.sin(p.yaw) * f + Math.cos(p.yaw) * s) * speed) / n;
  const dz = ((-Math.cos(p.yaw) * f - Math.sin(p.yaw) * s) * speed) / n;
  for (let i = 0; i < steps; i++) {
    const support = supportHeight(p, solids);
    if ((p.vy || 0) <= 0 && p.y >= support - 0.002 && p.y - support < 0.035) {
      p.y = support;
      p.vy = 0;
      p.grounded = true;
    }
    for (const [axis, speed] of [
      ["x", dx],
      ["z", dz],
    ]) {
      const old = p[axis];
      p[axis] = clamp(old + speed * h, -LIMIT + 0.4, LIMIT - 0.4);
      if (collides(p, solids)) p[axis] = old;
      if (
        input.edgeProtection &&
        p.grounded &&
        !input.allowDrop &&
        p.y > 0.35 &&
        !safeFooting(p, solids)
      ) {
        const before = { ...p, [axis]: old };
        // A jump can land with partial overhang. Permit recovery toward support,
        // rather than freezing the player just outside the safe walking region.
        if (
          safeFooting(before, solids) ||
          recoveryDistance(p, solids) >= recoveryDistance(before, solids) - 1e-6
        )
          p[axis] = old;
      }
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
    const floor = supportHeight(p, solids);
    if (p.vy <= 0 && p.y >= floor - 0.002 && p.y - floor < 0.035) {
      p.y = floor;
      p.vy = 0;
      p.grounded = true;
    }
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
    b.y >= WORLD.buildHeight
  )
    return "Build inside the world, up to 24 blocks high";
  if (state.blocks.length >= MAX_BLOCKS)
    return "Your world is full. Remove a piece to make room";
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
    ![1, 2, WORLD.saveVersion].includes(data.version) ||
    (data.version === WORLD.saveVersion && data.world !== WORLD.id) ||
    (data.version === 2 && data.world !== "little-block-world-04") ||
    !Array.isArray(data.blocks) ||
    data.blocks.length > MAX_BLOCKS
  )
    throw Error("This is not a supported BlockWorld save");
  const legacy = data.version === 1,
    old04 = data.version === 2;
  if (legacy && data.blocks.length > 800)
    throw Error("Older saves support up to 800 pieces");
  const s = freshState(),
    seen = new Set(),
    blockIndex = new SpatialIndex(4),
    staticIndex = new SpatialIndex();
  for (const b of staticSolids) staticIndex.add(b);
  for (const b of data.blocks) {
    if (
      !b ||
      !ITEMS.includes(b.type) ||
      ![b.x, b.y, b.z].every(Number.isInteger) ||
      b.y < 0 ||
      b.y >= WORLD.buildHeight ||
      b.x < -LIMIT ||
      b.x >= LIMIT ||
      b.z < -LIMIT ||
      b.z >= LIMIT ||
      (legacy &&
        (Math.abs(b.x) > 31 ||
          b.x === 31 ||
          Math.abs(b.z) > 31 ||
          b.z === 31 ||
          b.y > 9)) ||
      (old04 && (b.x < -125 || b.x >= 125 || b.z < -125 || b.z >= 125)) ||
      seen.has(key(b))
    )
      throw Error("The save contains an invalid piece");
    if (staticIndex.query(cellBox(b)).some((a) => overlaps(cellBox(b), a)))
      throw Error("A saved piece overlaps the neighborhood");
    const shape = cellBox(b);
    if (blockIndex.query(shape).some((a) => overlaps(shape, a)))
      throw Error("Saved pieces overlap");
    blockIndex.add(shape);
    seen.add(key(b));
    const rotation = b.rotation ?? 0;
    if (!Number.isFinite(rotation) || Math.abs(rotation) > 36000)
      throw Error("The piece rotation is invalid");
    s.blocks.push({
      x: b.x,
      y: b.y,
      z: b.z,
      type: b.type,
      ...(SPECIAL.includes(b.type)
        ? { rotation: ((rotation % 360) + 360) % 360 }
        : {}),
    });
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
    p.y <= WORLD.buildHeight + 2
  ) {
    s.player = {
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw % (Math.PI * 2),
      pitch: clamp(p.pitch, -1.3, 1.3),
    };
  }
  if (data.selected === "hand" || ITEMS.includes(data.selected))
    s.selected = data.selected;
  // Door names are allow-listed by the world, never trusted as object properties.
  for (const id of Object.keys(data.doors || {}).filter(
    (id) =>
      /^[a-z][a-z0-9-]{0,39}$/.test(id) &&
      !["constructor", "prototype"].includes(id),
  )) {
    s.doors[id] = data.doors?.[id] === true;
    s.doorSwings[id] = data.doorSwings?.[id] === 1 ? 1 : -1;
  }
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
