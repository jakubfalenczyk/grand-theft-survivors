import type { ActorKind } from '../combat/types.ts';

export const POPULATION = {
  ambientLimit: 44,
  reinforcementLimit: 16,
  factionLimit: 24,
  spacing: 20,
  playerClearance: 70,
  spawnMargin: 40,
  spawnMaxDistance: 1000,
  despawnDistance: 1300,
  activeDistance: 900,
  distantInterval: 0.25,
  planningInterval: 0.25,
  pathsPerPlan: 4,
  crossingWait: 0.8,
  witnessRange: 260,
  fleeSeconds: 8,
  alertGrace: 8,
  alertDecay: 4,
  chainCap: 8,
  speed: { civilian: 45, melee: 74, ranged: 62, officer: 70 },
  fleeSpeed: 110,
  tiers: [
    { minimum: 0, rangedWeight: 0, squadSize: 0, interval: 12 },
    { minimum: 10, rangedWeight: 0.2, squadSize: 2, interval: 10 },
    { minimum: 25, rangedWeight: 0.45, squadSize: 3, interval: 8 },
    { minimum: 50, rangedWeight: 0.7, squadSize: 4, interval: 6 },
    { minimum: 75, rangedWeight: 0.85, squadSize: 4, interval: 5 },
  ],
  ambientMix: [
    'civilian',
    'civilian',
    'civilian',
    'melee',
    'ranged',
    'officer',
  ] satisfies ActorKind[],
} as const;

export function validatePopulationConfig() {
  const numbers = [
    POPULATION.ambientLimit,
    POPULATION.reinforcementLimit,
    POPULATION.factionLimit,
    POPULATION.spacing,
    POPULATION.playerClearance,
    POPULATION.spawnMargin,
    POPULATION.spawnMaxDistance,
    POPULATION.despawnDistance,
    POPULATION.activeDistance,
    POPULATION.distantInterval,
    POPULATION.planningInterval,
    POPULATION.pathsPerPlan,
    POPULATION.crossingWait,
    POPULATION.witnessRange,
    POPULATION.fleeSeconds,
    POPULATION.alertGrace,
    POPULATION.alertDecay,
    POPULATION.chainCap,
    ...Object.values(POPULATION.speed),
    POPULATION.fleeSpeed,
  ];
  if (numbers.some((value) => !Number.isFinite(value) || value <= 0))
    throw new Error('Invalid population configuration');
  for (const [i, tier] of POPULATION.tiers.entries()) {
    if (
      tier.minimum < 0 ||
      tier.minimum > 100 ||
      (i > 0 && tier.minimum <= POPULATION.tiers[i - 1].minimum) ||
      tier.rangedWeight < 0 ||
      tier.rangedWeight > 1 ||
      tier.interval <= 0 ||
      tier.squadSize < 0
    )
      throw new Error('Invalid hostility tier');
  }
}
