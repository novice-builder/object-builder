# Mechanical migration

The legacy06 directory is a frozen copy from df958096a88254bf611a64798e317ecb9fc3f5f9; LEGACY-SOURCES.json records hashes. No legacy application bootstrap, localStorage access or service worker is included. The original source/build tree and root HTML are untouched.

Reused: collision/substeps, jumps/edge support, stair ramps, oriented door geometry and animation, world/property collision generation, chunk meshing, detailed furniture, pointer gestures and touch compatibility-click suppression. Original deterministic suites run against these copies.

New layers: TypeScript input router, isolated renderer/application, unlimited placement command history with undo/redo, hotbar, furniture previews and UI. The command adapter provides nonconsuming availability for the three historical decorative types; no workbench/inventory prerequisite is presented. Finite geometry capacity remains 12,000 pieces to protect devices; this is not an inventory economy.

Legacy JavaScript types are intentionally isolated at the adapter boundary. The new application does not claim complete parity with every old UI feature: gamepad UI, contextual line-of-sight prompts and advanced export UI are separate work. Stage 2 has session-only progress until Stage 3 adds storage. World selection is reserved for Stage 3.

Actual target-device performance, Safari/WebKit and physical touch are unverified. Chromium touch dispatch is regression evidence, not hardware qualification.
