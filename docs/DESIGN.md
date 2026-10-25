# Game design

Updated 2026-10-25. This document separates implemented behavior from the owner's requested direction. Detailed future tasks belong in [the backlog](backlog/README.md); planning is not authorization to implement them.

## Implemented baseline

Grand Theft Survivors is a top-down browser game set in Westbridge. A typed map definition loads its existing 6 × 6 street grid, 2520 units per side, with buildings and decoration generated from seed 2042 and Old Town, Ironworks and Greenfield material palettes. These district palettes are separate from the planned factions.

The player starts at (1260, 1234). W/S moves forward/backward at 105 units/s; Shift runs forward at 176; A/D turns at 4.8 rad/s. Arrow keys also work. The camera keeps a fixed world orientation and starts at 2× zoom. Collision uses building footprints and world bounds. Cars/trees are scenery without collision.

Height is a 2D projection: `P = C + (p − C) × H / (H − z)`, with virtual camera height 500 and building heights 95/130/165. Roofs expand about 1.23/1.35/1.49×, with dynamic projected facades. It is not an isometric or 3D engine. Roof motion does not move collision footprints.

The Play screen starts the game and unlocks audio after user input. Concrete and grass footsteps follow distance traveled. Interface sounds and a saved volume mixer are implemented. Minimap, full map, help, pause, fullscreen request, zoom and position reset work. The pause menu also offers Restart run, which reloads Westbridge with the same seed and a fresh player state while preserving sound settings and camera zoom. GTS-03A adds 100 player health, a starting pistol, actor damage, death and XP. Space engages a neutral person ahead; default auto-fire targets hostile actors. A triangle marks the candidate and a ring marks the chosen target. Civilians award 2 XP, melee actors 12, gunners 16 and officers 18. GTS-04A supplies civilians, Docklands melee members and gunners, and police patrols before combat. Pedestrians walk sidewalks and wait at crossings; witnesses flee or respond to crimes. One street aggressor enables combat without farming civilians. Docklands and police hostility are shown separately with the latest crime contribution. Progress never decays; local alert does after contact is lost. Response tiers alter squad composition, including ranged proportions. There are no level-up choices, active vehicles or music. All player-facing text is English and comes from the localization catalog. Material colors restore a subdued city palette while preserving Kerbside UI roles; see `THEMING.md`.

## Requested direction, awaiting detailed review

A living city rather than arbitrary timed monster waves: pedestrians follow sidewalks, cars use streets, and three gangs plus the police react to player actions. Neutral civilians can be attacked for XP. Hostility to each faction independently drives aggression, reinforcements, vehicle raids and bosses. Timed pressure may help pacing but must not replace the faction response model.

A run targets roughly 15 to 20 minutes without a hard timer deciding success. The player begins with a pistol. Level-ups pause the action and offer three applicable upgrades to owned weapons. Boss crates offer three new weapon choices. Maxed weapon combinations can evolve into original stronger weapons. Weapons, upgrades, enemy stats, hostility thresholds and directors must be easy to tune from typed configuration.

Each map supports three gangs and police. Defeating the final boss in any one faction's chain is the proposed win condition; it does not require clearing all four factions. Owner decision D01: bosses trigger solely from hostility thresholds, without a time requirement or three-minute interval. D02: auto-fire targets hostiles; neutral NPCs require deliberate provocation. D03: four bosses per faction chain. D04: no global concurrent boss cap; all provoked factions may send a boss simultaneously, while each faction advances its own chain in order.

Westbridge should combine neutral downtown/suburbs and three distinct gang territories, with shortcuts and landmarks that reward replay. Exact size should follow traversal measurements: a city too large to discover in one run can conflict with readable navigation, mobile performance and 15 to 20 minute pacing. No final map dimensions or faction identities are approved.

Rare wandering parody groups may appear near the player, flee when attacked and award a bonus if all members are defeated. Their marker must be distinct from bosses. Character concepts should be original; no direct Elvis/GTA character copy. See the proposed alternatives in the backlog.

## Historical context

The first version used olive procedural art; the first Kerbside pass replaced it with exclusively neutral materials. Version 0.3.0 adds subdued physical material colors without changing movement, geometry or UI accents. Earlier JavaScript files were replaced by strict TypeScript feature modules; current architecture is described in `ARCHITECTURE.md`.

Reference screenshots in `sources/` are research only. No Rockstar/DMA sprites, logos or Vampire Survivors art are included in the game.

## World-art direction

Use detailed top-down pixel art with 128 × 128 or larger standalone source frames, a rich RGBA material palette and thin outlines. Roof tiles, metal seams, glass, masonry and foliage should read as distinct materials. Keep hard shadows and nearest sampling. The interface keeps its Kerbside typography and semantic colors. See [the pixel-art standard](art/PIXEL-ART.md) for scale, palette and review rules.
