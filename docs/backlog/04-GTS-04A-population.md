# GTS-04A. Living population, aggression and faction hostility

> Status: Implemented and verified on 2026-10-25, integrated with GTS-02.

## Goal

Populate the streets before combat starts. Show which player actions raise each faction's hostility.

## Population archetypes

The initial population includes civilians, Docklands melee members and gunners, and active police patrols. One street aggressor provides hostile combat without attacking civilians. Enforcers and tactical police remain future content. The screenshot's medic/pickpocket/car-jacker concepts are possible future ambient roles, not required initial features. Data contracts support three gangs and police; only Docklands gang content is implemented initially.

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

- Pedestrians populate sidewalk and street zones before the player attacks. Moving traffic remains GTS-05.
- Neutral NPCs follow their aggression rules. A faction's hostility changes independently of unrelated factions.
- Configured hostility tiers control the proportion of ranged enemies.
- Spawns are reachable and outside the visible play area. Actors navigate around buildings.
- Population stays within its budget, and restarting clears it. Hostile combat provides enough XP without farming civilians.

## Implementation review, 2026-10-25

Reviewed against committed baseline `a982ebd` and the separate, uncommitted GTS-02 changes on `main`. Implement after GTS-03A in the same worktree, with a separate task commit. The confirmed owner decisions below supersede the proposals.

- There are no NPCs, navigation graphs, factions or spawn/director budgets in the baseline. District IDs describe material palettes and must not become implicit faction ownership. Add explicit population zones and faction IDs independently of district rendering.
- GTS-02's draft map contract contains authored streets, blocks, bounds and player spawns, but no navigation or population placeholders. GTS-04A owns its map-authored sidewalks, crossings and entry routes. Validate graph clearance and connectivity against generated building footprints, including rectangular maps.
- Population placement must account for the actual camera viewport at every supported zoom and resize. A valid ground point can still be visible or disconnected. Exclude building footprints, player clearance and visible entries; defer a spawn when no valid entry exists.
- Use separate seeded streams for ambient population and faction response. Keep independent ambient and reinforcement budgets, actor pooling, bounded path requests and reduced simulation away from the player. Reset every owner on run restart and map switching.
- The proposed archetypes defer ranged gang members and patrol officers, while acceptance requires ranged composition and police response. Resolve that scope with the owner before marking those criteria implemented.
- The traffic-zone criterion means pedestrians remain present around streets. Moving vehicles belong to GTS-05 and must not become a hidden dependency of this task.
- Track permanent faction hostility separately from temporary local alert. Damage/death attribution comes from GTS-03A; repeated processing and one causal chain must not duplicate pressure or rewards. Boss spawning remains GTS-04B.
- Extend snapshot-driven HUD output with labeled faction pressure and its cause, using catalog text and existing theme roles. Run responsive checks because the current health/location/minimap layout has no hostility panel.
- Test reachable routes around buildings, crossing behavior, flight after nearby violence, witnessed crime, independent faction changes, hostility-based composition, offscreen entry, budget saturation and repeated reload cleanup. Measuring sufficient XP supply is preliminary until GTS-03B defines the leveling curve.

### Confirmed owner decisions

- Include civilians, one gang with melee members and gunners, and working police patrols in this task. Support the other two gang identities in data without spawning their unfinished content.
- Permanent faction hostility uses 0 to 100 without decay. Local alert decays after contact is lost. First damage to an individual adds 1; a faction member kill adds 3. Civilian harm affects police pressure when witnessed with line of sight. No rival-faction friendship bonus.
- Civilians award XP, as do hostile actors. The low civilian reward is not the primary progression source.
- A Space press engages the neutral person ahead and allows continued autoattack on that individual while fleeing. Selection alone is not a crime.

Initial implementation tuning: local alert waits 8 seconds after last visible hostile contact, then loses 4 points/second. A causal chain contributes at most 8 progress points per faction. Civilian and police witnesses within 260 units can report crime. Direct victims and same-faction witnesses respond immediately; faction-wide reinforcement tiers start at 10, 25, 50 and 75. Existing Docklands theme identity is the initial gang; the remaining data identities are Velvet Ward and Rust Union. Bosses and vehicles remain separate tasks.

Baseline verification: Node.js 22.22.1, clean `npm ci`, token checks, TypeScript, lint, formatting, all 14 unit tests and production build passed. The first browser suite passed 45 of 46 tests. The perspective test lost `window.__gameDebug` during execution; its isolated rerun passed. The full `npm run check` is therefore not yet recorded as passing. No combat or population code was changed during this review.

## Implementation and limits

The authored Westbridge population map has 144 sidewalk/crossing nodes, collision-checked against the map's ground footprints. Breadth-first routes stay within the connected component reachable from the player. Civilians wait 0.8 seconds at defined crossings, choose destinations and flee toward reachable exits after witnessed violence. Docklands members patrol an explicit population zone independently of district material colors. Officers patrol and react to witnessed crime.

Ambient density is capped at 44 actors, responses at 16, each faction at 24, and combat at 64 actor slots and 96 projectile slots. Four planning requests per 0.25 seconds bound route work. Actors farther than 900 units update movement at 0.25-second intervals. Separate ambient and reinforcement seeds do not advance map generation randomness. Offscreen distant actors retire; local alert can end an offscreen response. The initial population is established before the loading screen reveals the city; every later entry excludes the current camera rectangle plus a 40-unit margin and the player's 70-unit clearance. Missing valid entries defer spawning.

Tier composition is explicit configuration. Gang ranged weights are 20%, 45%, 70% and 85% across the four response tiers. Police use officers for ranged roles and baton melee members for close response. Initial squad sizes are 2, 3, 4 and 4; intervals pace reinforcements without affecting future boss eligibility. Permanent progress stays separate from alert and future boss-chain state. Unimplemented gangs have pressure state but no ambient actors.

The HUD reports Docklands and police pressure with a visible latest crime contribution. XP is counted without level choices until GTS-03B. Pedestrian movement, flee behavior, police reporting, independent pressure, graph connectivity, response composition, camera exclusion and reset behavior have unit/browser coverage. Full-map density and XP pacing still need later progression playtests; the current 44-actor budget is an initial performance and encounter tuning value.

Final integration verification: based on GTS-02 commit `e8e3907`. `PLAYWRIGHT_PORT=5175 npm run check` passed all token, type, lint, formatting, unit, build and browser checks: 33 unit tests and 52 browser tests. Coverage includes populated Westbridge → rectangular fixture map → Westbridge after a crime, fresh XP/health/hostility, crossing waits and flight, pause, death recovery, audio persistence, owned keyboard cleanup and responsive HUD layout. Fixture maps without authored population data remain empty; new map content must supply its own population definition.
