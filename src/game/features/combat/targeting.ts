import type { Point } from '../../../shared/contracts.ts';
import { COMBAT } from './config.ts';
import { clearSegment, distance } from './geometry.ts';
import type { Actor, CombatWorld } from './types.ts';

export function selectTarget(
  actors: readonly Actor[],
  player: Point & { heading: number },
  world: CombatWorld,
  neutral: boolean,
  previous: number | null = null,
) {
  const candidates = actors.filter((actor) => {
    if (!actor.active || actor.hostile === neutral || distance(player, actor) > COMBAT.pistol.range)
      return false;
    const angle = Math.atan2(actor.y - player.y, actor.x - player.x) - player.heading;
    if (neutral && Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) > COMBAT.pistol.cone / 2)
      return false;
    return clearSegment(player, actor, world);
  });
  candidates.sort((a, b) => distance(player, a) - distance(player, b) || a.id - b.id);
  const nearest = candidates[0];
  const locked = candidates.find((actor) => actor.id === previous);
  return locked &&
    nearest &&
    distance(player, locked) <= distance(player, nearest) + COMBAT.pistol.hysteresis
    ? locked
    : (nearest ?? null);
}
