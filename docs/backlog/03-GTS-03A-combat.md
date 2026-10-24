# GTS-03A. Combat foundation and deliberate provocation

> Status: Design review. Implementation has not started.

## Goal

Add damage, pistol fire and deliberate attacks on neutral NPCs before expanding the weapon roster.

## Scope

Health, damage/death and XP ownership; pistol auto-target/fire; projectiles; one neutral civilian and one hostile melee actor. Weapon state, target selection, damage and actor rendering stay separate. Use a bounded projectile pool from the first projectile feature.

## D02 behavior

Auto-fire considers actors already hostile to the player. Proposed input: hold Space to aim/fire at a neutral target inside a facing cone. Show the selected neutral target before an attack. A successful damaging attack creates the provocation event; merely facing someone does not. Auto-fire must not silently attack unprovoked civilians, neutral gang members, neutral police or traffic. Discuss whether one deliberate hit should allow continued auto-targeting of that individual while they flee.

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
