import manifest from "../audio/dialogue.json";
// Build injects approved local files as data URLs, so audio remains truly offline.
const clips = __VOICE_CLIPS__;
export const dialogue = Object.fromEntries(
  Object.entries(manifest).map(([id, cue]) => [
    id,
    { text: cue.text, clip: clips[id] || null },
  ]),
);
export class Voice {
  constructor(show) {
    this.show = show;
    this.last = "welcome";
    this.audio = null;
    this.subtitles = true;
  }
  play(id) {
    const cue = dialogue[id];
    if (!cue) return;
    this.last = id;
    this.audio?.pause();
    if (this.subtitles) this.show(cue.text);
    if (cue.clip) {
      this.audio = new Audio(cue.clip);
      this.audio.play().catch(() => {});
    }
  }
  replay() {
    this.play(this.last);
  }
}
