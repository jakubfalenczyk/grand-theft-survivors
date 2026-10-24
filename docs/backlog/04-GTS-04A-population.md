# GTS-04A. Living population, aggression and faction hostility

> Status: Design review. Implementation has not started.

## Goal

Populate the streets before combat starts. Show which player actions raise each faction's hostility.

## Population archetypes

Start with civilians, gang members and a hostile melee actor. Later add enforcers, ranged gang members, patrol officers and tactical police. The screenshot's medic/pickpocket/car-jacker concepts are possible future ambient roles, not required initial features. Start with civilians and one gang; data contracts support three gangs and police without pretending that all content is already complete.

## Navigation

Authored sidewalk/lane graphs from map data, lightweight local steering and bounded path requests. Civilians choose valid destinations and wait/cross at defined crossings. They react to nearby violence and flee toward reachable exits. Gangs idle/patrol their district; aggression depends on that faction's hostility. Police respond to witnessed/local crime and escalate independently. Spawn must use valid, reachable points outside the camera or masked entry routes, not in buildings or on the player's position.

## Hostility proposal

Track hostility separately for each faction. Keep permanent boss progress separate from temporary local alert. The HUD can call them "Hostility" with a clear 0 to 100 scale; internal names use one consistent direction (larger means more hostile). No automatic rival-gang friendship bonus unless approved.

Example starting values: direct member kill +3, faction vehicle destruction +5, boss defeat advances the chain once. Civilian harm adds police pressure with reduced/no effect on unrelated gangs. Cap per-event and per-causal-chain contributions so a single explosion does not accidentally summon every boss; still reward actual damage outcomes. Exact values, witness rules and whether local alert decays remain open. Permanent boss progression must not decay into an unclear retreating goal.

## Director

Population density and reinforcement pressure are different budgets. Faction response uses hostility tier, district, threat already present and valid entry points. Reinforcement intervals are allowed for pacing squads, but must not become a hidden time gate on boss triggers. Early responses favor melee; later hostility tiers increase ranged ratios and specialist frequency. Enemies are not promoted to ranged just because elapsed time passes. Bounded pools for actors/projectiles, caps per faction and global cap, visibility-aware simulation and separate randomness streams are required with this feature.

## Configuration

Archetype health/speed/contact damage/range/attack cues/XP/behavior; zone density and mix; faction thresholds/response compositions; director budgets, costs, squad size, melee/ranged weights, response intervals, distance ranges, retreat/despawn rules and concurrency limits. Store encounter composition tables instead of "if minute > N" code in scene updates.

## Acceptance

- Civilians and traffic zones remain populated before the player attacks.
- Neutral NPCs follow their aggression rules. A faction's hostility changes independently of unrelated factions.
- Configured hostility tiers control the proportion of ranged enemies.
- Spawns are reachable and outside the visible play area. Actors navigate around buildings.
- Population stays within its budget, and restarting clears it. Hostile combat provides enough XP without farming civilians.
