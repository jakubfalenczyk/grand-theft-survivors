# GTS-03A. Combat foundation and deliberate provocation

> Status: Implemented and verified on 2026-10-25, integrated with GTS-02.

## Goal

Add damage, pistol fire and deliberate attacks on neutral NPCs before expanding the weapon roster.

## Scope

Health, damage/death and XP ownership; pistol auto-target/fire; projectiles; one neutral civilian and one hostile melee actor. Weapon state, target selection, damage and actor rendering stay separate. Use a bounded projectile pool from the first projectile feature.

## D02 behavior

Auto-fire considers actors already hostile to the player. Press Space once to engage the nearest neutral person inside the facing cone. A small triangle previews the candidate; a ring identifies the selected actor. Holding Space does not select another person. The chosen person remains eligible for autoattack while fleeing, within range and line of sight. A successful damaging attack creates provocation; selection alone does not. Default auto-fire ignores unprovoked civilians, gang members, police and traffic.

## Selection details

Hostile auto-targeting uses nearest reachable target within range and line of sight, with a small lock hysteresis. Do not require enemies to remain directly in front if that makes tank controls frustrating; facing-cone restriction is proposed only for deliberate neutral selection. Do not select actors through buildings or outside weapon range. Defer mouse aiming unless the owner prefers it.

## Damage contract

Each damage event records the source actor and faction, instigator, weapon or effect ID, amount, damage type, position and causal chain ID. One resolved death emits one reward/hostility event. The causal chain is needed for explosions and faction attribution later. Define collision/team filters explicitly; enemy-friendly-fire and civilian collateral are decisions, not default physics accidents.

## Proposed pistol starting values

12 damage, 0.6 s cooldown, 300-unit targeting range and 500-unit/s projectile speed, no penetration. These require a dummy/enemy health comparison and a movement playtest. Do not copy GTA damage or VS cooldowns.

## Acceptance

- Cooldowns behave the same across frame rates and pauses.
- A death grants its reward once. Walls block shots.
- Automatic fire ignores neutral NPCs. Deliberate attacks provoke only the actors and factions specified by the rules.
- Restarting clears damage state. Projectile counts stay within a measured limit.

## Implementation review, 2026-10-25

Reviewed against committed baseline `a982ebd` and the separate, uncommitted GTS-02 changes on `main`. Implementation of GTS-03A and GTS-04A is authorized in the `codex/gts-03a-04a` worktree. The confirmed owner decisions below supersede the proposals.

- The baseline has no actor health, damage, weapons or XP. The HUD health meter is static. Add feature-owned combat state and immutable snapshots; keep progression choices in GTS-03B.
- `CityScene` currently composes world, player, footsteps and camera. Keep targeting, cooldowns, projectile simulation, damage resolution and rendering outside the scene. Separate actor identity from reusable pool slots so delayed damage cannot affect a replacement actor.
- GTS-02 is changing `WorldLayout.size` to rectangular bounds, adding map identity and moving spawn/geometry into map definitions. Do not copy its unfinished working files. Integrate its completed contracts before map-switch acceptance and final publication.
- Blocking footprints already exist as plain data. Use swept projectile collision and the same footprints for target line of sight. Roof projection must not block ground-level shots. Explicit collision filters must prevent unintended neutral collateral and friendly fire.
- The session blocks player input without suspending scene updates. Combat must stop its simulation clock, projectiles and attack windups in every blocked session mode. Resume must not accumulate catch-up shots.
- Position reset currently only moves the player. Preserve that distinction from GTS-02's full run restart, which must clear actors, projectiles, rewards and combat state. Death behavior needs a defined recovery flow without implementing GTS-06 victory and run-summary scope.
- Add behavior checks for neutral selection feedback, deliberate-hit provocation, wall occlusion, exactly-once rewards, stale actor IDs, pause/frame-rate invariance, pool limits and restart cleanup. Extend the existing read-only debug snapshots or browser fixtures to inspect combat without exposing mutable engine objects.

### Confirmed owner decisions

- Press Space once to engage the nearest neutral person inside the facing cone. Holding Space does not select another person. A small triangle shows the candidate and a ring marks the selected actor.
- Engagement persists while a civilian flees. The pistol fires when that target is within range and line of sight, and drops selection when that actor dies. Neutral selection does not itself raise hostility.
- Civilians also award XP. Initial rewards are 2 for a civilian, 12 for melee, 16 for a gunner and 18 for an officer. Level-up choices remain GTS-03B.
- GTS-04A includes civilians, one gang with melee and ranged members, and working police patrols. It implements the shared pressure and witness rules.

The first pistol uses the proposed 12 damage, 0.6 s cooldown, 300-unit range and 500-unit/s speed. Deliberate projectiles affect their selected actor only; enemy attacks affect only the player. No neutral collateral or friendly fire occurs. A 120 Hz simulation owns cooldowns and projectile sweeps. Player health is 100; death opens the existing dialog controller in the exclusive `dead` session mode with a new-run action. Reset position does not heal or reset rewards.

Baseline verification: Node.js 22.22.1, clean `npm ci`, token checks, TypeScript, lint, formatting, all 14 unit tests and production build passed. The first browser suite passed 45 of 46 tests. The perspective test lost `window.__gameDebug` during execution; its isolated rerun passed. The full `npm run check` is therefore not yet recorded as passing. No combat or population code was changed during this review.

Implementation verification: `npm run check` passed with 20 unit tests and 47 browser tests, including responsive and restart checks. Combat uses at most 64 actor slots and 96 projectile slots. GTS-04A replaces the two initial review actors with the living population.

Final integration verification: based on GTS-02 commit `e8e3907`. `PLAYWRIGHT_PORT=5175 npm run check` passed all token, type, lint, formatting, unit, build and browser checks: 33 unit tests and 52 browser tests. Coverage includes populated Westbridge → rectangular fixture map → Westbridge after a crime, fresh XP/health/hostility, crossing waits and flight, pause, death recovery, audio persistence, owned keyboard cleanup and responsive HUD layout. Fixture maps without authored population data remain empty; new map content must supply its own population definition.
