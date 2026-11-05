# Run 3 distribution formats — not deployed

`npm run build` produces `dist/` for website/PWA hosting and `standalone/BlockWorld_2_Run3_Standalone.html`. The HTML wraps the exact compiled game bundle, CSS, icon and license credits; it is not a second game implementation. The website retains its separate manifest, scope-keyed worker cache, version identity and IndexedDB saving. No publishing/authentication/Pages operation is performed.

For a committed clean source, run the build then `python tools/package.py artifacts/run3-initial` (or another new archive folder). The packager refuses to overwrite a folder, checks clean source/build identity and every release-manifest hash, writes a deterministic website ZIP and copies the same standalone HTML. BUILD.json/CHECKSUMS.sha256 identify source, build and integrity. Final packages use a separate artifacts/run3 folder; earlier packages stay intact.

## Measured standalone compatibility

Managed Linux Chromium rejects `file://` navigation with `ERR_BLOCKED_BY_ADMINISTRATOR` before any game code executes. That local-file scenario is explicitly skipped after recording the policy denial; neither file-origin IndexedDB nor file launch on Android/iPhone is claimed to work.

The exact HTML was instead served by a localhost server exposing only that file. Two browser scenarios passed: startup/rendering, simultaneous touch movement/look, catalogue/object placement, world selection, saved instance/reload, actual backup download and file-input import to a separate copy. No other game asset request was needed. These validate the self-contained format and gameplay under an HTTP origin, not local-file storage compatibility or independent HTTP-offline navigation. The primary PWA's cold offline and update behaviour are separately tested.

For manual testing, download the HTML and open it in a browser/device that permits local scripts/storage. If local storage is unavailable, keep exported backups; the app shows save errors rather than silently discarding edits. Website and file origins may have separate storage, and moving/renaming a file may affect browser storage identity. Transfer creations with backups. Physical Android Chrome/Downloads launch, iPhone Safari/file-provider launch and persistence remain unverified. Do not bypass managed browser policy to assert compatibility.

The website ZIP can be extracted and served over localhost HTTP for review; future installable tablet use requires suitable HTTPS hosting. Hosting is outside this run. No APK is produced.
