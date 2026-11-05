export type Quality = "gentle" | "balanced" | "high";
export interface ControlPreferences {
  quality: Quality;
  running: boolean;
}
export const PREFERENCES_KEY = "blockworld-adventures-controls-v2";
export function readPreferences(
  storage: Pick<Storage, "getItem"> | null,
): ControlPreferences {
  try {
    const value = JSON.parse(storage?.getItem(PREFERENCES_KEY) || "null");
    return {
      quality: ["gentle", "balanced", "high"].includes(value?.quality)
        ? value.quality
        : "balanced",
      running: typeof value?.running === "boolean" ? value.running : false,
    };
  } catch {
    return { quality: "balanced", running: false };
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
