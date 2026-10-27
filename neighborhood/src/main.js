import * as T from "three";
import {
  COMMON,
  SPECIAL,
  ITEMS,
  HOME,
  HEIGHT,
  MAX_BLOCKS,
  clamp,
  key,
  cellBox,
  bodyBox,
  overlaps,
  collides,
  freshState,
  movePlayer,
  placementReason,
  validateSave,
  BuildHistory,
} from "./core.js";
import { makeWorld, doorBox } from "./world.js";
import { icons, names } from "./icons.js";
import { Voice } from "./dialogue.js";
import { blockTexture } from "./textures.js";
import { installTouchButtons } from "./touch-buttons.js";
import { installWorldGestures } from "./gestures.js";
import { detailedPiece } from "./pieces.js";
import { initializeDoor, requestDoor, updateDoors } from "./doors.js";
const $ = (id) => document.getElementById(id),
  SAVE_KEY = "blockworld.neighborhood.01",
  bootStart = performance.now();
function fail(message) {
  $("fatal").hidden = false;
  $("fatalMessage").textContent = message;
  $("welcome").hidden = true;
}
let renderer;
try {
  renderer = new T.WebGLRenderer({
    canvas: $("world"),
    antialias: false,
    powerPreference: "low-power",
  });
} catch (e) {
  fail(
    "This browser could not start WebGL. Try opening the downloaded HTML in recent Chrome.",
  );
  throw e;
}
const scene = new T.Scene();
scene.background = new T.Color(0xb5d9df);
scene.fog = new T.Fog(0xb5d9df, 42, 93);
scene.add(new T.HemisphereLight(0xfff7df, 0x6a8970, 2.3));
const sun = new T.DirectionalLight(0xffe5b1, 1.9);
sun.position.set(-25, 40, 18);
scene.add(sun);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
renderer.setSize(innerWidth, innerHeight);
const camera = new T.PerspectiveCamera(67, innerWidth / innerHeight, 0.06, 110);
camera.rotation.order = "YXZ";
const world = makeWorld(scene);
let state = freshState(),
  player = { ...HOME, vy: 0, grounded: true },
  history = new BuildHistory(),
  started = false,
  modal = "welcome",
  pending = null,
  worldGestures = null,
  target = null,
  aim = null,
  saveOK = true,
  dirty = false,
  lastSave = 0,
  lastRebuild = 0,
  lastStats = {},
  highQuality = false;
let saveTimer;
const keys = new Set(),
  stick = { x: 0, y: 0 };
let joyPointer = null,
  returnFocus = null,
  lastContextSignature = null,
  lastPaletteSelection = null;
const PREFS_KEY = "blockworld.neighborhood.controls.v3";
const preferences = {
  placement: "direct",
  automaticDoors: true,
  edgeProtection: true,
  quality: false,
  subtitles: true,
};
try {
  const raw = localStorage.getItem(PREFS_KEY);
  const saved = JSON.parse(
    raw || localStorage.getItem("blockworld.neighborhood.controls.v2") || "{}",
  );
  for (const k of ["quality", "subtitles"])
    if (typeof saved[k] === "boolean") preferences[k] = saved[k];
  if (raw)
    for (const k of ["edgeProtection", "automaticDoors"])
      if (typeof saved[k] === "boolean") preferences[k] = saved[k];
  if (saved.placement === "crosshair") preferences.placement = "crosshair";
} catch {}
function savePreferences() {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  } catch {
    settingsFeedback(
      "Controls updated for this session; this browser cannot remember settings here.",
    );
  }
}
function settingsFeedback(text) {
  $("settingsFeedback").textContent = text;
}
function ndcAt(x, y) {
  return new T.Vector2((x / innerWidth) * 2 - 1, 1 - (y / innerHeight) * 2);
}

const dynamicGroup = new T.Group();
scene.add(dynamicGroup);
let dynamicRayMeshes = [];
const commonGeometry = new T.BoxGeometry(1, 1, 1);
const paletteColors = {
  wood: 0xbd9567,
  brick: 0xc78264,
  stone: 0x9ca9a5,
  glass: 0x9bcbd0,
  flowers: 0xdd9b83,
  lantern: 0xe9be66,
  bench: 0xab7a50,
};
const buildMaterials = Object.fromEntries(
  ITEMS.map((t) => [
    t,
    new T.MeshLambertMaterial(
      COMMON.includes(t)
        ? { map: blockTexture(t) }
        : { color: paletteColors[t] },
    ),
  ]),
);
const decorMaterials = new Map();
function decorMat(c) {
  if (!decorMaterials.has(c))
    decorMaterials.set(c, new T.MeshLambertMaterial({ color: c }));
  return decorMaterials.get(c);
}
function notice(text) {
  $("toast").textContent = text;
  $("toast").style.opacity = 1;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => ($("toast").style.opacity = 0), 3600);
}
const voice = new Voice(notice);
voice.subtitles = preferences.subtitles;
function syncPlayer() {
  state.player = {
    x: player.x,
    y: player.y,
    z: player.z,
    yaw: player.yaw,
    pitch: player.pitch,
  };
  state.doorSwings ??= {};
  for (const d of world.doors) {
    state.doors[d.id] = d.open;
    state.doorSwings[d.id] = d.swing ?? -1;
  }
}
function save() {
  clearTimeout(saveTimer);
  syncPlayer();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveOK = true;
    $("saved").textContent = "Saved ✓";
    $("saveStatus").textContent =
      "Progress saved on this browser. Export a backup to keep it safe.";
  } catch {
    saveOK = false;
    $("saved").textContent = "Export to save";
    $("saveStatus").textContent =
      "This browser cannot save here. Use Export save before closing.";
  }
  dirty = false;
  lastSave = performance.now();
  return saveOK;
}
function scheduleSave() {
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 350);
}
let solidCache = [];
function rebuildSolids() {
  solidCache = [
    ...world.solids,
    ...world.doors.map((d) => doorBox(d)),
    ...state.blocks.map((b) => ({
      ...cellBox(b),
      step: COMMON.includes(b.type),
    })),
  ];
}
function applyState(next) {
  cancelPlacement();
  state = next;
  player = { ...state.player, vy: 0, grounded: state.player.y === 0 };
  for (const d of world.doors) {
    initializeDoor(
      d,
      state.doors[d.id] === true,
      state.doorSwings?.[d.id] === 1 ? 1 : -1,
    );
  }
  history = new BuildHistory();
  rebuildSolids();
  if (collides(player, solidCache)) player = { ...HOME, vy: 0, grounded: true };
  rebuildPieces();
  updatePalette();
}
function restore() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch {
    saveOK = false;
  }
  if (raw) {
    try {
      applyState(validateSave(JSON.parse(raw), world.solids));
    } catch {
      notice(
        "The last save could not be read. Your exported backups can still be imported.",
      );
      applyState(freshState());
    }
  } else applyState(state);
}
function rebuildPieces() {
  const start = performance.now();
  dynamicGroup.traverse((m) => {
    if (m.isInstancedMesh) m.dispose();
  });
  dynamicGroup.clear();
  dynamicRayMeshes = [];
  // One cube draw call per material. Geometry/materials are shared, never rebuilt per frame.
  const dummy = new T.Object3D();
  for (const type of COMMON) {
    const blocks = state.blocks.filter((b) => b.type === type);
    if (!blocks.length) continue;
    const mesh = new T.InstancedMesh(
      commonGeometry,
      buildMaterials[type],
      blocks.length,
    );
    blocks.forEach((b, i) => {
      dummy.position.set(b.x + 0.5, b.y + 0.5, b.z + 0.5);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.userData.blocks = blocks;
    mesh.computeBoundingSphere();
    dynamicGroup.add(mesh);
    dynamicRayMeshes.push(mesh);
  }
  for (const b of state.blocks.filter((b) => SPECIAL.includes(b.type))) {
    const group = detailedPiece(b, commonGeometry, decorMat);
    dynamicGroup.add(group);
    group.traverse((m) => {
      if (m.isMesh) dynamicRayMeshes.push(m);
    });
  }
  dynamicGroup.updateMatrixWorld(true);
  rebuildSolids();
  lastRebuild = performance.now() - start;
}
const ghost = new T.Mesh(
  new T.BoxGeometry(1.015, 1.015, 1.015),
  new T.MeshBasicMaterial({
    color: 0xe7df8e,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  }),
);
scene.add(ghost);
ghost.visible = false;
const outline = new T.LineSegments(
  new T.EdgesGeometry(new T.BoxGeometry(1.025, 1.025, 1.025)),
  new T.LineBasicMaterial({ color: 0xfff4c9 }),
);
scene.add(outline);
outline.visible = false;
const ray = new T.Raycaster(),
  center = new T.Vector2();
ray.far = 7;
function updateCamera() {
  camera.position.set(player.x, player.y + 1.53, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  camera.updateMatrixWorld();
}
function targetAt(ndc = center) {
  updateCamera();
  scene.updateMatrixWorld();
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects([...dynamicRayMeshes, world.ground], false);
  target = null;
  aim = null;
  for (const hit of hits) {
    // Static walls/doors occlude building rays even though they cannot be removed.
    if (
      world.solids.some((s) => rayBoxNear(ray.ray, s) < hit.distance - 0.02) ||
      world.doors.some(
        (d) => rayBoxNear(ray.ray, doorBox(d)) < hit.distance - 0.02,
      )
    )
      break;
    const b =
      hit.object.userData.blocks?.[hit.instanceId] || hit.object.userData.block;
    if (b) {
      target = b;
      const normal = hit.face.normal
        .clone()
        .transformDirection(hit.object.matrixWorld);
      if (hit.object.isInstancedMesh) {
        /* cube instances have translation only */
      }
      const point = hit.point.clone().addScaledVector(normal, 0.015);
      aim = {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
        z: Math.floor(point.z),
        type: state.selected,
      };
      // Detailed pieces occupy one cell, so extending them snaps from the cell face.
      if (SPECIAL.includes(b.type)) {
        const ax = ["x", "y", "z"].sort(
          (a, c) => Math.abs(normal[c]) - Math.abs(normal[a]),
        )[0];
        aim = { ...b, type: state.selected };
        aim[ax] += Math.sign(normal[ax]);
      }
    } else {
      aim = {
        x: Math.floor(hit.point.x),
        y: 0,
        z: Math.floor(hit.point.z),
        type: state.selected,
      };
    }
    break;
  }
  return { target, aim };
}
const tempBox = new T.Box3(),
  tempHit = new T.Vector3();
function rayBoxNear(r, b) {
  if (b.obb) {
    const o = b.obb,
      dx = r.origin.x - o.cx,
      dz = r.origin.z - o.cz;
    const local = new T.Ray(
      new T.Vector3(dx * o.c - dz * o.s, r.origin.y, dx * o.s + dz * o.c),
      new T.Vector3(
        r.direction.x * o.c - r.direction.z * o.s,
        r.direction.y,
        r.direction.x * o.s + r.direction.z * o.c,
      ),
    );
    tempBox.min.set(-o.halfW, b.minY, -o.halfD);
    tempBox.max.set(o.halfW, b.maxY, o.halfD);
    const hit = local.intersectBox(tempBox, tempHit);
    return hit ? local.origin.distanceTo(hit) : Infinity;
  }
  tempBox.min.set(b.minX, b.minY, b.minZ);
  tempBox.max.set(b.maxX, b.maxY, b.maxZ);
  const hit = r.intersectBox(tempBox, tempHit);
  return hit ? r.origin.distanceTo(hit) : Infinity;
}
const previewGroup = new T.Group();
scene.add(previewGroup);
const previewMaterials = new Map();
function previewMat(color) {
  if (!previewMaterials.has(color))
    previewMaterials.set(
      color,
      new T.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      }),
    );
  return previewMaterials.get(color);
}
function placementObstacles() {
  return [...world.solids, ...world.doors.map((d) => doorBox(d))];
}
function commitPiece(b) {
  const reason = placementReason(b, state, placementObstacles(), player);
  if (reason) {
    notice(reason);
    return false;
  }
  const piece = { ...b };
  state.blocks.push(piece);
  if (SPECIAL.includes(piece.type)) state.inventory[piece.type]--;
  history.record({ kind: "place", block: piece });
  rebuildPieces();
  updatePalette();
  scheduleSave();
  voice.play("placed");
  notice("✓ " + names[piece.type] + " placed");
  return true;
}
function cancelPlacement() {
  pending = null;
  previewGroup.clear();
  $("placementControls").hidden = true;
  updateInteractionUI();
}
function renderPreview() {
  previewGroup.clear();
  if (!pending) return;
  previewGroup.add(detailedPiece(pending, commonGeometry, previewMat));
  const reason = placementReason(pending, state, placementObstacles(), player);
  $("confirmPlace").disabled = !!reason;
  $("placementStatus").textContent =
    reason || `${names[pending.type]} · ${pending.rotation}°`;
  $("placementControls").hidden = false;
  updateInteractionUI();
}
function place(ndc) {
  if (modal || state.selected === "hand") return false;
  targetAt(ndc);
  const reason = placementReason(aim, state, placementObstacles(), player);
  if (reason) {
    notice(reason);
    return false;
  }
  if (SPECIAL.includes(aim.type)) {
    const rotation =
      pending?.type === aim.type
        ? pending.rotation
        : (((Math.round((player.yaw + Math.PI) / (Math.PI / 2)) * 90) % 360) +
            360) %
          360;
    pending = { ...aim, rotation };
    renderPreview();
    notice("Turn it, then tap the tick to place");
    return true;
  }
  return commitPiece(aim);
}
function confirmPlacement() {
  if (modal || !pending) return false;
  const b = { ...pending };
  if (!commitPiece(b)) return false;
  cancelPlacement();
  return true;
}
function rotatePlacement(degrees = 90) {
  if (!pending) return;
  pending.rotation = (((pending.rotation + degrees) % 360) + 360) % 360;
  renderPreview();
}
function removePiece(b) {
  if (modal || !b) return false;
  const index = state.blocks.findIndex((p) => key(p) === key(b));
  if (index < 0) return false;
  const piece = { ...state.blocks[index] };
  state.blocks.splice(index, 1);
  if (SPECIAL.includes(piece.type)) state.inventory[piece.type]++;
  history.record({ kind: "remove", block: piece });
  rebuildPieces();
  updatePalette();
  scheduleSave();
  notice("Piece put away");
  return true;
}
function remove(ndc) {
  if (modal) return false;
  targetAt(ndc);
  if (!target) {
    notice("Hold one of your pieces to put it away");
    return false;
  }
  return removePiece(target);
}
function undo() {
  if (modal) return false;
  if (pending) {
    cancelPlacement();
    notice("Preview cancelled");
    return true;
  }
  const result = history.undo(state, player, placementObstacles());
  if (result) {
    rebuildPieces();
    updatePalette();
    scheduleSave();
    voice.play("undo");
    notice("↶ Last building step undone");
  } else
    notice(
      history.past.length
        ? "Step away from that space, then undo"
        : "Your building steps will appear here",
    );
  return result;
}
function updatePalette() {
  const palette = $("palette"),
    scroll = palette.scrollLeft;
  if (!palette.children.length)
    palette.innerHTML = ITEMS.map(
      (t) =>
        `<button data-item="${t}" aria-label="Choose ${names[t]}">${icons[t]}<small>${names[t]}</small><span class="count"></span></button>`,
    ).join("");
  for (const button of palette.children) {
    const t = button.dataset.item;
    button.setAttribute("aria-pressed", String(state.selected === t));
    button.querySelector(".count").textContent = COMMON.includes(t)
      ? "∞"
      : SPECIAL.includes(t)
        ? state.inventory[t]
        : "";
  }
  palette.scrollLeft = scroll;
  if (state.selected !== lastPaletteSelection) {
    lastPaletteSelection = state.selected;
    ensureSelectedVisible();
  }
  $("undo").disabled = !pending && !history.past.length;
  updateInteractionUI();
}
function ensureSelectedVisible() {
  const palette = $("palette"),
    button = palette.querySelector(`[data-item="${state.selected}"]`);
  if (!button) return;
  const p = palette.getBoundingClientRect(),
    b = button.getBoundingClientRect();
  if (b.right > p.right - 8) palette.scrollLeft += b.right - p.right + 8;
  else if (b.left < p.left + 8) palette.scrollLeft += b.left - p.left - 8;
}
function updateInteractionUI() {
  const cross = preferences.placement === "crosshair";
  $("crosshair").hidden = !cross;
  $("place").hidden = !cross || state.selected === "hand" || !!pending;
  $("remove").hidden = !cross || !!pending;
  $("placementMode").textContent =
    "Placement: " + (cross ? "Crosshair" : "Direct touch");
  $("automaticDoors").textContent =
    "Automatic doors: " + (preferences.automaticDoors ? "on" : "off");
  $("automaticDoors").setAttribute(
    "aria-pressed",
    String(preferences.automaticDoors),
  );
  $("guardToggle").innerHTML =
    icons.shield +
    `<small>Edge ${preferences.edgeProtection ? "on" : "off"}</small>`;
  $("guardToggle").setAttribute(
    "aria-pressed",
    String(preferences.edgeProtection),
  );
  $("guardToggle").setAttribute(
    "aria-label",
    "Edge protection " +
      (preferences.edgeProtection ? "on" : "off") +
      ". Tap to toggle.",
  );
  $("edgeProtection").textContent =
    "Edge protection: " + (preferences.edgeProtection ? "on" : "off");
  $("edgeProtection").setAttribute(
    "aria-pressed",
    String(preferences.edgeProtection),
  );
  $("buildHint").textContent =
    state.selected === "hand"
      ? "Tap a material to build · tap it again to deselect"
      : cross
        ? "Aim with + · use Place"
        : "Tap to place · tap selected material to deselect";
}
function jump() {
  if (started && !modal && player.grounded) {
    player.vy = 6;
    player.grounded = false;
  }
}
let nearby = null;
function nearestUse() {
  // Short range and line of sight, so crafting cannot be opened through a wall.
  const eye = new T.Vector3(player.x, player.y + 1.2, player.z),
    table = new T.Vector3(world.table.x, 0.9, world.table.z),
    dist = eye.distanceTo(table);
  if (dist < 2.65) {
    const delta = table.clone().sub(eye).normalize(),
      r = new T.Ray(eye, delta);
    if (
      ![...world.solids, ...world.doors.map((d) => doorBox(d))].some(
        (b) => rayBoxNear(r, b) < dist - 0.8,
      )
    )
      return { kind: "table" };
  }
  let best = null,
    range = 2.6;
  for (const d of world.doors) {
    const dist = Math.hypot(player.x - d.center.x, player.z - d.center.z);
    if (dist < range) {
      range = dist;
      best = d;
    }
  }
  return best ? { kind: "door", door: best } : null;
}
function toggleDoor(d, desiredOpen = !d.targetOpen) {
  const result = requestDoor(
    d,
    desiredOpen,
    player,
    state.blocks,
    world.solids,
    true,
  );
  if (!result.ok) {
    notice(result.message);
    return false;
  }
  state.doors[d.id] = d.targetOpen;
  state.doorSwings ??= {};
  state.doorSwings[d.id] = d.swing;
  lastContextSignature = null;
  scheduleSave();
  notice(d.targetOpen ? "Door opening" : "Door closing");
  return true;
}
function interactAt(ndc) {
  updateCamera();
  ray.setFromCamera(ndc, camera);
  const candidates = [];
  for (const door of world.doors) {
    const distance = rayBoxNear(ray.ray, doorBox(door));
    if (distance < 3 && Math.abs(player.y) < 2)
      candidates.push({ kind: "door", door, distance });
  }
  const tableBox = {
    minX: world.table.x - 0.7,
    maxX: world.table.x + 0.7,
    minZ: world.table.z - 0.55,
    maxZ: world.table.z + 0.55,
    minY: 0.75,
    maxY: 1.05,
  };
  const distance = rayBoxNear(ray.ray, tableBox);
  if (distance < 2.7) candidates.push({ kind: "table", distance });
  const candidate = candidates.sort((a, b) => a.distance - b.distance)[0];
  if (!candidate) return false;
  // Jamb/wall occlusion is tested before the candidate surface.
  if (
    world.solids.some((b) => rayBoxNear(ray.ray, b) < candidate.distance - 0.12)
  )
    return false;
  if (candidate.kind === "door") toggleDoor(candidate.door);
  else {
    openModal("craft");
    voice.play("craft");
  }
  return true;
}
function use(intent = null) {
  if (modal) return;
  nearby = nearestUse();
  if (nearby?.kind === "table") {
    openModal("craft");
    voice.play("craft");
  } else if (nearby?.kind === "door")
    toggleDoor(
      nearby.door,
      intent?.id === nearby.door.id ? intent.open : !nearby.door.targetOpen,
    );
}
function craft(type) {
  if (!SPECIAL.includes(type) || modal !== "craft") return false;
  if (state.inventory[type] >= 99) {
    notice("There are plenty ready to use");
    return false;
  }
  state.inventory[type]++;
  state.selected = type;
  closeModal();
  cancelPlacement();
  updatePalette();
  scheduleSave();
  voice.play("made");
  return true;
}
function home() {
  if (modal) return;
  player = { ...HOME, vy: 0, grounded: true };
  const blockers = state.blocks.filter((b) =>
    overlaps(cellBox(b), bodyBox(player)),
  );
  if (blockers.length) {
    // Never destroy a build to rescue the player: search safe ground near home.
    let found = false;
    for (let radius = 1; radius < 15 && !found; radius++)
      for (let x = -radius; x <= radius && !found; x++)
        for (const z of [-radius, radius]) {
          const p = { ...player, x: HOME.x + x, z: HOME.z + z };
          if (!collides(p, solidCache)) {
            player = p;
            found = true;
            break;
          }
        }
    if (!found) {
      notice("Home is surrounded. Remove a few blocks first");
      return;
    }
  }
  scheduleSave();
  notice("⌂ Back home");
}
function clearInput() {
  keys.clear();
  stick.x = stick.y = 0;
  joyPointer = null;
  worldGestures?.cancel();
  $("knob").style.transform = "none";
}
function openModal(id) {
  returnFocus = document.activeElement;
  modal = id;
  clearInput();
  $(id).hidden = false;
  if (started) save();
  const focus = $(id).querySelector("button");
  focus?.focus();
}
function closeModal() {
  if (modal === "welcome" || modal === "fatal") return;
  if (modal) $(modal).hidden = true;
  modal = null;
  clearInput();
  returnFocus?.focus();
}
function start() {
  started = true;
  modal = null;
  $("welcome").hidden = true;
  clearInput();
  voice.play("welcome");
  if (!saveOK)
    notice("Use the grown-up menu to export your progress before closing");
  $("world").focus();
  updateInteractionUI();
}
function setupUI() {
  for (const id of [
    "home",
    "speaker",
    "menu",
    "undo",
    "remove",
    "place",
    "jump",
  ])
    $(id).innerHTML =
      icons[id] +
      (["undo", "remove", "place", "jump"].includes(id)
        ? `<small>${{ undo: "Undo", remove: "Away", place: "Place", jump: "Jump" }[id]}</small>`
        : "");
  for (const [id, icon, label] of [
    ["cancelPlace", "cancel", "Cancel"],
    ["rotate90", "rotate", "90°"],
    ["rotateFine", "rotate", "15°"],
    ["confirmPlace", "confirm", "Place"],
  ])
    $(id).innerHTML = icons[icon] + `<small>${label}</small>`;
  $("recipes").innerHTML = SPECIAL.map(
    (t) =>
      `<button data-recipe="${t}" aria-label="Craft ${names[t]}">${icons[t]}<b>${names[t]}</b><small>${t === "lantern" ? "Stone + wood" : t === "flowers" ? "A little garden" : "Wood + wood"}<br>∞ → ${names[t]}</small></button>`,
  ).join("");
  $("play").onclick = start;
  $("home").onclick = () => {
    cancelPlacement();
    home();
  };
  $("speaker").onclick = () => {
    const subtitles = voice.subtitles;
    voice.subtitles = true;
    voice.replay();
    voice.subtitles = subtitles;
  };
  $("menu").onclick = () => openModal("settings");
  $("resume").onclick = closeModal;
  document
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = closeModal));
  $("guardToggle").onclick = toggleGuard;
  $("jump").onclick = jump;
  $("place").onclick = () => place();
  $("remove").onclick = () => remove();
  $("undo").onclick = undo;
  let useIntent = null;
  $("use").addEventListener("pointerdown", () => {
    const item = nearestUse();
    useIntent =
      item?.kind === "door"
        ? { id: item.door.id, open: !item.door.targetOpen }
        : null;
  });
  $("use").addEventListener("pointercancel", () => {
    useIntent = null;
  });
  $("use").onclick = () => {
    const intent = useIntent;
    useIntent = null;
    use(intent);
  };
  $("cancelPlace").onclick = () => {
    cancelPlacement();
    updatePalette();
    notice("Preview cancelled");
  };
  $("rotate90").onclick = () => rotatePlacement(90);
  $("rotateFine").onclick = () => rotatePlacement(15);
  $("confirmPlace").onclick = confirmPlacement;
  $("palette").onclick = (e) => {
    const b = e.target.closest("[data-item]");
    if (!b) return;
    cancelPlacement();
    state.selected =
      state.selected === b.dataset.item ? "hand" : b.dataset.item;
    updatePalette();
    scheduleSave();
    if (SPECIAL.includes(state.selected) && !state.inventory[state.selected])
      notice(
        "Make " +
          names[state.selected].toLowerCase() +
          " at your crafting table",
      );
  };
  $("recipes").onclick = (e) => {
    const b = e.target.closest("[data-recipe]");
    if (b) craft(b.dataset.recipe);
  };
  $("import").addEventListener("click", () =>
    settingsFeedback(
      "Choose a saved JSON file. Progress stays unchanged until a valid save is selected.",
    ),
  );
  $("import").addEventListener("cancel", () =>
    settingsFeedback("Import cancelled. Your current progress is unchanged."),
  );
  $("import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 250000) throw Error("That file is too large");
      applyState(validateSave(JSON.parse(await file.text()), world.solids));
      save();
      settingsFeedback("Save opened. Your neighborhood is ready.");
    } catch (err) {
      settingsFeedback("Could not open save: " + err.message);
    }
    e.target.value = "";
  };
  $("export").onclick = exportSave;
  $("copyBackup").onclick = copyBackup;
  $("fullscreen").onclick = toggleFullscreen;
  const fullscreenAvailable =
    !!document.documentElement.requestFullscreen &&
    document.fullscreenEnabled !== false;
  $("fullscreen").textContent = fullscreenAvailable
    ? "Full screen"
    : "Full screen: unavailable";
  $("diagnostics").onclick = () => {
    const visible = $("stats").hidden;
    $("stats").hidden = !visible;
    $("menuStats").hidden = !visible;
    $("diagnostics").textContent = "Performance: " + (visible ? "on" : "off");
    settingsFeedback(
      visible
        ? "Performance readings are shown below and during play."
        : "Performance readings hidden.",
    );
  };
  $("quality").onclick = () => {
    preferences.quality = !preferences.quality;
    applyPreferences();
    savePreferences();
    settingsFeedback(
      preferences.quality
        ? devicePixelRatio > 1
          ? "Crisp picture selected. Choose gentle if play feels slow."
          : "Crisp selected. On this screen the resolution stays the same."
        : "Gentle picture selected for smoother play.",
    );
  };
  $("subtitles").onclick = () => {
    preferences.subtitles = !preferences.subtitles;
    applyPreferences();
    savePreferences();
    settingsFeedback(
      "Written hints " +
        (preferences.subtitles
          ? "on."
          : "off. The speaker button can still replay a hint."),
    );
  };
  $("placementMode").onclick = () => {
    preferences.placement =
      preferences.placement === "direct" ? "crosshair" : "direct";
    cancelPlacement();
    applyPreferences();
    savePreferences();
    settingsFeedback(
      preferences.placement === "direct"
        ? "Direct touch: choose a piece and tap its spot. Hold a built piece to remove it."
        : "Crosshair: aim at the centre +, then press Place. Furniture still needs confirmation.",
    );
  };
  $("edgeProtection").onclick = toggleGuard;
  $("automaticDoors").onclick = () => {
    preferences.automaticDoors = !preferences.automaticDoors;
    if (preferences.automaticDoors)
      for (const d of world.doors) {
        d.manualHold = false;
        d.lastAttempt = -Infinity;
        d.leaveSince = null;
      }
    applyPreferences();
    savePreferences();
    settingsFeedback(
      preferences.automaticDoors
        ? "Automatic doors on: approach to open; they close after you move clear."
        : "Automatic doors off: tap a door or its button to open and close it.",
    );
  };
  applyPreferences();
}
function toggleGuard() {
  preferences.edgeProtection = !preferences.edgeProtection;
  applyPreferences();
  savePreferences();
  const text = preferences.edgeProtection
    ? "Edge protection on. Jump deliberately to leave a platform."
    : "Edge protection off. Walking off an edge is allowed.";
  if (modal === "settings") settingsFeedback(text);
  else notice(text);
}
function applyPreferences() {
  highQuality = preferences.quality;
  voice.subtitles = preferences.subtitles;
  renderer.setPixelRatio(Math.min(devicePixelRatio, highQuality ? 1.5 : 1));
  $("quality").textContent = "Quality: " + (highQuality ? "crisp" : "gentle");
  $("subtitles").textContent = "Hints: " + (voice.subtitles ? "on" : "off");
  updateInteractionUI();
}
async function exportSave() {
  save();
  const text = JSON.stringify(state, null, 2);
  $("backupText").value = text;
  $("backupFallback").hidden = false;
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const file = new File([text], "Little-Block-Lane-save.json", {
    type: "application/json",
  });
  if (ios && navigator.canShare?.({ files: [file] }) && navigator.share) {
    settingsFeedback(
      "Opening the share sheet. Choose Save to Files to keep a backup.",
    );
    try {
      await navigator.share({
        files: [file],
        title: "Little Block Lane backup",
      });
      settingsFeedback(
        "Sharing finished. Check Files for your backup; the backup text is also available below.",
      );
      return;
    } catch (error) {
      if (error.name === "AbortError") {
        settingsFeedback(
          "Share cancelled. Browser progress is unchanged; backup text is available below.",
        );
        return;
      }
    }
  }
  if (ios) {
    $("backupFallback").open = true;
    settingsFeedback(
      "This iPhone browser may not save files from a local HTML game. Copy the backup text below if no download appears.",
    );
  } else
    settingsFeedback(
      "Download requested. Check Downloads; backup text is available below if needed.",
    );
  try {
    const url = URL.createObjectURL(file),
      a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch {
    $("backupFallback").open = true;
    settingsFeedback(
      "File download is unavailable here. Use the backup text below.",
    );
  }
}
async function copyBackup() {
  try {
    if (!navigator.clipboard?.writeText) throw Error();
    await navigator.clipboard.writeText($("backupText").value);
    settingsFeedback(
      "Backup text copied. Paste it into a text file to keep it.",
    );
  } catch {
    $("backupText").focus();
    $("backupText").select();
    settingsFeedback(
      "Backup text selected. Use your device’s Copy command to keep it.",
    );
  }
}
async function toggleFullscreen() {
  if (
    !document.documentElement.requestFullscreen ||
    document.fullscreenEnabled === false
  ) {
    settingsFeedback(
      "Fullscreen is unavailable in this browser on iPhone. Keep playing here; landscape gives more room.",
    );
    return;
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
    $("fullscreen").textContent = document.fullscreenElement
      ? "Exit full screen"
      : "Full screen";
    settingsFeedback(
      document.fullscreenElement ? "Full screen is on." : "Full screen is off.",
    );
  } catch {
    settingsFeedback(
      "This browser did not allow fullscreen. Keep playing here, or rotate to landscape.",
    );
  }
}
setupUI();
installTouchButtons();
restore();
const joystick = $("joystick");
function moveJoy(e) {
  const r = joystick.getBoundingClientRect(),
    radius = r.width * 0.33,
    x = (e.clientX - r.left - r.width / 2) / radius,
    y = (e.clientY - r.top - r.height / 2) / radius,
    n = Math.max(1, Math.hypot(x, y));
  stick.x = x / n;
  stick.y = y / n;
  $("knob").style.transform =
    `translate(${stick.x * radius}px,${stick.y * radius}px)`;
}
joystick.addEventListener("pointerdown", (e) => {
  if (modal || joyPointer !== null) return;
  e.preventDefault();
  joyPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  moveJoy(e);
});
joystick.addEventListener("pointermove", (e) => {
  if (e.pointerId === joyPointer) moveJoy(e);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
  joystick.addEventListener(type, (e) => {
    if (e.pointerId === joyPointer) {
      joyPointer = null;
      stick.x = stick.y = 0;
      $("knob").style.transform = "none";
    }
  });
const canvas = $("world");
canvas.tabIndex = -1;
let holdOrigin = null;
worldGestures = installWorldGestures(canvas, {
  canStart: () => started && !modal,
  onStart: (press) => {
    holdOrigin = {
      x: player.x,
      y: player.y,
      z: player.z,
      yaw: player.yaw,
      pitch: player.pitch,
    };
    targetAt(ndcAt(press.x, press.y));
    holdOrigin.key = target ? key(target) : null;
    if (target) {
      $("holdIndicator").hidden = false;
      $("holdIndicator").style.left = press.x + "px";
      $("holdIndicator").style.top = press.y + "px";
    }
  },
  onIndicator: () => {
    $("holdIndicator").hidden = true;
  },
  onHold: (x, y) => {
    if (
      !holdOrigin ||
      Math.hypot(
        player.x - holdOrigin.x,
        player.y - holdOrigin.y,
        player.z - holdOrigin.z,
      ) > 0.08 ||
      Math.abs(player.yaw - holdOrigin.yaw) +
        Math.abs(player.pitch - holdOrigin.pitch) >
        0.01
    )
      return;
    targetAt(ndcAt(x, y));
    if (target && key(target) === holdOrigin.key) {
      cancelPlacement();
      removePiece(target);
    }
  },
  onTap: (x, y) => {
    const ndc = ndcAt(x, y);
    if (interactAt(ndc)) return;
    if (state.selected !== "hand" && preferences.placement === "direct")
      place(ndc);
  },
  onLook: (dx, dy) => {
    player.yaw -= dx * 0.004;
    player.pitch = clamp(player.pitch - dy * 0.0035, -1.3, 1.3);
  },
  onEnd: scheduleSave,
});
addEventListener("keydown", (e) => {
  if (modal) {
    if (e.code === "Escape") {
      e.preventDefault();
      closeModal();
    }
    if (e.code === "Tab") {
      const root = $(modal),
        items = [...root.querySelectorAll("button,input")].filter(
          (b) => !b.disabled && b.offsetParent !== null,
        );
      if (items.length) {
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
    return;
  }
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  const fn = {
    Space: jump,
    KeyE: use,
    KeyB: () => {
      state.selected = state.selected === "hand" ? "wood" : "hand";
      cancelPlacement();
      updatePalette();
      scheduleSave();
    },
    KeyF: () => place(),
    KeyR: () => (pending ? rotatePlacement(e.shiftKey ? 15 : 90) : remove()),
    Enter: confirmPlacement,
    KeyZ: undo,
    Escape: () => (pending ? cancelPlacement() : openModal("settings")),
  };
  fn[e.code]?.();
  if (/^Digit[0-7]$/.test(e.code)) {
    cancelPlacement();
    state.selected =
      e.code === "Digit0" ? "hand" : ITEMS[Number(e.code.at(-1)) - 1];
    updatePalette();
    scheduleSave();
  }
});
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => {
  clearInput();
  if (started) save();
});
document.addEventListener("visibilitychange", () => {
  clearInput();
  if (document.hidden && started) save();
});
addEventListener("pagehide", () => {
  if (started) save();
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  ensureSelectedVisible();
});
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  if (started) save();
  clearInput();
  modal = "fatal";
  fail(
    "The graphics context was lost. Progress was saved when possible. Close and reopen the game to continue.",
  );
});
let previous = performance.now(),
  stamp = previous,
  frames = 0,
  frameTimes = [],
  loadedMs = 0,
  lastTarget = 0,
  lastPreviewCheck = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const elapsed = now - previous,
    dt = Math.min(0.08, elapsed / 1000);
  previous = now;
  if (started && !modal && !document.hidden) {
    if (
      updateDoors(
        world.doors,
        player,
        state.blocks,
        world.solids,
        preferences.automaticDoors,
        now / 1000,
        dt,
      )
    ) {
      rebuildSolids();
      dirty = true;
    }
    const forward =
      (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0) -
      (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
      stick.y;
    const right =
      (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
      (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0) +
      stick.x;
    movePlayer(
      player,
      {
        forward,
        right,
        edgeProtection: preferences.edgeProtection,
      },
      dt,
      solidCache,
    );
    if (forward || right || player.vy) dirty = true;
    if (dirty && now - lastSave > 2200) save();
  }
  updateCamera();
  if (started && !modal && now - lastTarget > 70) {
    lastTarget = now;
    nearby = nearestUse();
    $("use").disabled = !nearby;
    const signature =
      nearby?.kind === "table"
        ? "table"
        : nearby?.kind === "door"
          ? `${nearby.door.id}:${nearby.door.open}`
          : "none";
    if (signature !== lastContextSignature) {
      lastContextSignature = signature;
      if (nearby)
        $("use").innerHTML =
          nearby.kind === "table"
            ? icons.table + "<span>Make something</span>"
            : icons.door +
              `<span>${nearby.door.open ? "Close" : "Open"} door</span>`;
    }
    if (
      preferences.placement === "crosshair" &&
      state.selected !== "hand" &&
      !pending
    ) {
      targetAt();
      const reason = placementReason(
        aim,
        state,
        [...world.solids, ...world.doors.map((d) => doorBox(d))],
        player,
      );
      ghost.visible = !!aim && COMMON.includes(state.selected);
      outline.visible = !!target;
      if (aim) {
        ghost.position.set(aim.x + 0.5, aim.y + 0.5, aim.z + 0.5);
        ghost.material.color.set(reason ? 0xdb7566 : 0xe9e2a0);
      }
      if (target)
        outline.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
    }
  }
  if (
    preferences.placement !== "crosshair" ||
    state.selected === "hand" ||
    pending ||
    modal
  ) {
    ghost.visible = false;
    outline.visible = false;
  }
  if (modal) $("use").disabled = true;
  previewGroup.visible = !modal;
  if (pending && now - lastPreviewCheck > 150) {
    lastPreviewCheck = now;
    const reason = placementReason(
      pending,
      state,
      placementObstacles(),
      player,
    );
    $("confirmPlace").disabled = !!reason;
    $("placementStatus").textContent =
      reason || `${names[pending.type]} · ${pending.rotation}°`;
  }
  renderer.render(scene, camera);
  if (!loadedMs) loadedMs = performance.now() - bootStart;
  frames++;
  if (started && !modal) frameTimes.push(elapsed);
  if (frameTimes.length > 240) frameTimes.shift();
  if (now - stamp >= 1000) {
    const info = renderer.info,
      sorted = [...frameTimes].sort((a, b) => a - b);
    lastStats = {
      fps: Math.round((frames * 1000) / (now - stamp)),
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      heapMB: performance.memory
        ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1)
        : null,
      rebuildMs: +lastRebuild.toFixed(2),
      firstFrameMs: Math.round(loadedMs),
      frameP95: sorted.length
        ? +sorted[Math.floor((sorted.length - 1) * 0.95)].toFixed(1)
        : null,
      blocks: state.blocks.length,
    };
    $("stats").textContent =
      `${lastStats.fps} fps · p95 ${lastStats.frameP95 ?? "—"} ms\n${lastStats.drawCalls} calls · ${lastStats.triangles.toLocaleString()} triangles\n${lastStats.geometries} geometries · ${lastStats.textures} textures\nJS heap ${lastStats.heapMB ?? "unavailable"} MB (not GPU memory)\nLast build ${lastStats.rebuildMs} ms\nFirst frame ${lastStats.firstFrameMs} ms\nPieces ${state.blocks.length} / ${MAX_BLOCKS}\n${saveOK ? "Browser save available" : "Export needed to keep progress"}\nGentle quality: ${highQuality ? "off" : "on"}`;
    $("menuStats").textContent = $("stats").textContent;
    frames = 0;
    stamp = now;
  }
}
requestAnimationFrame(frame);
// Deliberate read-only inspection plus development-only controls for smoke tests and screenshots.
// ?test=1 is local automation convenience, not a gameplay dependency.
window.blockworld = {
  snapshot: () => structuredClone({ ...state, player: { ...player } }),
  stats: () => ({ ...lastStats }),
  ready: true,
  controls: () => ({
    ...preferences,
    pending: pending ? { ...pending } : null,
    ghost: ghost.visible,
  }),
};
if (new URLSearchParams(location.search).get("test") === "1")
  window.blockworld.test = {
    setPlayer(p) {
      Object.assign(player, p);
      updateCamera();
    },
    setLook(yaw, pitch = 0) {
      player.yaw = yaw;
      player.pitch = pitch;
      updateCamera();
    },
    world: () => ({
      houses: world.houses,
      doors: world.doors.map((d) => ({
        id: d.id,
        open: d.open,
        box: doorBox(d),
        center: d.center,
        baseAngle: d.baseAngle,
        swing: d.swing ?? -1,
        angle: d.angle,
        targetOpen: d.targetOpen,
        blocked: d.blocked,
        hinge: d.hinge,
        width: d.width,
      })),
      solids: world.solids,
      road: world.road,
      drives: world.drives,
    }),
    target: () => {
      targetAt();
      return { target, aim };
    },
    place,
    remove,
    undo,
    home,
    save,
    openCraft() {
      openModal("craft");
    },
    craft,
    add(b) {
      const reason = placementReason(b, state, world.solids, player, false);
      if (reason) return reason;
      state.blocks.push({ ...b });
      history.record({ kind: "place", block: { ...b } });
      rebuildPieces();
      updatePalette();
      scheduleSave();
      return "";
    },
    overview(x = 35, y = 31, z = 42, tx = 0, ty = 0, tz = 1) {
      camera.position.set(x, y, z);
      camera.lookAt(tx, ty, tz);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/png");
    },
    lookAt(x, y, z) {
      updateCamera();
      camera.lookAt(x, y, z);
      const e = new T.Euler().setFromQuaternion(camera.quaternion, "YXZ");
      player.yaw = e.y;
      player.pitch = e.x;
    },
    fresh() {
      applyState(freshState());
      save();
    },
    getBuilding: () => state.selected !== "hand",
    confirmPlacement,
    rotatePlacement,
    toggleDoor: (id) => toggleDoor(world.doors.find((d) => d.id === id)),
    simulate(input, seconds) {
      const n = Math.ceil(seconds / 0.016);
      for (let i = 0; i < n; i++) {
        updateDoors(
          world.doors,
          player,
          state.blocks,
          world.solids,
          preferences.automaticDoors,
          performance.now() / 1000 + i * 0.016,
          0.016,
        );
        rebuildSolids();
        movePlayer(
          player,
          { ...input, edgeProtection: preferences.edgeProtection },
          0.016,
          solidCache,
        );
      }
      updateCamera();
    },
    project(x, y, z) {
      updateCamera();
      const v = new T.Vector3(x, y, z).project(camera);
      return {
        x: ((v.x + 1) * innerWidth) / 2,
        y: ((1 - v.y) * innerHeight) / 2,
        z: v.z,
      };
    },
    getModal: () => modal,
  };
