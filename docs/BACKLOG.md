# Planned work — design review backlog

Created 2026-10-24. **Planning only. None of these gameplay tasks is started, scheduled or implemented.** Task IDs are durable references for discussion; this file is the backlog, not a list of running agent chats. Numerical proposals are tuning seeds, not approved final balance.

## Confirmed direction and decisions

- A living city with civilians, traffic, three gangs and police per map. Escalation reacts to player actions instead of arbitrary timed enemy waves.
- Start with a pistol. Character levels offer three applicable upgrade choices for owned weapons; boss crates offer three new weapon choices. Maxed weapons can combine into original evolutions.
- **D01 — confirmed by owner:** faction bosses trigger only from hostility thresholds. No three-minute schedule, minimum elapsed time or time cooldown gates their appearance. This supersedes the initial three-minute boss suggestion.
- **D02 — confirmed by owner:** automatic fire targets hostile enemies; attacking/provoking neutral NPCs is a deliberate player action. The exact input and target selection are still a design proposal.
- **D03 — confirmed by owner:** each faction has four bosses in an ordered chain. Defeating boss four of any faction wins the map.
- **D04 — confirmed by owner:** no global concurrent boss limit or cross-faction arrival queue. Every eligible faction may send its boss immediately even when other factions have active bosses. Within each faction, the next chain member follows its predecessor's defeat.
- A run targets roughly 15–20 minutes. Killing the final boss of any one faction's chain completes the map. Time is a balancing outcome, not a boss trigger or forced victory timer.
- Future maps are separate content tasks; provide map selection architecture while retaining one implemented map initially.
- No player driving in the traffic task. Vehicles can collide, take damage and explode.
- All shipped text is English catalog content. All game balance lives in explicit, validated feature configuration. No values are copied from reference games.

## Proposed implementation sequence

| Order | Task                                          | Depends on                        | First reviewable deliverable                                                |
| ----- | --------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| 1     | GTS-01 Audio foundation                       | Current prototype                 | User-gesture unlock, UI sounds and material footsteps                       |
| 2     | GTS-02 Map definitions and switching          | Current prototype                 | Current Westbridge loaded through a typed map definition; repeatable reload |
| 3     | GTS-03A Combat and damage foundation          | GTS-02                            | Pistol, deliberate provocation, one civilian and one attacker               |
| 4     | GTS-04A Living population and hostility       | GTS-03A                           | Sidewalk movement, independent faction response and readable hostility      |
| 5     | GTS-03B XP, upgrades and weapon content       | GTS-03A, GTS-04A                  | Three real upgrade choices and a small usable weapon roster                 |
| 6     | GTS-04B Raids, faction bosses and rare groups | GTS-03B, GTS-04A                  | First complete action → hostility → boss → crate loop                       |
| 7     | GTS-05 Traffic and destructible vehicles      | GTS-02, GTS-03A, GTS-04A          | Lane traffic, collisions and attributed explosions                          |
| 8     | GTS-06 Run progression and completion         | GTS-03B, GTS-04B                  | One complete faction chain, clear victory and run summary                   |
| 9     | GTS-07 Authored Westbridge city               | GTS-02; iterate against GTS-04–06 | One coherent district/road design, then measured full-map iteration         |

City blockouts and playtest routes are prerequisites for validating population/traffic, but full art production waits for a playable loop. GTS-07 is a content design task that can be discussed early; no second city is created under GTS-02.

## GTS-01 — Replaceable, event-driven audio

**Goal:** audible UI and movement now, a clear path to weapons/traffic later, without scattering sound filenames through gameplay.

**Proposed structure:** feature-owned audio manifest and a Phaser audio adapter. Game features emit semantic cues such as `player:footstep`, `weapon:fired`, `actor:hit`, `vehicle:exploded`; UI emits menu intents through the existing typed boundary. Resolve these cues to `SoundId`, variant keys and mix settings in one place. Do not put Phaser sound objects in shared events or build a generic plugin framework.

**Configuration:** asset ID/URLs (browser-tested codecs), variant weights, bus (`master`, `sfx`, `ambience`, `ui`), gain, pitch range, cooldown, priority, maximum simultaneous voices, spatial falloff and loop policy. Footstep selection uses a material ID from world data. Playback cadence follows traveled distance/animation markers, not a frame counter. Walking/running cadence changes without changing movement balance. Audio randomness has a separate seed/stream from gameplay.

**Lifecycle:** unlock on a real user gesture; make muted/unavailable audio a playable state. Own and clean up subscriptions and sound handles; prevent duplicate loops on scene restart. Pause should stop/fade world ambience and effects while allowing menu confirmation sounds. UI volume/mute preferences may persist locally; handle unavailable storage. Loading failure reports a readable status without blocking the game.

**Candidate audition:** use existing `AUDIO-CANDIDATES.md`, audition UI and concrete/grass footsteps first. Preserve exact downloaded license and selected filenames before integration. SnakeF8 gun packs are candidates for GTS-03; large rawAmbience recordings remain blocked on clarifying redistribution terms. Do not ship entire downloaded archives. No download/integration is performed by this planning task.

**Acceptance:** swapping a manifest entry changes the sound without gameplay edits; no playback before unlock; mute/volume work; missing audio remains playable; pause/resume/restart do not multiply sounds; rapid events stay within voice limits. Browser checks cover actual playback state, not just calls to a mocked function. Include a focused listening pass for fatigue and loudness.

**Open:** approve a short audition set, ambience direction and whether mute settings persist between sessions.

## GTS-02 — Typed map definitions and safe switching

**Goal:** one current map behind an explicit map contract, with a real path to loading another map later.

**Proposed data:** `MapDefinition` with stable `MapId`, catalog name key, bounds, player spawns, layout source/seed, districts, building footprints/heights, walkable surfaces, sidewalks, lane/road graph, civilian zones, faction territory, reinforcement entry points, boss arenas, landmarks and content pack IDs. Faction data references exactly three gang IDs plus police. Keep visual materials, navigation and ownership distinct.

**Organization:** map definitions under `features/world/maps/<map-id>/`; balance remains with its owner (weapons/enemies/director), referenced by IDs from the map. Prefer typed `.ts` configuration with `satisfies` and small files for authored sections over one opaque giant JSON. If a visual editor is adopted, validate/import its exported JSON into the same plain-data contract instead of leaking editor objects into runtime logic.

**Switching:** an app command carries a `MapId`; scene receives selected data and performs one coordinated shutdown/load. Starting/restarting a run constructs fresh mutable run state. Dispose old population, physics, audio and events. Shared textures reuse stable names; map-specific textures have bounded retention/eviction. World generation, physics and map drawing use the same definition; remove assumptions about 6 blocks or a fixed 2520 boundary.

**Initial deliverable:** preserve the existing Westbridge layout and controls. Implement reload/switch flow using one production definition. Validate switching with two small test definitions; these fixtures are not additional game maps or user-visible placeholder cities. Do not offer a fake selector with no alternative.

**Acceptance:** same definition/seed reproduces layout; invalid IDs and unreachable spawn points fail descriptively; map/minimap bounds and colliders agree; A → B → A test leaves no old bodies/listeners/loops, no unbounded texture growth; player spawn stays reachable; run state does not leak between maps.

**Open:** curated city with seeded decoration (recommended) versus procedural topological layout; whether to adopt Tiled for visual authoring after the first blockout.

## GTS-03A — Combat foundation and deliberate provocation

**Goal:** a testable damage pipeline before designing dozens of upgrades.

**Scope:** health, damage/death and XP ownership; pistol auto-target/fire; projectiles; one neutral civilian and one hostile melee actor. Weapon state, target selection, damage and actor rendering stay separate. Use a bounded projectile pool from the first projectile feature.

**D02 behavior:** auto-fire considers actors already hostile to the player. Proposed input: hold Space to aim/fire at a neutral target inside a facing cone. Show the selected neutral target before an attack. A successful damaging attack creates the provocation event; merely facing someone does not. Auto-fire must not silently attack unprovoked civilians, neutral gang members, neutral police or traffic. Discuss whether one deliberate hit should allow continued auto-targeting of that individual while they flee.

**Selection details:** hostile auto-targeting uses nearest reachable target within range and line of sight, with a small lock hysteresis. Do not require enemies to remain directly in front if that makes tank controls frustrating; facing-cone restriction is proposed only for deliberate neutral selection. Do not select actors through buildings or outside weapon range. Defer mouse aiming unless the owner prefers it.

**Damage contract:** source actor/faction, instigator, weapon/effect ID, amount/type, world position and causal chain ID. One resolved death emits one reward/hostility event. The causal chain is needed for explosions and faction attribution later. Define collision/team filters explicitly; enemy-friendly-fire and civilian collateral are decisions, not default physics accidents.

**Proposed pistol tuning seed:** 12 damage, 0.6 s cooldown, 300-unit targeting range and 500-unit/s projectile speed, no penetration. These require a dummy/enemy health comparison and a movement playtest. Do not copy GTA damage or VS cooldowns.

**Acceptance:** cooldown is stable across frame rates and pauses; one projectile cannot reward a death twice; walls block shots; auto-fire ignores neutrals; deliberate provocation changes exactly the intended actors/faction; run restarts clear damage state. Define a concrete maximum concurrent projectile count and profile it.

## GTS-03B — XP, three-choice upgrades, weapon roster and evolutions

**Goal:** visible build choices that preserve weapon identity and are easy to rebalance.

### Upgrade and reward rules — proposal

- Start with pistol rank 1. Proposed capacity: four weapon slots; proposed base weapon cap: rank 8. Both are open tuning decisions.
- Each character level queues one modal offering up to three distinct, eligible upgrades to owned weapons. A selected upgrade raises that weapon's rank once. Its effect also has its own tier/cap and prerequisites; max rank blocks further ordinary upgrades regardless of unused branches.
- Seeded weighted selection without replacement, filtered before drawing. At the opening pistol-only stage provide at least three useful branches. Never offer new weapons through ordinary level-ups.
- Multiple levels gained together queue choices; game simulation stays paused until all choices are handled. Selection commits once, even with repeated input. UI uses the existing modal/session model extended explicitly for reward selection, not a second pause boolean.
- Boss crates offer three unowned base weapons when that many are eligible. No duplicates to manufacture a third option. If fewer remain, show the actual count and an explicit fallback reward. At capacity, support an explicit replacement confirmation with a clear lost-upgrade preview or offer a non-weapon fallback. Never silently delete a weapon.
- Proposed evolution trigger: eligible recipes become an explicit level-up choice once both ingredients are max rank. This preserves boss crates as new-weapon rewards. A recipe atomically consumes both ingredients, grants one evolved weapon and frees one slot. No forced evolution or hidden loss of upgrades.
- Evolved weapon stats are specified directly or through an explicit recipe transform. Do not accidentally carry random ingredient multipliers twice. Initially evolved weapons have no further rank upgrades; eligible ordinary choices still target remaining base weapons.
- If fewer than three weapon upgrades exist, show real eligible choices plus configured recovery rewards. If everything is maxed, offer recovery/bonus choices; never stall the level-up modal. Health fallback is useful only if health is missing.

### Base roster concept

All names and behaviors below are proposals. The supplied GTA 2 screenshot motivates recognizable weapon families, not copied sprites, sound, damage tables or exact mechanics. Stage content delivery: pistol + machine pistol + shotgun first; thrown fire/explosives next; electrical/other families after the loop works.

| Base weapon               | Intended identity                                  | Upgrade branches                                                                                          |
| ------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Pistol                    | Precise, reliable single-target starter            | Trigger speed, calibrated damage, extra sequential shots, paired/opposed shot pattern                     |
| Twin Pistols              | Alternating left/right rhythm, wider coverage      | Alternation speed, paired volleys, side/rear coverage, damage                                             |
| Machine Pistol            | Short bursts with recovery windows                 | Burst length, recovery time, controlled spread, penetration cap                                           |
| Suppressed Machine Pistol | Controlled bursts and reduced local noise response | Accuracy, burst pacing, damage, later rear coverage; suppression never cancels hostility for actual kills |
| Shotgun                   | Short-range cone with strong stagger               | Pellet count, cone width/focus, knockback, recovery time                                                  |
| Flamethrower              | Sweeping short-range sustained zone                | Reach, sweep angle, burn duration, tick rate with per-target hit interval                                 |
| Rocket Launcher           | Slow high-impact projectile and splash             | Blast radius, reload interval, damage, late split payload                                                 |
| Electro Projector         | Conductive arcs to nearby additional targets       | Chain count, jump distance, pulse interval, temporary slow                                                |
| Molotov                   | Thrown impact fire puddles, route denial           | Puddle area, duration, throw count, burn damage                                                           |
| Grenades                  | Arced timed blasts, crowd disruption               | Fuse tuning, blast area, throw count, fragments                                                           |

Multishot is not one global counter: a shotgun pellet, an SMG burst round, a rocket split and an extra fire zone have different damage/CPU costs. Separate volley count, projectiles per volley, interval, direction pattern and spread. Every upgraded behavior has a bounded simultaneous projectile/effect count. No player fists system or mounted vehicle weapons is required by this roster; those items in the reference are deferred scope.

### Original union proposals

| Maxed ingredients                        | Result (working name) | Distinct behavior                                               |
| ---------------------------------------- | --------------------- | --------------------------------------------------------------- |
| Pistol + Machine Pistol                  | Crossfire Rig         | Accurate opening shots followed by rotating short bursts        |
| Twin Pistols + Suppressed Machine Pistol | Ghost Circuit         | Alternating arcs with a rear-cover volley                       |
| Shotgun + Electro Projector              | Arc Breacher          | Conductive pellet cone, bounded short chains on marked targets  |
| Flamethrower + Molotov                   | Street Kiln           | Directional flame lays a temporary burning route behind impacts |
| Rocket Launcher + Grenades               | Demolition Chorus     | Heavy impact followed by a staggered ring of small blasts       |

Recipes consume compatible maxed weapons irrespective of their random upgrade path. Offer clear hints in the weapon panel before the player invests. Check recipes for cycles, missing inputs, duplicate IDs and unreachable results. Review whether every base weapon needs a union immediately; the table currently covers all ten without forcing all ten into the first content delivery.

### Configuration contract

Proposed files under the weapons/progression features: `weapons.ts`, `upgrades.ts`, `evolutions.ts`, `xpCurve.ts`, `rewardPools.ts`. Runtime data uses stable IDs; labels/descriptions are catalog keys. Config is plain data checked by `satisfies` plus startup validation, not callbacks containing hidden balancing numbers.

Weapon fields: ID, name/description/icon/asset/cue IDs, behavior enum, damage/type, cooldown seconds, range, projectile speed/lifetime, volley pattern, pierce, spread radians, area/duration/tick interval, knockback and pool limits. Upgrade fields: eligible weapon/tag, weight, prerequisites, cap, per-tier effect and clamps. Recipe fields: ingredient IDs/ranks, result ID, consumption and availability rule. No string evaluation or a general-purpose scripting language.

For numeric upgrades use an explicit order: base → additive changes → bounded multipliers → hard caps. Derive cooldown from fire-rate factors consistently; “20% faster fire rate” and “20% shorter cooldown” must not be treated as identical. Quantize integer counts after computation. Define damage-per-activation and compare estimated sustained damage, coverage and crowd-control cost; DPS alone will not value area denial correctly.

**XP tuning seed:** target roughly 20–30 character levels over a 15–20 minute active run, with early meaningful choices and no requirement to farm civilians. Test whether enough ranks/crates are available to see a union before a concentrated faction victory. This target is not a boss time gate. Define recovery from a weak build and a policy for excess XP after maxing.

**Acceptance:** deterministic offers for a seed/input stream; no ineligible/duplicate choices; all slots/maxed/exhausted pool cases resolve; queued choices work; union ingredients are consumed once; balance tweaks require no renderer changes; UI previews actual numeric effects; long runs respect pool limits. Compare strong/weak upgrade paths, not just the default path.

**Open:** slot count, rank cap, replacement/fallback policy, evolution trigger, health/healing and the starting three-weapon vertical slice.

## GTS-04A — Living population, aggression and faction hostility

**Goal:** streets feel populated before combat, and the player understands why escalation happens.

**Population archetypes:** wandering civilian, fleeing civilian, gang member, melee enforcer, ranged member, patrol officer and later tactical police. The screenshot's medic/pickpocket/car-jacker concepts are possible future ambient roles, not required initial features. Start with civilians and one gang; data contracts support three gangs and police without pretending that all content is already complete.

**Navigation:** authored sidewalk/lane graphs from map data, lightweight local steering and bounded path requests. Civilians choose valid destinations and wait/cross at defined crossings. They react to nearby violence and flee toward reachable exits. Gangs idle/patrol their district; aggression depends on that faction's hostility. Police respond to witnessed/local crime and escalate independently. Spawn must use valid, reachable points outside the camera or masked entry routes, not in buildings or on the player's position.

**Hostility proposal:** four independent records with stable faction IDs; separate permanent run escalation points/boss milestones from temporary local alert. The HUD can call them “Hostility” with a clear 0–100 scale; internal names use one consistent direction (larger means more hostile). No automatic rival-gang friendship bonus unless approved.

Example tuning seeds: direct member kill +3, faction vehicle destruction +5, boss defeat advances the chain once. Civilian harm adds police pressure with reduced/no effect on unrelated gangs. Cap per-event and per-causal-chain contributions so a single explosion does not accidentally summon every boss; still reward actual damage outcomes. Exact values, witness rules and whether local alert decays remain open. Permanent boss progression must not decay into an unclear retreating goal.

**Director:** population density and reinforcement pressure are different budgets. Faction response uses hostility tier, district, threat already present and valid entry points. Reinforcement intervals are allowed for pacing squads, but must not become a hidden time gate on boss triggers. Early responses favor melee; later hostility tiers increase ranged ratios and specialist frequency. Enemies are not promoted to ranged just because elapsed time passes. Bounded pools for actors/projectiles, caps per faction and global cap, visibility-aware simulation and separate randomness streams are required with this feature.

**Configuration:** archetype health/speed/contact damage/range/attack cues/XP/behavior; zone density and mix; faction thresholds/response compositions; director budgets, costs, squad size, melee/ranged weights, response intervals, distance ranges, retreat/despawn rules and concurrency limits. Store encounter composition tables instead of “if minute > N” code in scene updates.

**Acceptance:** idle city exists without combat; neutrals do not spontaneously attack; one faction's escalation does not silently mutate all other factions; ranged mix rises with configured tier; spawns remain reachable/offscreen; actors navigate around colliders; density stays bounded and restart clears population. Player can gain XP and progress through hostile combat without civilian farming.

## GTS-04B — Raids, bosses, threats and rare wandering groups

**Raids:** at sufficient faction pressure send a recognizable squad from outside view. Once GTS-05 is available, some squads arrive by car, stop at valid unload nodes, disembark and engage. Before that, foot reinforcements provide a complete working path; do not block core combat on traffic. Avoid spawning a second full raid just because one actor moved offscreen. Vehicle occupants count toward the same actor budget.

**Boss state proposal:** per faction, an ordered chain of four bosses (D03). A cumulative hostility threshold makes the next boss eligible. A short threat presentation/entrance is allowed, but there is no elapsed-time, three-minute or cooldown requirement. Only the previous boss in that faction's chain must be defeated before its successor appears. Record eligibility once and prevent duplicate summons.

If several factions become eligible together, all may send bosses immediately (D04). No global boss cap, global arrival queue or time grace period may suppress them. Each faction still advances its own chain in order; already-earned thresholds can make its next boss arrive as soon as the predecessor dies. At most one chain member per faction is alive under this ordering, allowing four faction bosses concurrently. Process same-frame eligibility/deaths deterministically. Reduce assistant counts and reserve actor capacity for boss entities rather than delaying an eligible boss because the ordinary enemy pool is full. Communicate every incoming faction independently in the HUD and map.

**Presentation:** faction name, original simple portrait, short catalogued threat, boss name/tier and clear map marker. Provide reduced-motion/skip behavior and never obscure the player's immediate danger without pausing explicitly. Bosses have assistants from the same encounter budget and legible attack tells. No bullet sponge health scaling as the only difference between tiers.

**Drops:** a resolved boss death creates one owned crate; interacting opens three-choice new-weapon rewards via GTS-03B. Define whether the crate is auto-collected or requires proximity. Boss/rare group markers need shape/icon + text, not color alone.

**Rare group concepts:** original parody archetypes, not real-person portraits or the GTA Elvis lineup. Recommended working concept: **Ring-Light Pilgrims**, a synchronized group of tracksuit “hustle” content creators carrying small square lights and filming each other. Alternatives: **Cold-Plunge Club**, robes/towels and exaggerated warm-up marching; **Prompt Gurus**, matching blazers and fake keynote placards. These are proposals for discussion, not a claim about a current meme trend.

Spawn a group rarely at valid nearby offscreen sidewalks using independent seeded chance and a population cap. Assign group/member IDs and an explicit completion ledger. Initially wander; a deliberate attack makes survivors flee in different reachable directions. One configurable bonus for defeating every member, never once per surviving entity. Mark the group and show remaining members after engagement. Set escape distance/time and completion/failure rules; ordinary distance culling cannot silently count as killing or erase a live challenge.

**Acceptance:** only hostility triggers boss eligibility; no duplicate bosses after a frame hitch/reload; chain progression cannot skip predecessor defeat; several eligible factions are handled visibly; threat/portrait clean up; crates resolve once; rare group bonus pays once only on full completion. Unit tests cover simultaneous damage and final-member escape/death ordering.

**Confirmed:** four bosses per faction; simultaneous bosses across all eligible factions.

**Open:** boss identities, crate pickup interaction and rare group concept/reward.

## GTS-05 — Street traffic, collisions and destructible vehicles

**Goal:** visible ordinary traffic before player driving exists.

Use map lane graphs with directed segments, intersection rules, stopping/unloading points and reachable spawn/despawn routes. Spawn vehicles at offscreen entry nodes using seeded demand and per-zone/global caps. They follow lanes, keep separation and brake for blocked intersections. A wreck must not permanently deadlock the whole city; define rerouting/cleanup policy and avoid deleting a wreck in view.

Turn parked decorative cars into independent vehicle data/entities when migrating a block; remove their painted ground counterparts so the same car does not exist twice. Static versus moving vehicles have separate collision/physics handling. Bodies match the intended visible footprint. Proposed first pass: traffic yields to a visible player where possible, contact blocks/pushes gently; damage on impacts is an explicit later tuning decision. No unavoidable offscreen high-speed runovers.

Vehicle configuration: archetype ID, art/frame IDs, dimensions, mass/response, health, movement/turn/braking limits, faction/occupants, damage filters, explosion radius/damage/falloff, warning phase, debris lifetime, spawn weights and cap. Shared damage events allow player/NPC attacks to damage cars.

Explosions apply one bounded area-damage event per vehicle, record the instigator/causal chain, and can ignite adjacent vehicles according to explicit limits. Explosion damage to civilians/factions feeds the same attribution/hostility pipeline. No repeated per-frame death effects or recursive infinite explosion calls. Simulation resolves chain reactions through a bounded event queue. Decide player friendly fire and car explosion warning duration before tuning damage.

**Acceptance:** vehicles remain on reachable lanes; queues recover; both player/NPC attacks can destroy them; one car explodes once and awards no duplicate XP; chain reactions terminate and respect budgets; no ghost ground car remains after destruction; no player driving input is added. Test crowded intersections, pause/resume and map switch, then inspect traffic in a real play session.

## GTS-06 — Faction boss chains, run pacing and map completion

**Win condition:** defeating the final boss of any one faction chain completes the current map. With four bosses per faction confirmed, Docklands 4/4 wins even when the other two gangs and police are 0/4. This is not “defeat every faction's final boss.”

**Progress UI:** four compact faction rows show faction label, hostility, the next threshold, boss milestones, active/pending boss and next threat. Distinguish anger toward the player from player XP level. Detailed information can live in the city map; avoid covering the playable screen. Map markers reveal a boss once announced; show destination/direction when offscreen.

**State:** a run owns selected map/seed, health, XP/level, build, four faction records, boss chain outcomes and time played. Keep live mutable state distinct from immutable configuration and plain UI snapshots. Single transition from playing/reward to victory or defeat. Define simultaneous player death/final boss death and multiple final bosses dying in one frame. Proposed resolution: apply the full damage batch, then decide defeat versus victory using an explicit reviewed rule.

**Victory proposal:** freeze combat, show run summary, and include the final boss reward in the summary rather than forcing a weapon-choice modal after the run is already over. Restart resets everything; future map progression is a separate feature. No account saves, permanent upgrades or multi-city campaign are implied.

**Pacing:** 15–20 minutes is a target for ordinary active play, not a guarantee for idling, speedrunning or distributing attacks across factions. Tune thresholds, accessible faction density, reinforcement pressure, XP, boss durability and equipment supply. Record time to first provocation, first upgrade, first boss, first crate, first union and faction victory for concentrated/mixed/civilian-heavy routes. Never add a hidden elapsed-time gate to meet the target.

With four bosses confirmed, a focused route gets three new-weapon crates before the final boss and victory. Starting pistol plus three choices can fill the proposed four slots without attacking a second faction. Check union availability and XP pacing against this economy. The final boss reward is still a separate presentation decision. Avoid silently lengthening sessions by raising health alone.

A possible initial threshold table is 20 / 45 / 70 / 100 cumulative hostility per faction; these are unapproved tuning seeds. Defeating a boss records its milestone but does not automatically grant the next threshold. The fourth threshold stays earned until its boss is defeated; a focused player can win quickly if effective, while splitting hostility can create simultaneous faction boss fights. Measure both routes before tuning thresholds.

**Acceptance:** four independent tracks; clear next objective/threshold; final boss of any one faction wins once; no later queued reward reopens a live run; ordinary routes can reach an evolution; restart has no retained hostility; measured playtests report pacing distribution and idle behavior rather than claiming every run lasts 20 minutes.

**Confirmed:** four bosses per chain, no global boss concurrency limit.

**Open:** hostility thresholds, whether a final crate is summarized, simultaneous death resolution, defeat behavior and whether any post-run continuation is wanted.

## GTS-07 — One authored, replayable Westbridge

**Goal:** a compact city with distinct routes, readable landmarks and different social/combat density. Create one map first; later cities use GTS-02.

### Proposed identity and districts

Use original factions shaped by occupations, subculture and place rather than making nationality their only identity. Cultural inspiration can inform architecture, storefronts, music and names after review; none is locked in. Existing faction token names are a palette resource, not automatically four gangs: a map still has exactly three gangs plus police.

| Area                                | Proposed identity                                                   | Routes and encounters                                                 |
| ----------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Central Exchange                    | Neutral downtown, transit square, municipal offices                 | High civilian density, police presence, broad routes with side alleys |
| Greenfield                          | Neutral residential streets, small shops, park                      | Lower density, gardens/paths, fewer direct firing lines               |
| Docklands / proposed Docklands crew | Freight, docks, warehouses and contraband logistics                 | Long lanes, loading courts, cranes, convoy entries                    |
| Velvet Ward / proposed Velvet crew  | Nightlife, clubs, production studios and black-market entertainment | Dense backstreets, courtyards, strong storefront landmarks            |
| Ironworks / proposed Rust Union     | Repair shops, scrapyards and industrial salvage                     | Service lanes, rail edges, open yards and heavy cover                 |

Police operate across neutral districts and respond elsewhere. Gang members are concentrated in their territory but do not automatically attack merely because the player crossed a boundary; D02 and hostility still apply. Borders overlap through neutral transition streets, not invisible hard encounter walls. Boss arenas and raid entries must connect to public roads.

### Layout concept

A neutral central transit loop connects the five areas. Docklands sits west/southwest, Velvet east, Ironworks north, and Greenfield south/southeast. Three broad arteries support traffic and emergency entries; narrower parallel foot routes connect courtyards and parks. At least two paths connect each major area; no essential district is a single long dead end. A canal/rail corridor can create readable edges with multiple bridges, without copying a GTA map.

Landmarks: exchange square, water tower, club frontage, scrapyard crane and greenhouse park. Each should read from the gameplay camera, have a map name and provide a tactical route choice. District transitions change materials, signage, ambient population and sound together. Buildings remain collision-aware; do not place decorative passages that look walkable but are blocked.

### Scale and exploration — decision pending

At 176 units/s even the current city width is crossed in about 14.3 seconds on a clear straight road; city width alone is not an exploration budget. A larger area may extend travel but does not automatically create interesting discovery. The owner's request is that one 15–20 minute run should leave substantial content unexplored while retaining a modest city size.

Block out roughly 10 × 8 blocks (about 4200 × 3360 at the existing 420-unit pitch) as an experiment, not a committed size. Measure camera coverage, routes, landmark discovery and engaged exploration rather than only corner-to-corner speed. A focused faction route should reveal part of the city; clearing every street/side location should take additional runs. Test that a player intentionally sprinting a sweep cannot trivially discover everything before changing dimensions or promising a 20-minute exploration minimum.

If a compact outdoor-only layout cannot satisfy that goal, discuss denser authored courtyards/interiors, randomized side encounters or softer “meaningful discoveries across runs” rather than silently making an enormous empty map or slowing movement. Interiors are not already in scope. Chunk/tile ground rendering should precede scaling beyond the present texture; do not create one huge world bitmap.

**Deliverables:** annotated district/road blockout, neutral/hostile population overlay, navigation graph, faction boundaries and labeled landmarks; one polished representative block; then full pass based on combat/traffic playtests. Editable plain map data is the primary artifact; adopt a visual editor only after agreeing on import ownership and collision data.

**Acceptance:** connected sidewalks/roads, reachable spawn and arenas, at least two major routes per district, distinguishable materials/landmarks, gang density corresponding to map data, traffic entries outside initial view, no unavoidable spawn traps, bounded textures and measured traversal/exploration. World map/HUD use the same data and catalog keys.

## Discussion queue

Resolve these progressively, not in one long questionnaire:

1. Hostility thresholds and boss identities; chain length is four and simultaneous faction arrivals have no global limit (confirmed).
2. Weapon slots/rank cap, crate replacement and evolution choice rules.
3. Original gang identities and the rare group concept.
4. Curated topology, map scale and what “not fully explored in one run” should mean in playtests.
5. Damage/XP policy for civilians, collateral explosions and simultaneous victory/death.
6. Audio audition and first externally authored art sample.

## Reference notes

The owner-provided local screenshots of GTA 2 weapons and characters were inspected. They inform families, urban roles and fleeing-group dynamics; they are not asset sources for the game.

The [Vampire Survivors weapon reference](https://vampire.survivors.wiki/w/Weapons) was fetched directly after the browsing reader could not open it. Useful design dimensions include damage, amount, speed, area, duration, cooldown, projectile interval, pierce, repeated-hit delay and pool limits. Its [evolution reference](https://vampire.survivors.wiki/w/Evolution) distinguishes replacing a maxed weapon from merging multiple maxed weapons. Our proposal adapts these general progression ideas to original urban weapons, uses randomized branches rather than copied upgrade tables, and intentionally keeps new weapons in boss crates. It does not reproduce that game's full item/relic/chest system.
