# Verification artifacts

`results.json` records the 12 browser acceptance scenarios and their successful end state. Its baseline/stress/mobile metrics are incidental snapshots taken during interaction and screenshot work; the 800-piece load scenario's camera faces away from the build. Do not use those snapshots as a performance comparison.

`performance.json` contains the separate controlled 1024×640 samples, with the same camera looking at the build area, network disabled before startup, and all 800 placed pieces in view for the stress sample. Use that file and `../VERIFICATION.md` for performance interpretation. These are short cloud software-renderer observations, not device results.

`screenshots/` includes north and south views of each home, an overview, interior/crafting/building views, three touch viewport sizes and the 800-piece stress view. Screenshot inspection is described in `../VERIFICATION.md`; the owner's visual approval and physical-device checks are still pending.
