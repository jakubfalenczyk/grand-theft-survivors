# GTS-03B. XP, three-choice upgrades, weapon roster and evolutions

> Status: Design review. Implementation has not started.

## Goal

Let players choose weapon upgrades and evolutions. Keep their effects and selection weights in configuration.

## Proposed upgrade and reward rules

- Start with pistol rank 1. Proposed capacity: four weapon slots; proposed base weapon cap: rank 8. Both are open tuning decisions.
- Each character level queues one modal offering up to three distinct, eligible upgrades to owned weapons. A selected upgrade raises that weapon's rank once. Its effect also has its own tier/cap and prerequisites; max rank blocks further ordinary upgrades regardless of unused branches.
- Seeded weighted selection without replacement, filtered before drawing. At the opening pistol-only stage provide at least three useful branches. Never offer new weapons through ordinary level-ups.
- Multiple levels gained together queue choices; game simulation stays paused until all choices are handled. Selection commits once, even with repeated input. UI uses the existing modal/session model extended explicitly for reward selection, not a second pause boolean.
- Boss crates offer three unowned base weapons when that many are eligible. No duplicates to manufacture a third option. If fewer remain, show the actual count and an explicit fallback reward. At capacity, support an explicit replacement confirmation with a clear lost-upgrade preview or offer a non-weapon fallback. Never silently delete a weapon.
- Proposed evolution trigger: eligible recipes become an explicit level-up choice once both ingredients are max rank. This preserves boss crates as new-weapon rewards. A recipe atomically consumes both ingredients, grants one evolved weapon and frees one slot. No forced evolution or hidden loss of upgrades.
- Evolved weapon stats are specified directly or through an explicit recipe transform. Do not accidentally carry random ingredient multipliers twice. Initially evolved weapons have no further rank upgrades; eligible ordinary choices still target remaining base weapons.
- If fewer than three weapon upgrades exist, show real eligible choices plus configured healing or bonus rewards. If everything is maxed, offer recovery/bonus choices; never stall the level-up modal. Health fallback is useful only if health is missing.

## Base roster concept

These weapon names and behaviors are proposals. The GTA 2 reference suggests weapon families; all artwork, sounds and statistics need their own source. Start with the pistol, machine pistol and shotgun. Add thrown weapons next, then electrical weapons once the first set works.

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

## Original union proposals

| Maxed ingredients                        | Result (working name) | Distinct behavior                                               |
| ---------------------------------------- | --------------------- | --------------------------------------------------------------- |
| Pistol + Machine Pistol                  | Crossfire Rig         | Accurate opening shots followed by rotating short bursts        |
| Twin Pistols + Suppressed Machine Pistol | Ghost Circuit         | Alternating arcs with a rear-cover volley                       |
| Shotgun + Electro Projector              | Arc Breacher          | Conductive pellet cone, bounded short chains on marked targets  |
| Flamethrower + Molotov                   | Street Kiln           | Directional flame lays a temporary burning route behind impacts |
| Rocket Launcher + Grenades               | Demolition Chorus     | Heavy impact followed by a staggered ring of small blasts       |

Recipes consume compatible maxed weapons irrespective of their random upgrade path. Offer clear hints in the weapon panel before the player invests. Check recipes for cycles, missing inputs, duplicate IDs and unreachable results. Review whether every base weapon needs a union immediately; the table currently covers all ten without forcing all ten into the first content delivery.

## Configuration contract

Proposed files under the weapons/progression features: `weapons.ts`, `upgrades.ts`, `evolutions.ts`, `xpCurve.ts`, `rewardPools.ts`. Runtime data uses stable IDs; labels/descriptions are catalog keys. Config is plain data checked by `satisfies` plus startup validation, not callbacks containing hidden balancing numbers.

Weapon fields: ID, name/description/icon/asset/cue IDs, behavior enum, damage/type, cooldown seconds, range, projectile speed/lifetime, volley pattern, pierce, spread radians, area/duration/tick interval, knockback and pool limits. Upgrade fields: eligible weapon/tag, weight, prerequisites, cap, per-tier effect and clamps. Recipe fields: ingredient IDs/ranks, result ID, consumption and availability rule. Configuration must not evaluate strings as code.

For numeric upgrades use an explicit order: start with base values, add bonuses, apply bounded multipliers, then clamp to hard limits. Derive cooldown from fire-rate factors consistently; "20% faster fire rate" and "20% shorter cooldown" must not be treated as identical. Quantize integer counts after computation. Define damage-per-activation and compare estimated sustained damage, coverage and crowd-control cost; DPS alone will not value area denial correctly.

## XP starting values

Target roughly 20 to 30 character levels over a 15 to 20 minute active run, with early weapon choices and no requirement to farm civilians. Test whether enough ranks/crates are available to see a union before a concentrated faction victory. This target is not a boss time gate. Define recovery from a weak build and a policy for excess XP after maxing.

## Acceptance

- A seed and the same player choices produce the same upgrade offers.
- Offers contain no duplicates or ineligible upgrades. Full inventories, maxed weapons and exhausted reward pools still resolve.
- Multiple pending levels present their choices in order. Weapon unions consume their ingredients once.
- Configuration changes update the displayed effects without renderer edits.
- Strong and weak upgrade paths remain playable, and long runs stay within projectile and effect limits.

## Decisions needed

Decide the slot count, rank cap, replacement policy, evolution trigger and healing rules. Approve the first three weapons before implementing them.
