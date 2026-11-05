# Run 1 catalogue

111 individually registered entries plus four convenience presets (not double-counted as individual objects). Breakdown: 20 materials, 16 structural shapes, 11 openings/boundaries, 21 general furniture, 8 kitchen, 6 bathroom, 6 workshop, 12 garden, 6 lights and 5 play objects. Material choices include distinct patterned surfaces; the object/shape entries are not a list of colour duplicates.

The typed registry owns original model parts, rotation-aware compound collision, optional door/light state and thumbnails. The first seven IDs retain their original renderer/collider behavior. New objects are instanced by shape/material in spatial batches. The existing exposed-face renderer remains in use for legacy blocks, avoiding a dense-build geometry regression.

The catalogue has categories, optional search, 24-entry pages, rendered model thumbnails, favourites, recent choices and quick access. Thumbnail generation yields between entries. All items are unlimited. Four presets place bedroom, kitchen, garden or workshop furnishings as a single reversible command.

Native world schema 2 reads schema 1 and preserves its creations. Legacy JSON imports retain their original bytes. New model IDs, rotations and state are validated before persistence. Rolling back to the older foundation app cannot read new schema-2 worlds; original checkpoints remain retained and portable backups should be kept.

Placed doors use obstruction-tested manual swing states; placed lights have a visible on/off appearance. Doors do not yet animate between those states and lighting is stylized, not a point light per fixture. Large content-world completion, more complex terrain and physical-device qualification remain follow-up work.

The physics adapter is an audited copy of 06 collision code with explicit elevated-ramp base height/entry support. Frozen legacy06 files remain byte-identical. Tests cover every entry at 0°/90°, rendering/collision finiteness, native roundtrip, all four presets, old-world migration, elevated stairs and placed doors.
