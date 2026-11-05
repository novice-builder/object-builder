import { validateBlocks } from "../build/validation";
import { CHOICES } from "../build/registry";
import { CATALOGUE } from "../build/catalogue";
import { validateSave } from "../legacy06/core.js";
import { TEMPLATES, latestLayout, type TemplateId } from "../world/templates";
import type { Block } from "../build/commands";
import { APPEARANCES } from "../player/appearance";
export interface Snapshot {
  schema: 3;
  template: TemplateId;
  world: {
    blocks: Block[];
    doors: Record<string, boolean>;
    [key: string]: unknown;
  };
  player: {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
    [key: string]: unknown;
  };
  preferences: { selected: string; [key: string]: unknown };
}
export interface Envelope {
  json: string;
  checksum: string;
}
export function checksum(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
export function validateSnapshot(value: unknown): Snapshot {
  const s = value as Snapshot;
  if (
    !s ||
    ![1, 2, 3].includes(s.schema) ||
    !TEMPLATES.some((t) => t.id === s.template) ||
    !s.world ||
    !s.player ||
    !s.preferences
  )
    throw Error("Unsupported world schema or template");
  for (const k of ["x", "y", "z", "yaw", "pitch"])
    if (!Number.isFinite(s.player[k])) throw Error("Invalid player position");
  if (
    Math.abs(s.player.x) >= 250 ||
    Math.abs(s.player.z) >= 250 ||
    s.player.y < 0 ||
    s.player.y > 26
  )
    throw Error("Player outside supported bounds");
  const layout =
    s.world.layout ??
    (s.template === "sunbeam-region" && s.schema === 3 ? 2 : 1);
  if (!Number.isInteger(layout) || Number(layout) < 1 || Number(layout) > 2)
    throw Error("Unsupported template layout");
  if (
    s.preferences.avatar !== undefined &&
    !APPEARANCES.some((a) => a.id === s.preferences.avatar)
  )
    throw Error("Unknown avatar appearance");
  if (
    s.preferences.lookSpeed !== undefined &&
    (typeof s.preferences.lookSpeed !== "number" ||
      ![0.6, 1, 1.4].includes(s.preferences.lookSpeed))
  )
    throw Error("Invalid look speed");
  if (
    s.preferences.leftHanded !== undefined &&
    typeof s.preferences.leftHanded !== "boolean"
  )
    throw Error("Invalid control side");
  for (const [key, limit] of [
    ["hotbar", 8],
    ["recent", 8],
    ["favourites", 32],
  ] as const) {
    const ids = s.preferences[key];
    if (
      ids !== undefined &&
      (!Array.isArray(ids) ||
        ids.length > limit ||
        ids.some(
          (id) => typeof id !== "string" || !CHOICES.some((c) => c.id === id),
        ))
    )
      throw Error("Invalid catalogue preferences");
  }
  validateBlocks(s.world.blocks);
  if (!["hand", ...CHOICES.map((i) => i.id)].includes(s.preferences.selected))
    throw Error("Invalid selected item");
  if (
    !s.world.doors ||
    Array.isArray(s.world.doors) ||
    typeof s.world.doors !== "object" ||
    Object.values(s.world.doors).some((v) => typeof v !== "boolean")
  )
    throw Error("Invalid doors");
  const props = s.world.props;
  if (
    props !== undefined &&
    (!props ||
      Array.isArray(props) ||
      typeof props !== "object" ||
      Object.keys(props).length > 256 ||
      Object.values(props).some(
        (p: any) =>
          !p ||
          Array.isArray(p) ||
          typeof p !== "object" ||
          Object.entries(p).some(
            ([k, v]) => !["open", "on"].includes(k) || typeof v !== "boolean",
          ),
      ))
  )
    throw Error("Invalid furniture state");
  const activity = s.world.activity as any;
  if (activity !== undefined) {
    if (
      !activity ||
      !activity.car ||
      ![activity.car.x, activity.car.z, activity.car.yaw].every(
        Number.isFinite,
      ) ||
      Math.abs(activity.car.x) > 249 ||
      Math.abs(activity.car.z) > 249
    )
      throw Error("Invalid vehicle checkpoint");
  }
  if (
    activity?.horses !== undefined &&
    (!Array.isArray(activity.horses) ||
      activity.horses.length > 4 ||
      new Set(activity.horses.map((h: any) => h.id)).size !==
        activity.horses.length ||
      activity.horses.some(
        (h: any) =>
          !h ||
          !Number.isInteger(h.id) ||
          h.id < 0 ||
          h.id > 3 ||
          ![h.x, h.z, h.yaw].every(Number.isFinite) ||
          Math.abs(h.x) > 249 ||
          Math.abs(h.z) > 249,
      ))
  )
    throw Error("Invalid horse checkpoint");
  return {
    ...structuredClone(s),
    world: { ...structuredClone(s.world), layout },
    schema: 3,
  };
}
export function encode(value: Snapshot): Envelope {
  const json = JSON.stringify(validateSnapshot(value));
  return { json, checksum: checksum(json) };
}
export function decode(e: Envelope) {
  if (
    !e ||
    typeof e.json !== "string" ||
    e.json.length > 8_000_000 ||
    checksum(e.json) !== e.checksum
  )
    throw Error("Checkpoint checksum failed");
  return validateSnapshot(JSON.parse(e.json));
}
export function fromGame(s: any): Snapshot {
  return validateSnapshot({
    schema: 3,
    template: s.template,
    world: {
      blocks: s.blocks,
      doors: s.doors,
      props: s.props || {},
      layout: s.layout ?? latestLayout(s.template),
      ...(s.activity ? { activity: s.activity } : {}),
    },
    player: s.player,
    preferences: {
      selected: s.selected,
      avatar: s.avatar || "explorer",
      lookSpeed: s.lookSpeed || 1,
      leftHanded: !!s.leftHanded,
      favourites: s.favourites || [],
      recent: s.recent || [],
      hotbar: s.hotbar || [],
      camera: s.camera || "first",
      flying: !!s.flying,
    },
  });
}
export function parseBackup(text: string): {
  snapshot: Snapshot;
  source?: string;
  name: string;
} {
  if (text.length > 12_000_000) throw Error("Backup is too large");
  const data = JSON.parse(text);
  if (data.format === "blockworld2" && data.version === 1)
    return {
      snapshot: decode(data.checkpoint),
      ...(typeof data.legacySource === "string" &&
      data.legacySource.length <= 4_000_000
        ? { source: data.legacySource }
        : {}),
      name:
        typeof data.name === "string"
          ? data.name.slice(0, 60)
          : "Imported world",
    };
  if (text.length > 4_000_000) throw Error("Legacy backup exceeds 4 MB");
  const legacy = validateSave(data);
  return {
    snapshot: validateSnapshot({
      schema: 3,
      template: "legacy-06",
      world: { blocks: legacy.blocks, doors: legacy.doors },
      player: legacy.player,
      preferences: { selected: legacy.selected },
    }),
    source: text,
    name: "Imported legacy neighbourhood",
  };
}
