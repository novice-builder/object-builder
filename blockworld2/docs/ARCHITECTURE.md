# BlockWorld 2.0 architecture

Stage 1 establishes a separate TypeScript/Vite/Three.js package. The renderer remains pinned to 0.160.1 while proven 06 mechanics are extracted; upgrading requires actual tablet capability qualification.

Boundaries: app owns lifecycle; input emits actions; player owns movement/cameras; world owns authored templates and instance state; entities provide stable IDs/colliders/interactions; build owns catalogue and reversible commands; simulation owns bounded ambient agents; persistence owns transactional saves and recovery; render owns disposable scene objects. No render mesh is serialized.

Source baseline: main 1ffd35ed971afa7820734cf10a3287ab546f6306. Mechanical source: development df958096a88254bf611a64798e317ecb9fc3f5f9. Main's HTML is development HTML plus the verified 545-byte PWA wrapper. The wrapper and root service worker are not reused.

All output stays in blockworld2/dist. No workflow, deployment, root navigator or Pages setting is modified. Serve on a separate local origin; future hosting must be outside /object-builder/ (planned /blockworld-2/). New storage/cache namespaces use bw2:development and blockworld2-development. Never clear origin-wide storage or old caches.

The generated worker precaches this package only, uses its exact named cache, and does not skip waiting or claim active clients. A failed install keeps the old worker. Update UI and persistent offline-readiness reporting remain follow-up work. The manifest currently supplies an SVG icon; Android raster/maskable and Apple touch-icon qualification remains incomplete.

No tablet, physical iPhone or sustained performance claim has been established.
