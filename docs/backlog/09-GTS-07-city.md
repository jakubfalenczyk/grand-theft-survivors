# GTS-07. Westbridge city design

> Status: Design review. Implementation has not started.

## Goal

Build one city with distinct districts, connected routes and recognizable landmarks. Later cities will use GTS-02.

## Proposed identity and districts

Use original factions shaped by occupations, subculture and place rather than making nationality their only identity. Cultural inspiration can inform architecture, storefronts, music and names after review; none is locked in. Existing faction token names are a palette resource, not automatically four gangs: a map still has exactly three gangs plus police.

| Area                                | Proposed identity                                                   | Routes and encounters                                                 |
| ----------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Central Exchange                    | Neutral downtown, transit square, municipal offices                 | High civilian density, police presence, broad routes with side alleys |
| Greenfield                          | Neutral residential streets, small shops, park                      | Lower density, gardens/paths, fewer direct firing lines               |
| Docklands / proposed Docklands crew | Freight, docks, warehouses and contraband logistics                 | Long lanes, loading courts, cranes, convoy entries                    |
| Velvet Ward / proposed Velvet crew  | Nightlife, clubs, production studios and black-market entertainment | Dense backstreets, courtyards, strong storefront landmarks            |
| Ironworks / proposed Rust Union     | Repair shops, scrapyards and industrial salvage                     | Service lanes, rail edges, open yards and heavy cover                 |

Police operate across neutral districts and respond elsewhere. Gang members are concentrated in their territory but do not automatically attack merely because the player crossed a boundary; D02 and hostility still apply. Borders overlap through neutral transition streets, not invisible hard encounter walls. Boss arenas and raid entries must connect to public roads.

## Layout concept

A neutral central transit loop connects the five areas. Docklands sits west/southwest, Velvet east, Ironworks north, and Greenfield south/southeast. Three broad arteries support traffic and emergency entries; narrower parallel foot routes connect courtyards and parks. At least two paths connect each major area; no essential district is a single long dead end. A canal/rail corridor can create readable edges with multiple bridges, without copying a GTA map.

Landmarks: exchange square, water tower, club frontage, scrapyard crane and greenhouse park. Each should read from the gameplay camera, have a map name and provide a tactical route choice. District transitions change materials, signage, ambient population and sound together. Buildings remain collision-aware; do not place decorative passages that look walkable but are blocked.

## Scale and exploration

At 176 units/s even the current city width is crossed in about 14.3 seconds on a clear straight road; city width alone is not an exploration budget. A larger area may extend travel but does not automatically create interesting discovery. One 15 to 20 minute run should leave locations undiscovered, while keeping the city small enough to navigate.

Block out roughly 10 × 8 blocks (about 4200 × 3360 at the existing 420-unit pitch) as an experiment, not a committed size. Measure camera coverage, routes, landmark discovery and engaged exploration rather than only corner-to-corner speed. A focused faction route should reveal part of the city; clearing every street/side location should take additional runs. Test that a player intentionally sprinting a sweep cannot trivially discover everything before choosing the final map dimensions.

If a compact outdoor-only layout cannot satisfy that goal, discuss denser authored courtyards/interiors, randomized side encounters or softer "new locations to discover on later runs" rather than silently making an enormous empty map or slowing movement. Interiors are not already in scope. Chunk/tile ground rendering should precede scaling beyond the present texture; do not create one huge world bitmap.

## Deliverables

Annotated district/road blockout, neutral/hostile population overlay, navigation graph, faction boundaries and labeled landmarks; one polished representative block; then full pass based on combat/traffic playtests. Editable plain map data is the primary artifact; adopt a visual editor only after agreeing on import ownership and collision data.

## Acceptance

- Sidewalks and roads connect every required spawn, district and boss arena.
- Each district has at least two major routes and recognizable materials and landmarks.
- Population follows district definitions. Traffic enters outside the initial view.
- The player cannot start trapped. Textures stay within the chosen device limits.
- Traversal and exploration playtests inform the final dimensions. The HUD and city map use the same layout and message keys.
