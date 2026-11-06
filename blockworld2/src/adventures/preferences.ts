export type Quality = "gentle" | "balanced" | "high";
export interface ControlPreferences {
  quality: Quality;
  running: boolean;
}
export const PREFERENCES_KEY = "blockworld-adventures-controls-v3";
export const LEGACY_PREFERENCES_KEY = "blockworld-adventures-controls-v2";
export function readPreferences(
  storage: Pick<Storage, "getItem"> | null,
  coarsePointer = false,
): ControlPreferences {
  const fallback = coarsePointer ? "gentle" : "balanced";
  const read = (key: string) => {
    try {
      return JSON.parse(storage?.getItem(key) || "null");
    } catch {
      return null;
    }
  };
  try {
    const value = read(PREFERENCES_KEY),
      legacy = read(LEGACY_PREFERENCES_KEY),
      quality = value?.quality ?? legacy?.quality;
    return {
      quality: ["gentle", "balanced", "high"].includes(quality)
        ? quality
        : fallback,
      running: typeof value?.running === "boolean" ? value.running : true,
    };
  } catch {
    return { quality: fallback, running: true };
  }
}
export function writePreferences(
  storage: Pick<Storage, "setItem"> | null,
  value: ControlPreferences,
) {
  try {
    storage?.setItem(PREFERENCES_KEY, JSON.stringify(value));
    return !!storage;
  } catch {
    return false;
  }
}
