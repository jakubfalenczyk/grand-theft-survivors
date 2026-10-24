# GTS-05. Street traffic, collisions and destructible vehicles

> Status: Design review. Implementation has not started.

## Goal

Add moving traffic, vehicle collisions and destruction. Player driving remains out of scope.

Use map lane graphs with directed segments, intersection rules, stopping/unloading points and reachable spawn/despawn routes. Spawn vehicles at offscreen entry nodes using seeded demand and per-zone/global caps. They follow lanes, keep separation and brake for blocked intersections. A wreck must not permanently deadlock the whole city; define rerouting/cleanup policy and avoid deleting a wreck in view.

Turn parked decorative cars into independent vehicle data/entities when migrating a block; remove their painted ground counterparts so the same car does not exist twice. Static versus moving vehicles have separate collision/physics handling. Bodies match the intended visible footprint. Proposed first pass: traffic yields to a visible player where possible, contact blocks/pushes gently; damage on impacts is an explicit later tuning decision. No unavoidable offscreen high-speed runovers.

Vehicle configuration: archetype ID, art/frame IDs, dimensions, mass/response, health, movement/turn/braking limits, faction/occupants, damage filters, explosion radius/damage/falloff, warning phase, debris lifetime, spawn weights and cap. Shared damage events allow player/NPC attacks to damage cars.

Explosions apply one bounded area-damage event per vehicle, record the instigator/causal chain, and can ignite adjacent vehicles according to explicit limits. Explosion damage to civilians/factions feeds the same attribution/hostility pipeline. No repeated per-frame death effects or recursive infinite explosion calls. Simulation resolves chain reactions through a bounded event queue. Decide player friendly fire and car explosion warning duration before tuning damage.

## Acceptance

- Vehicles follow reachable lanes, and blocked intersections recover.
- Player and NPC attacks can destroy a vehicle. Each vehicle explodes once, with no duplicate XP.
- Chain reactions terminate within the damage and actor budgets.
- Destroying an independent car leaves no painted copy on the ground.
- Traffic survives pause, resume and map changes. A playtest checks crowded intersections.
- Player driving remains unavailable.
