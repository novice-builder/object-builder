# BlockWorld Adventures asset provenance — 2026-11-05

This is a local development subset. None of the original Neighborhood 06 assets, public website files, or player saves were overwritten. No assets were bought. No authentication, CAPTCHA, paywall, or network restrictions were bypassed.

## Preferred packs and substitution

The author pages for **Seahill Towns Complete v1.0.0** and **Seahill Wilds Complete v1.0.0** were inspected using the connected web tool. Their pages describe GLB editions, a common 1024×1024 atlas, and CC0 licensing; both currently present the complete archive through a name-your-own-price download. Page URLs:

- https://seehiong.itch.io/seahill-towns
- https://seehiong.itch.io/seahill-wilds

The selected executor's restricted network explicitly rejected HTTPS CONNECT to `seehiong.itch.io` with HTTP 403. The archives could not be downloaded and **are not included**. Because their archive contents and embedded licence files could not be inspected, this project does not claim that a particular downloaded Seahill archive was independently verified.

The Quaternius Stylized Nature MegaKit page was also inspected: https://quaternius.com/packs/stylizednaturemegakit.html . It shows a CC0 badge and distinguishes free Standard content from paid Pro/Source editions. HTTPS CONNECT to `quaternius.com` was also rejected with HTTP 403. No edition of that Nature MegaKit is included. The public pages' current CC0 statements alone were not treated as evidence for unexamined paid editions.

The implemented substitution is a cohesive low-poly KayKit village with KayKit character animation, supplemented by Kenney garden plants and trees. All included editions have source-adjacent CC0 licence evidence. Public GitHub access used the inherited network proxy with the executor's supported network permission flag.

## Downloaded sources

| Source | Exact source commit | Edition and licence evidence | Included runtime subset |
| --- | --- | --- | --- |
| [KayKit Medieval Hexagon Pack 1.0](https://github.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0) by Kay Lousberg | `84fa4e91af6a88989be7c99e0891cede11f2ca38` | Official author repository; root `LICENSE.txt` says CC0, personal/educational/commercial use. Copy: `licences/KayKit-Medieval-CC0.txt`. | Green and blue complete building models, bridge/fence models, matching props and selected landscape pieces. |
| [KayKit Adventurers Character Pack 1.0](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0) by Kay Lousberg | `672074b73ba276876a19e8816ecdc5241817ab47` | Official author repository; root `LICENSE.txt` says CC0, personal/educational/commercial use. Copy: `licences/KayKit-Adventurers-CC0.txt`. | Original free `Rogue.glb` processed to `character/Explorer.glb`. |
| [Kenney assets mirrored by Hidencod/Tiny Game Engine](https://github.com/Hidencod/tge-assets) by Kenney | `ea2f2aa1ca8da0898330c97df8a5489976b051d0` | Root `LICENSE` states all models by Kenney, CC0; it explicitly licenses the converted embedded-texture GLBs as CC0 too. Copy: `licences/Kenney-CC0.txt`. Author pack page: https://kenney.nl/assets/nature-kit . | 24 self-contained Nature Kit GLBs; five Furniture Kit GLBs added in Preview 04. |
| [Quaternius Medieval Village MegaKit — standard free glTF mirror](https://github.com/J-Ponzo/gltf-medieval-village-megakit) by Quaternius | `21104b4045261c28fc312360841ed1a7b0ac8782` | Mirror README identifies the Standard FREE edition downloaded 2025-04-22 and CC0; repository contains full CC0 legal text. Copy: `licences/Quaternius-Medieval-CC0.txt`. | Originally research-only through Preview 03; six authored modular pieces are included in Preview 04 as described below. No paid Pro/Source content was used. |

CC0 permits modification and redistribution, including commercial games. Attribution is retained as a courtesy and to make provenance reviewable. It is not represented as a requirement of CC0. The author pack's public GitHub contains `Rogue_Hooded.glb` as well, but this runtime subset deliberately uses only `Rogue.glb` from the four-character free collection.

## Processing and inventory

`inventory.json` lists every selected runtime asset, its source, byte count, SHA-256, mesh-local accessor bounds, suggested initial scale, triangle count, and retained clip names. The 71-asset research subset totals approximately **4.48 MiB**, before the game selects its used subset. This is a byte inventory, not a claim that every file is loaded at startup.

`sources/prepare_assets.py` reproduces processing from the source checkouts. It uses only Python's standard library. Download the exact source commits into directories named `kaykit-village`, `kaykit-adventures`, `kenney-library` and `medieval-village`, then adapt the script's `ROOT` path to that parent directory. It writes to `ready/`.

- KayKit glTF JSON, external geometry buffers and PNG images were combined losslessly into self-contained binary GLB files. No geometry was substituted or generated. No geometry or texture downsizing was applied during packing. The runtime retints the Kenney named leaf, bark, grass and tent materials to a coherent woodland palette; source files remain unchanged.
- Kenney GLBs were copied unchanged; their original embedded textures are preserved.
- Explorer uses the original Rogue geometry and skin. Animations were reduced to 13 selected supplied clips, unused animation accessors/buffer views were removed, and remaining buffers compacted and JSON minified. This reduces 3,616,284 bytes to 885,412 bytes. Remaining mesh geometry was not decimated.
- The nodes named `Knife_Offhand`, `1H_Crossbow`, `2H_Crossbow`, `Knife`, and `Throwable` have their `mesh` references removed. Their nodes and hierarchy remain so bone/animation bindings stay valid; they are invisible. Their unused mesh definitions remain in the GLB and may be removed in a future optimisation. The cape remains.
- Retained real animation clips: `Idle`, `Walking_A`, `Walking_B`, `Walking_Backwards`, `Running_A`, `Running_B`, `Running_Strafe_Left`, `Running_Strafe_Right`, `Cheer`, `Interact`, `Jump_Start`, `Jump_Idle`, `Jump_Land`.
- Turning uses the controller's smoothly rotated character orientation while the supplied idle/walk/run animation plays. No separately authored turning animation clip is provided by this processing.

## Scale and collision cautions

The inventory's bounds are the union of mesh POSITION accessor min/max values. They **do not** apply node transforms or skeletal animation. In particular, rotating/translated windmill blades and watermill wheels have negative local bounds; ground placement must use scene-aware bounds and semantic colliders. Do not move these buildings upward from their raw accessor minima.

Village prefabs use native miniature scale: `building_home_A_*` is about 0.792 m wide × 0.93 m tall × 0.854 m deep; scale 10 produces a roughly 8 m wide building. This is a starting point rather than a universal physical scale. Keep all buildings at a coherent scale and judge doors against the rendered character.

Village buildings are closed exterior models; their appearance does not establish accessible interiors or separable doors. Do not claim an indoor scene unless an actual accessible interior has been implemented and inspected.

The original full-quality source checkouts remain under `/workspace/work/asset-research/` in this execution environment. Runtime assets and source licence files can be retained in the new development branch. The original Quaternius download was research-only and should not be counted as shipped content.

## Preview 02 derived catalogue images

`thumbnails/` contains 15 transparent PNGs rendered from these exact imported models by `tools/adventures/thumbnails.py` and `renderCatalogueThumbnail` in the game. Each is 256×192 pixels; `thumbnails/manifest.json` records the source model SHA-256 and derived PNG SHA-256. They are generated during development and served as static images; opening the catalogue does not create another WebGL renderer on mobile. Original CC0 model sources and licences remain unchanged.

## Preview 04 modular lodge evaluation

The Standard FREE Quaternius Medieval Village mirror at `21104b4045261c28fc312360841ed1a7b0ac8782` is now used for six authored modular pieces: plaster wall, doorway wall, timber floor, hinged Door 4, complete tiled roof and gable. Fresh HTTPS reads matched all 12 glTF/bin files plus README and full CC0 licence to the exact source commit. This is the separately licensed Medieval Standard collection, **not** the blocked Nature MegaKit or any paid Pro/Source edition. The existing `licences/Quaternius-Medieval-CC0.txt` applies.

`modular/` retains original geometry/accessor buffers and replaces texture-based materials with a coherent flat linear-colour palette (timber, warm plaster, blue tiles, stone and metal). Textures/unused images are removed, reducing six pieces to about 239 KB without reducing geometry. Original source files remain in the research checkout; exact fetched hashes are in `sources/modular-source-verification.json`. The reproducible conversion is `sources/prepare_modular.py`.

`furniture/` adds Kenney table, chair, open bookcase, books and rectangular rug, copied unchanged from the same `Hidencod/tge-assets` CC0 conversion repository at `ea2f2aa1ca8da0898330c97df8a5489976b051d0`. The root licence already archived as `licences/Kenney-CC0.txt` explicitly covers these converted Kenney GLBs. Exact raw-file matches and hashes are retained in `sources/furniture-source-verification.json` and `inventory-v4.json`. These are furnished-interior assets, not a claim that all original prefab houses become enterable.

The lodge assembly adds four small generated timber corner posts to close modular joins; these are supporting join geometry, not imported source assets. Furniture carpet materials are retinted to a muted sage/linen palette at runtime. No source GLB is modified by those runtime colours. The rest of the walls/roof/door/floor and furnishings use the imported authored meshes listed in `inventory-v4.json`.

## Preview 04 creative catalogue

Four additional transparent 256×192 PNGs render the actual imported table/chair/bookcase/rug geometry through the existing game renderer. They add 21,665 bytes; all 15 prior image bytes and manifest entries are preserved. The manifest now has 19 source-linked entries. Newly placed tents use scale 5.5 (~3.09m shell); existing saved explicit scales remain unchanged. Furniture defaults are checked against actual model dimensions; rugs are decorative walk-through floor objects.


## Preview 10 bedroom furnishings

Kenney Furniture Kit single bed and bedside cabinet are copied unchanged from the same CC0 conversion repository, `Hidencod/tge-assets` at `ea2f2aa1ca8da0898330c97df8a5489976b051d0`. Fresh pinned HTTPS reads of both GLBs, the root licence and README matched the research checkout byte for byte. The existing `licences/Kenney-CC0.txt` explicitly includes these conversions and matches the freshly fetched licence. Exact URLs/bytes/SHA-256 are in `sources/furniture-v10-source-verification.json`; geometry counts and scaled dimensions are in `inventory-v10.json`.

The two models add 26,132 uncompressed bytes with no embedded images/textures. The bed is scaled to about 2.08 m long and 1.06 m wide; the cabinet is about 0.51 m high. They support actual new bedrooms and explicit room decoration; old saved furnishings are retained. Existing timber/linen/sage palette adjustments are applied at runtime, preserving the original GLB bytes. No extra generic blocks or materials are introduced. Earlier assets, inventories, thumbnails and archived packages are unchanged.
