# Run 4 QA evidence

Immutable baseline 99d922c (tested source bf51e71), Run 4 branch codex/blockworld2-run4-qa. Existing validation ran once before runtime changes: **107 deterministic passes**, strict TypeScript/build/preservation passed; browser **42 passed, one failed, one explicit file-policy skip**. Raw baseline logs are in qa/run4. No physical Lenovo/iPhone/Safari result is claimed. Managed Chromium 154/Playwright/SwiftShader touch/viewport emulation is the browser environment.

The baseline failed malformed-backup feedback. Its ordinary isolated replay passed; delayed WorldStore.list reproduces a real unbound-control race (QA-001). The new red regression failed as expected, then all three focused menu/website-backup/standalone-backup scenarios passed after the atomic-menu correction. See RUN4.md for cause, fix and checkpoint ledger.

Independent failure-injection probes against unchanged baseline code also confirmed a cross-world save ownership overwrite, out-of-bounds seat recovery, driving through a pedestrian and insufficient bicycle rider headroom. These are investigations, not fixed claims; regressions and verified repair checkpoints follow individually. Suspected blocked-aircraft recovery and partial multitouch release behavior still need browser confirmation.
