# BlockWorld 2.0 architecture

Stage 1 establishes a separate TypeScript/Vite/Three.js package. The renderer remains pinned to 0.160.1 while proven 06 mechanics are extracted; upgrading requires actual tablet capability qualification.

Boundaries: app owns lifecycle; input emits actions; player owns movement/cameras; world owns authored templates and instance state; entities provide stable IDs/colliders/interactions; build owns catalogue and reversible commands; simulation owns bounded ambient agents; persistence owns transactional saves and recovery; render owns disposable scene objects. No render mesh is serialized.

Source baseline: main 1ffd35ed971afa7820734cf10a3287ab546f6306. Mechanical source: development df958096a88254bf611a64798e317ecb9fc3f5f9. Main's HTML is development HTML plus the verified 545-byte PWA wrapper. The wrapper and root service worker are not reused.

All output stays in blockworld2/dist. No workflow, root navigator or existing Pages setting is modified. Serve on a separate local origin; test hosting must be outside /object-builder/ (Run 1 target /blockworld-2-preview/). New storage/cache namespaces use bw2:development and blockworld2-development. Never clear origin-wide storage or old caches.

The generated worker precaches this package only, uses its exact named cache, and does not skip waiting or claim active clients. A failed install keeps the old worker. Update UI and persistent offline-readiness reporting remain follow-up work. The dedicated manifest supplies original SVG and 192/512 PNG icons; Apple touch metadata supplies a 180 PNG. Actual installation/maskable safe-area qualification remains incomplete.

Run 1 introduces a typed catalogue/parts/collider registry and native snapshot schema 2. Schema 1 native backups and legacy imports remain supported. RegistryChunks retains the original exposed-face path for the seven legacy IDs and instances new compound models in spatial cells. The active movement adapter is a precisely tested 06 fork with elevated-ramp base/entry support; all frozen upstream files remain identical. Template identity preserves original Home/Square instances while Sunbeam Town is a separate option. See RUN1.md for current checkpoints and pending qualification.

No tablet, physical iPhone or sustained performance claim has been established.
