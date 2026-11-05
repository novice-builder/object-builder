# Run 1 development preview package

`blockworld2-run1-preview.zip` is the prebuilt static Sunbeam Town preview. `BUILD.json` records the exact clean source commit, build identity, archive digest and executed checks. The historical foundation archive in the parent directory is unchanged.

Extract the ZIP, enter `blockworld2-run1-preview`, run `python -m http.server 8080` and open http://localhost:8080. No npm installation is required for this archive. Opening index.html through file:// is unsupported. First load needs network/local-server access to prime the worker; subsequent cold offline launch is tested in Chromium.

There is **no deployed preview URL** from this run. Tablet installation requires a suitable HTTPS origin. [Publishing instructions](../../docs/PREVIEW.md) target only the separate test repository novice-builder/blockworld-2-preview, outside the installed Neighborhood 06 /object-builder/ worker scope. Its creation/publication is blocked by unavailable administration tools and invalid GitHub CLI authentication in this session. Do not publish inside object-builder or change its Pages settings as a workaround.

The package contains static application files and runtime asset/license credits. No player saves, repository credentials or personal data are included. Local worlds remain in the separate BlockWorld 2 IndexedDB namespace; updates do not clear it. Keep portable backups, since browsers can evict storage.

Content: 111 unlimited individual catalogue entries and four furnishing presets; 12 furnished main buildings, three garages, four clear plots, 16 map destinations; six residents, dog/cat/duck/horse, two traffic cars and one drivable buggy. This remains below the full R1 content target. Play equipment is mostly decorative and horse riding is absent.

Validation: 72 deterministic tests, 22 browser scenarios, strict TypeScript and protected-file checks passed. Two clean production builds were byte-identical across all 13 files. ZIP CRCs and all release-manifest SHA-256 hashes were verified. Actual Lenovo/iPhone/Safari installation and sustained performance remain untested. See [QA](../../docs/RUN1-QA.md) and [exact continuation](../../docs/CONTINUE-RUN2.md).
