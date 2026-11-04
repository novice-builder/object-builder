# Undeployed prototype archive

`blockworld2-prototype.zip` contains the built static application and runtime licenses. `BUILD.json` records the clean source commit, build identity, archive SHA-256 and validation. The archive's CRCs and every release-manifest file hash were checked; two consecutive clean builds produced identical bytes.

Extract the archive and serve the resulting `blockworld2-prototype` folder on localhost HTTP, for example `python -m http.server 8080` from that folder. Visit http://localhost:8080. Do not open index.html using file://. No npm installation is needed for this prebuilt archive.

The local server is for review, not a published tablet release. Installing/caching on a tablet requires an appropriate HTTPS origin. No deployment or Pages configuration was performed. Do not host under the existing /object-builder/ service-worker scope. Use a distinct origin or the planned separate /blockworld-2/ Pages project only after publication is authorized.

Full controls and limitations are in ../docs/SLICE.md and ../docs/SAVES.md. This prototype has seven unlimited catalogue entries and four furnished slice buildings, not the full R1 content release. Keep portable backups; browser storage can be evicted.
