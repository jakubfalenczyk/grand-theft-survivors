# Planned work

Created 2026-10-24. Task files record current status. GTS-01 is implemented; the remaining tasks await design review. Task IDs identify work for later discussion. Proposed numbers still need playtesting and approval.

## Using this backlog

Open [the task browser](index.html) through `npm run dev` at `/docs/backlog/`, or use the published browser linked from the project README. The browser discovers every `.md` file in this folder through Vite. A new file appears during development and in the next build without editing HTML or maintaining a task list in code. Static hosting requires a rebuild and deployment to include file changes.

Keep one task per Markdown file. Use a numbered filename such as `10-GTS-08-task-name.md`, one `# GTS-08. Task title` heading, a status line and sections for the goal, scope, acceptance and open decisions. Keep stable task IDs when priorities change. This README holds shared decisions and references rather than an additional task. Update the proposed sequence when dependencies change.

To discuss a task, open it in the browser, write your notes and copy the generated message into the project chat. Notes are kept separately for each document until reload. They are not saved to disk or submitted. New-task ideas use the same feedback field while the overview is selected. Planning does not authorize implementation.

## Confirmed direction and decisions

- A living city with civilians, traffic, three gangs and police per map. Escalation reacts to player actions instead of arbitrary timed enemy waves.
- Start with a pistol. Character levels offer three applicable upgrade choices for owned weapons; boss crates offer three new weapon choices. Maxed weapons can combine into original evolutions.
- **D01.** Faction bosses trigger only from hostility thresholds. No three-minute schedule, minimum elapsed time or time cooldown gates their appearance. This supersedes the initial three-minute boss suggestion.
- **D02.** Automatic fire targets hostile enemies; attacking/provoking neutral NPCs is a deliberate player action. The exact input and target selection are still a design proposal.
- **D03.** Each faction has four bosses in an ordered chain. Defeating boss four of any faction wins the map.
- **D04.** No global concurrent boss limit or cross-faction arrival queue. Every eligible faction may send its boss immediately even when other factions have active bosses. Within each faction, the next chain member follows its predecessor's defeat.
- A run targets roughly 15 to 20 minutes. Killing the final boss of any one faction's chain completes the map. Time is a balancing outcome, not a boss trigger or forced victory timer.
- Future maps are separate content tasks; provide map selection architecture while retaining one implemented map initially.
- No player driving in the traffic task. Vehicles can collide, take damage and explode.
- All shipped text is English catalog content. All game balance lives in explicit, validated feature configuration. No values are copied from reference games.

## Proposed implementation sequence

| Order | Task                                                                 | Depends on                                                                                        | First reviewable deliverable                                                |
| ----- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 1     | [GTS-01](01-GTS-01-audio.md) Audio foundation                        | Current version                                                                                   | User-gesture unlock, UI sounds and material footsteps                       |
| 2     | [GTS-02](02-GTS-02-maps.md) Map definitions and switching            | Current version                                                                                   | Current Westbridge loaded through a typed map definition; repeatable reload |
| 3     | [GTS-03A](03-GTS-03A-combat.md) Combat and damage foundation         | [GTS-02](02-GTS-02-maps.md)                                                                       | Pistol, deliberate provocation, one civilian and one attacker               |
| 4     | [GTS-04A](04-GTS-04A-population.md) Living population and hostility  | [GTS-03A](03-GTS-03A-combat.md)                                                                   | Sidewalk movement, independent faction response and readable hostility      |
| 5     | [GTS-03B](05-GTS-03B-progression.md) XP, upgrades and weapon content | [GTS-03A](03-GTS-03A-combat.md), [GTS-04A](04-GTS-04A-population.md)                              | Three real upgrade choices and a small usable weapon roster                 |
| 6     | [GTS-04B](06-GTS-04B-raids.md) Raids, faction bosses and rare groups | [GTS-03B](05-GTS-03B-progression.md), [GTS-04A](04-GTS-04A-population.md)                         | Player actions raise hostility, summon a boss and earn a weapon crate       |
| 7     | [GTS-05](07-GTS-05-traffic.md) Traffic and destructible vehicles     | [GTS-02](02-GTS-02-maps.md), [GTS-03A](03-GTS-03A-combat.md), [GTS-04A](04-GTS-04A-population.md) | Lane traffic, collisions and attributed explosions                          |
| 8     | [GTS-06](08-GTS-06-completion.md) Run progression and completion     | [GTS-03B](05-GTS-03B-progression.md), [GTS-04B](06-GTS-04B-raids.md)                              | One complete faction chain, clear victory and run summary                   |
| 9     | [GTS-07](09-GTS-07-city.md) Authored Westbridge city                 | [GTS-02](02-GTS-02-maps.md); iterate against GTS-04 to 06                                         | One coherent district/road design, then measured full-map iteration         |

City blockouts and playtest routes are prerequisites for validating population/traffic, but full art production waits for a playable loop. [GTS-07](09-GTS-07-city.md) is a content design task that can be discussed early; no second city is created under [GTS-02](02-GTS-02-maps.md).

## Discussion queue

Resolve these progressively, not in one long questionnaire:

1. Hostility thresholds and boss identities; chain length is four and simultaneous faction arrivals have no global limit (confirmed).
2. Weapon slots/rank cap, crate replacement and evolution choice rules.
3. Original gang identities and the rare group concept.
4. Curated topology, map scale and what "not fully explored in one run" should mean in playtests.
5. Damage/XP policy for civilians, collateral explosions and simultaneous victory/death.
6. Audio audition and first externally authored art sample.

## Reference notes

The owner-provided local screenshots of GTA 2 weapons and characters were inspected. They inform families, urban roles and fleeing-group dynamics; they are not asset sources for the game.

The [Vampire Survivors weapon reference](https://vampire.survivors.wiki/w/Weapons) describes damage, amount, speed, area, duration, cooldown, projectile interval, pierce, repeated-hit delay and pool limits. Its [evolution reference](https://vampire.survivors.wiki/w/Evolution) distinguishes replacing a maxed weapon from merging multiple maxed weapons. Our proposal adapts these general progression ideas to original urban weapons, uses randomized branches rather than copied upgrade tables, and intentionally keeps new weapons in boss crates. It does not reproduce that game's full item/relic/chest system.
