# Offline voice starter script

`dialogue.json` is the 13-line recording script and cue manifest. All `file` values are currently null; playback gracefully falls back to text. No TTS or voice-generation account is used. Welcome, crafting, making, building, placement, undo and home events have named cues; gathering, learning and optional helper hints are reserved for later stages.

After the owner approves the recordings and usage rights, put short MP3, OGG or WAV files in this directory and replace each null with a relative filename, for example `"file": "welcome.mp3"`. Run `npm run build` from `neighborhood/`. The build embeds the recordings as data URLs in the offline HTML; it never calls a speech service. Keep a note of recording source/license alongside supplied files. Natural speech quality depends on the approved recordings.

The speaker button replays the last cue. Grown-up menu → Hints toggles subtitles. Missing clips stay silent; a browser audio playback rejection never blocks the game. Voice playback, levels and licensing are not verified until actual recordings are supplied. No audio is required for this milestone.
