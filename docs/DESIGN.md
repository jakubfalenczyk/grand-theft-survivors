# Game design

Updated 2026-10-24. This document separates implemented behavior from the owner's requested direction. Detailed future tasks belong in `BACKLOG.md`; planning is not authorization to implement them.

## Implemented baseline

Grand Theft Survivors is a browser prototype with an original top-down Westbridge city and Kerbside interface. Seed 2042 generates a fixed 6 × 6 grid, 2520 units per side, with Old Town, Ironworks and Greenfield material palettes. These are visual prototype districts, not implemented factions.

The player starts at (1260, 1234). W/S moves forward/backward at 105 units/s; Shift runs forward at 176; A/D turns at 4.8 rad/s. Arrow keys also work. The camera keeps a fixed world orientation and starts at 2× zoom. Collision uses building footprints and world bounds. Cars/trees are scenery without collision.

Height is a 2D projection: `P = C + (p − C) × H / (H − z)`, with virtual camera height 500 and building heights 95/130/165. Roofs expand about 1.23/1.35/1.49×, with dynamic projected facades. It is not an isometric or 3D engine. Roof motion does not move collision footprints.

Minimap, full map, help, pause, fullscreen request, zoom and position reset work. Health is a labeled preview. There are no enemies, damage, weapons, progression, active vehicles or sound. All player-facing text is English and comes from the localization catalog. Material colors restore a subdued city palette while preserving Kerbside UI roles; see `THEMING.md`.

## Requested direction, awaiting detailed review

A living city rather than arbitrary timed monster waves: pedestrians follow sidewalks, cars use streets, and three gangs plus the police react to player actions. Neutral civilians can be attacked for XP. Hostility to each faction independently drives aggression, reinforcements, vehicle raids and bosses. Timed pressure may help pacing but must not replace the faction response model.

A run targets roughly 15–20 minutes without a hard timer deciding success. The player begins with a pistol. Level-ups pause the action and offer three applicable upgrades to owned weapons. Boss crates offer three new weapon choices. Maxed weapon combinations can evolve into original stronger weapons. Weapons, upgrades, enemy stats, hostility thresholds and directors must be easy to tune from typed configuration.

Each map supports three gangs and police. Defeating the final boss in any one faction's chain is the proposed win condition; it does not require clearing all four factions. The exact number of bosses and trigger policy remain open. The earlier idea of a boss every three minutes conflicts with hostility-driven bosses and needs an explicit decision.

Westbridge should combine neutral downtown/suburbs and three distinct gang territories, with shortcuts and landmarks that reward replay. Exact size should follow traversal measurements: a city too large to discover in one run can conflict with readable navigation, mobile performance and 15–20 minute pacing. No final map dimensions or faction identities are approved.

Rare wandering parody groups may appear near the player, flee when attacked and award a bonus if all members are defeated. Their marker must be distinct from bosses. Character concepts should be original; no direct Elvis/GTA character copy. See the proposed alternatives in the backlog.

## Historical context

The initial prototype used olive procedural art; the first Kerbside pass replaced it with exclusively neutral materials. Version 0.3.0 adds subdued physical material colors without changing movement, geometry or UI accents. Earlier JavaScript prototype files were replaced by strict TypeScript feature modules; current architecture is described in `ARCHITECTURE.md`.

Reference screenshots in `sources/` are research only. No Rockstar/DMA sprites, logos or Vampire Survivors art are included in the game.
