# GTS-06. Faction boss chains, run pacing and map completion

> Status: Design review. Implementation has not started.

## Win condition

Defeating the final boss of any one faction chain completes the current map. With four bosses per faction confirmed, Docklands 4/4 wins even when the other two gangs and police are 0/4. The player does not need to defeat the other factions' final bosses.

## Progress UI

Four compact faction rows show faction label, hostility, the next threshold, boss milestones, active/pending boss and next threat. Distinguish anger toward the player from player XP level. Detailed information can live in the city map; avoid covering the playable screen. Map markers reveal a boss once announced; show destination/direction when offscreen.

## State

A run owns selected map/seed, health, XP/level, build, four faction records, boss chain outcomes and time played. Keep live mutable state distinct from immutable configuration and plain UI snapshots. Single transition from playing/reward to victory or defeat. Define simultaneous player death/final boss death and multiple final bosses dying in one frame. Proposed resolution: apply the full damage batch, then decide defeat versus victory using an explicit reviewed rule.

## Victory proposal

Freeze combat, show run summary, and include the final boss reward in the summary rather than forcing a weapon-choice modal after the run is already over. Restart resets everything; future map progression is a separate feature. No account saves, permanent upgrades or multi-city campaign are implied.

## Pacing

15 to 20 minutes is a target for ordinary active play, not a guarantee for idling, speedrunning or distributing attacks across factions. Tune thresholds, accessible faction density, reinforcement pressure, XP, boss durability and equipment supply. Record time to first provocation, first upgrade, first boss, first crate, first union and faction victory for concentrated/mixed/civilian-heavy routes. Never add a hidden elapsed-time gate to meet the target.

With four bosses confirmed, a focused route gets three new-weapon crates before the final boss and victory. Starting pistol plus three choices can fill the proposed four slots without attacking a second faction. Check union availability and XP pacing against this economy. The final boss reward is still a separate presentation decision. Avoid silently lengthening sessions by raising health alone.

A possible initial threshold table is 20 / 45 / 70 / 100 cumulative hostility per faction; these are unapproved starting values. Defeating a boss records its milestone but does not automatically grant the next threshold. The fourth threshold stays earned until its boss is defeated; a focused player can win quickly if effective, while splitting hostility can create simultaneous faction boss fights. Measure both routes before tuning thresholds.

## Acceptance

- The HUD shows four independent faction tracks and each next boss threshold.
- Killing the fourth boss of any faction ends the run once. Pending reward screens cannot resume combat after victory.
- Ordinary routes let the player reach a weapon union before the final boss.
- Restarting clears hostility and the build.
- Playtests record the distribution of completion times, including idle and mixed-faction routes.

## Confirmed

Each faction has four bosses, with no global limit on simultaneous faction bosses.

## Decisions needed

Set hostility thresholds and decide how to present the final reward. Define the result when the player and final boss die together. Decide whether a completed run can continue.
