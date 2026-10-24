# GTS-02. Map definitions and switching

> Status: Design review. Implementation has not started.

## Goal

Load the current map through a map definition. Support switching maps without duplicating scene logic.

## Proposed data

`MapDefinition` with stable `MapId`, catalog name key, bounds, player spawns, layout source/seed, districts, building footprints/heights, walkable surfaces, sidewalks, lane/road graph, civilian zones, faction territory, reinforcement entry points, boss arenas, landmarks and content pack IDs. Faction data references exactly three gang IDs plus police. Keep visual materials, navigation and ownership distinct.

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

## Decisions needed

Choose between an authored street layout with seeded decoration and a generated street layout. The recommendation is an authored layout. Decide whether Tiled would help after the first blockout.
