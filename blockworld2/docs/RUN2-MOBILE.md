# Mobile and rendering hardening

Added persistent gentle/normal/quick look speed and mirrored left/right control placement. Menus clear held movement/flight input; portrait preview controls sit above the hotbar and away from the joystick. Actual simultaneous touch joystick/look dispatch is checked. Existing gesture/hold suppression and ledge/collision code remain protected.

Multi-object transactions notify saving once and rebuild each touched rendering chunk once. The frozen exposed-face mesher is orchestrated through its existing store/rebuild methods, without changing its source or algorithm. Incremental build collision indexing and local agent/traffic queries were implemented earlier as a dependency of activities. Large objects are queried by extent.

Rich avatars use five meshes. Shared catalogue geometry/textures remain reusable across world disposal; world-owned meshes, textures and avatars are released. Three non-shadowed nearby point lights provide actual bounded illumination for switched fixtures. No light is allocated per placed lamp, and the pool does not grow with world size.

Executed: 13 focused command/interaction/performance cases passed, including once-per-transaction saving, once-per-chunk row rebuilding, local queries at 12,000 objects and avatar mesh bounds. Five browser scenarios passed for simultaneous multitouch, settings/reload, portrait preview clearance, held-flight reset on map opening, geometry resources across repeated world switches, fixed light pool/toggling, existing move/history, rows/pins and compact layouts. Resource sampling was corrected to render each new scene before measuring; a timer alone could still observe the preceding blank frame.

These are Linux Chromium/SwiftShader functional and resource-count checks. No Lenovo/iPhone hardware FPS, thermal, battery, RAM or long-session benchmark is claimed. Initial shader compilation and large-world load cost still need physical-device profiling.
