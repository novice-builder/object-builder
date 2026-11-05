# Bounded living-world improvements

Sunbeam Town runs six residents, four friendly animal species (dog, cat, duck and horse), two traffic cars and one player buggy. Original Home/Square remains a smaller profile. Animal geometry and limb animation are original; the horse is approachable, not rideable in this release.

Agents follow small authored routes, pause at destinations, wait/reconsider blocked targets without teleporting, and stop to greet the player. Distant agents skip updates. No hostile behavior, damage or survival system exists.

Traffic keeps route progress when blocked, checks headway/other vehicles, and yields near people. The buggy collides with traffic and uses safe exit placement. This is a bounded road-loop system, not a full traffic-light/intersection simulator.

Newly placed chairs/sofas/stools and authored Sunbeam seating support sitting, touch Use to stand, or movement to stand safely. Seated mode is temporary; reload resumes at a clear walking arrival. Play equipment remains decorative in this checkpoint; animated slide/swing activities, deeper NPC routines, companion commands and riding are next-release work.

Executed checks cover blocked-route no-teleport behavior, population/species bounds, greeting pauses, traffic headway, vehicle collision/exit, real touch seating/standing and friendly animal interaction. No physical-device performance result is claimed.
