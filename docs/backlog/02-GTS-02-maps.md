# GTS-02. Map definitions and switching

> Status: Owner scope decisions confirmed on 2026-10-25. Implementation has not started.

## Goal

Load the current map through a map definition. Support switching maps without duplicating scene logic.

## Data scope

`MapDefinition` includes stable `MapId`, catalog name key, bounds, player spawns, layout source/seed, districts, building footprints/heights and surface geometry. Store the current Westbridge street layout explicitly and preserve seeded buildings and decoration with seed 2042. Keep the current appearance, dimensions and controls.

Add detailed pedestrian navigation, vehicle lanes, civilian zones, faction territory, reinforcement entries, boss arenas and content references with their owning feature tasks. Do not require unused placeholder data in GTS-02. The future faction model remains exactly three gangs plus police. Keep visual materials, navigation and ownership distinct.

## Organization

Map definitions under `features/world/maps/<map-id>/`; balance remains with its owner (weapons/enemies/director), referenced by IDs from the map. Prefer typed `.ts` configuration with `satisfies` and small files for authored sections over one opaque giant JSON. If a visual editor is adopted, validate/import its exported JSON into the same plain-data contract instead of leaking editor objects into runtime logic.

## Switching

An app command carries a `MapId`; scene receives selected data and performs one coordinated shutdown/load. Starting/restarting a run constructs fresh mutable run state. Dispose old population, physics, audio and events. Shared textures reuse stable names; map-specific textures have bounded retention/eviction. World generation, physics and map drawing use the same definition; remove assumptions about 6 blocks or a fixed 2520 boundary.

## Initial deliverable

Preserve the existing Westbridge layout and controls. Implement reload/switch flow using one production definition. Validate switching with two small test definitions; these fixtures are not additional game maps or user-visible placeholder cities. Do not offer a fake selector with no alternative.

## Acceptance

- A map definition and seed reproduce the same layout.
- Invalid IDs and unreachable spawns produce descriptive errors.
- The city map and colliders use the same world bounds.
- Loading map A, then B, then A leaves no old actors, listeners or audio loops. Texture retention stays bounded.
- Run state resets, and every player spawn is reachable.
- The pause dialog offers "Restart run" separately from "Reset position". Restart reloads the same map and seed, resets run state and preserves audio preferences. Dialog focus and input follow the existing controller.

## Confirmed owner decisions

- Preserve current Westbridge with authored street data and seeded buildings/decoration. City redesign remains in GTS-07.
- Grow map data with working features instead of defining every future system now.
- Add a separate "Restart run" action to the pause dialog. Keep "Reset position" as the existing reposition action.

Restart reloads the current map with its configured seed, clears mutable run state and returns to play at its defined start. It preserves audio preferences. This does not add seed selection or another production map. Future run state must follow the same reset contract as features arrive.

## Implementation recommendations

Use plain typed map data for this task. Revisit Tiled after the GTS-07 blockout demonstrates an editing need. Rectangular bounds and test fixtures are technical preparation; Westbridge remains 2520 × 2520.

## Repository review — 2026-10-25

Reviewed against commit `99af829`. Owner answers are recorded above; implementation has not started.

- `generateCity.ts` already returns deterministic plain data. Preserve that boundary and the current Westbridge appearance, including the detailed textures added after the initial task plan.
- World configuration fixes the seed at 2042, bounds at 2520 square and spawn at (1260, 1234). Generation and ground drawing independently assume six blocks; map drawing imports the global block pitch. District lookup and map labels also use fixed coordinates. Move these assumptions into map data consumed by all readers.
- `WorldLayout.size` and the camera API assume a square. Recommend explicit width/height bounds now, with a rectangular test fixture, to support the separate GTS-07 blockout proposal without enlarging Westbridge in this task.
- Grass/path detection duplicates park geometry from ground drawing. Surface data must remain consistent with visible materials so GTS-01 footsteps survive the migration.
- Ground and roof texture keys use seed and building ID without map identity. Different definitions sharing a seed can reuse incorrect textures. Switching needs map-aware identity and bounded disposal of map-owned textures.
- The scene owns audio and listener cleanup. Existing lifecycle fixtures restart the same scene; extend verification to A → B → A, including equal-seed maps, changed bounds, current snapshots, player clearance/connectivity and resource counts. Existing spawn tests only check that its center is outside buildings.
- The current reset command only repositions the player. A full run reload needs a separate command and fresh scene state; the owner confirmed a separate pause-menu action. Preserve saved audio preferences across reloads.
- Navigation, population, factions, reinforcements and bosses do not exist yet. Recommend defining their detailed data alongside the owning tasks rather than requiring unused placeholders here. Keep the confirmed three-gangs-plus-police direction.

The owner resolved all three scope questions in this review. No remaining blocking product decision was identified. Technical recommendations above remain implementation choices within this scope. Planning does not authorize implementation.

Baseline verification: `npm run typecheck` and all 14 unit tests passed on Node.js 22.22.1. Full browser verification was not run during this planning review.
