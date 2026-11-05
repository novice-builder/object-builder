# Run 4 autonomous QA and repairs

Branch: codex/blockworld2-run4-qa. Immutable Run 3 reference: 99d922c1fa566a086bcbe9ddf851d98d4e4c19cd, independently verified through GitHub and git ls-remote. Its tested source bf51e71b3b5849d08773bb9a8c3172de83646a1f and all three Run 3 archive-folder checksums are present and verified. Read Run 3 continuation, final report and QA evidence before investigation. No AGENTS.md files apply.

Scope: independently reproduce meaningful defects, repair narrowly, add regressions, test, commit/push and independently verify every coherent milestone. Priorities: save integrity; movement/doors/recovery; mounts/fleet/companion; guided-aircraft behavior; combined building/interactions; multitouch/layout; measured rendering/resource issues. No new catalogue content, piloting, unrelated features, publication, main merge or hosting/authentication changes. All changes stay inside blockworld2/ on this new branch. Existing layouts, native schemas 1/2/3, legacy backups and constructions must remain compatible.

Run 3 branch, documentation, packages, earlier archives/releases, frozen mechanics, Neighborhood 06/root navigator/workers/Pages remain unchanged. A code rollback does not restore a saved world; every persistence repair must preserve valid checkpoints and export/recovery. New packages use artifacts/run4-qa and the Run4_QA filenames, never overwrite old folders.

## Baseline

Executed once before runtime changes: 107 deterministic tests, TypeScript/build/preservation passed. Browser baseline: 42 passed, one failed malformed-import feedback case and one explicit managed-file-policy skip (44 total). The failure was investigated and deterministically reproduced as QA-001, not attributed to new changes. Raw evidence: docs/qa/run4/baseline-*.txt. Environment: Node 24.19.0, Chromium 154.0.8037.57, Playwright touch/viewport emulation with SwiftShader. No physical Lenovo/iPhone/Safari results are claimed.

## Repair ledger

Confirmed repairs will record ID/severity, reproduction, expected/actual behavior, root cause, focused correction, regressions, executed result and verified checkpoint. Suspicions and environment limitations stay separate from confirmed defects. Confirmed repairs are recorded below; exploratory Node probes outside the source tree are distinguished from browser regressions.

### QA-001 — Medium: visible backup controls without handlers

Reproduction: delay WorldStore.list while opening Worlds, then try the immediately visible Import control. Expected: controls are exposed only when usable and a malformed file displays an error without changing worlds. Actual: the change event occurs before onchange is attached and is silently lost. This explains the baseline malformed-import assertion; its isolated ordinary rerun passed, while the delayed-read test failed reliably.

Cause: menu HTML appeared before awaiting the asynchronous world list, but import/export/world handlers were attached after that await. Fix: read the list first, then render and attach every handler synchronously. No save schema/layout/archive changes. Regression: tests/browser/qa-session.spec.ts delayed database readiness. Verification: new regression plus website and standalone backup scenarios all passed (three browser cases), strict TypeScript/build/protection passed. Associated checkpoint: the focused menu-readiness repair commit; its verified hash is added at the next ledger update.
