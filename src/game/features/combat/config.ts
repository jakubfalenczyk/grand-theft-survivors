export const COMBAT = Object.freeze({
  step: 1 / 120,
  playerHealth: 100,
  actorLimit: 64,
  projectileLimit: 96,
  pistol: { damage: 12, cooldown: 0.6, range: 300, speed: 500, cone: Math.PI / 3, hysteresis: 30 },
  contact: { damage: 8, range: 22, cooldown: 1.1, windup: 0.35 },
  sidearm: { damage: 6, range: 240, cooldown: 1.5, windup: 0.5, speed: 300 },
  health: { civilian: 24, melee: 36, ranged: 36, officer: 48 },
  xp: { civilian: 2, melee: 12, ranged: 16, officer: 18 },
});

export function validateCombatConfig() {
  for (const value of [
    COMBAT.step,
    COMBAT.playerHealth,
    COMBAT.actorLimit,
    COMBAT.projectileLimit,
    ...Object.values(COMBAT.pistol),
    ...Object.values(COMBAT.contact),
    ...Object.values(COMBAT.sidearm),
    ...Object.values(COMBAT.health),
    ...Object.values(COMBAT.xp),
  ]) {
    if (!Number.isFinite(value) || value <= 0) throw new Error('Invalid combat configuration');
  }
}
