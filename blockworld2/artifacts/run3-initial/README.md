# BlockWorld 2 Run 3 downloadable builds

These packages are development builds. Nothing is deployed or published. BUILD.json identifies the exact clean source and package hashes; CHECKSUMS.sha256 covers all companion files. Test results and limitations are in ../../docs/RUN3-QA.md and ../../docs/RUN3-DISTRIBUTION.md.

Website: extract the ZIP, enter BlockWorld_2_Run3_Website and run `python -m http.server 8080`, then open http://localhost:8080. No npm installation is needed for the prebuilt package. Future tablet PWA installation requires suitable HTTPS hosting outside the Neighborhood 06 scope. Do not change existing Pages/website/workers.

Standalone: download the HTML and open it in a compatible browser. It embeds the same compiled game, CSS, icons and license credits. It has no service worker requirement. Local-file storage/launch behaviour depends on browser and device; keep portable backups and read the measured compatibility record. File and website storage may be separate; transfer creations using backups.

Both packages contain application files only, with no player saves or credentials. Browser storage can be cleared or evicted. Existing original/foundation/Run 1 archives remain available. Run 3 initial and final folders are separate and never overwritten.
