# Twelve immediately available looks

Explorer, builder, gardener, pilot, painter, sailor, cosy hoodie, stargazer, park runner, rainbow jumper, farm friend and Blossom are original block-style appearances. They combine varied skin/hair, outfits, hats and accessories with friendly faces. All are available immediately. No wardrobe unlocks or purchases exist.

The pictorial wardrobe shows generated front-facing previews and saves selection in each world's player preferences. Newly created worlds inherit the current look; loading another world restores its own saved look. Original saves without a choice use Explorer. Unknown appearance IDs are rejected as corrupt input.

The same avatar factory supplies region residents and the player. Fixed faces/outfits/accessories are vertex-colour batched, leaving four animated limbs: five draw calls per character. Preview generation shares the existing thumbnail renderer and yields between looks. Replacing an avatar disposes its owned geometry/materials.

First-person hides the body to prevent self-clipping. Third-person displays the selected look walking, flying, seated, playing or driving. The driver uses a seated smaller pose inside the buggy's transparent cabin. Physics/collision dimensions and control algorithms are unchanged.

Executed: all 12 looks have unique visual definitions, bounded geometry and native-backup selection roundtrips; invalid IDs reject. Twelve focused appearance/interaction/movement cases passed. Four browser scenarios passed for the wardrobe/reload/new-world inheritance, seating/flight/driving representation, play, vehicle persistence and compact layouts. The wardrobe screenshot was visually inspected. Physical-device qualification remains outstanding.
