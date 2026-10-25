import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatSimulation } from '../../src/game/features/combat/CombatSimulation.ts';
import { COMBAT } from '../../src/game/features/combat/config.ts';
import type { DamageEvent } from '../../src/game/features/combat/types.ts';

const world = { width: 1000, height: 800, buildings: [] };
function setup() {
  const sim = new CombatSimulation(world);
  Object.assign(sim.player, { x: 100, y: 100, heading: 0 });
  return sim;
}
function advance(sim: CombatSimulation, seconds: number, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) sim.advance(1000 / fps, false);
}
const damage = (target: number): DamageEvent => ({
  sourceActor: 0,
  sourceFaction: 'player',
  instigator: 0,
  target,
  effect: 'pistol',
  amount: 100,
  damageType: 'kinetic',
  position: { x: 200, y: 100 },
  chainId: 1,
});

test('neutral preview does not shoot; engagement persists after the player turns and kills only its target', () => {
  const sim = setup();
  const civilian = sim.spawn('civilian', 'civilian', { x: 190, y: 100 })!;
  const bystander = sim.spawn('civilian', 'civilian', { x: 140, y: 100 })!;
  advance(sim, 1);
  assert.equal(sim.shots, 0);
  assert.equal(sim.preview, bystander.id);
  bystander.y = 180;
  sim.engage();
  sim.player.heading = Math.PI;
  advance(sim, 2);
  assert.equal(civilian.active, false);
  assert.equal(bystander.health, bystander.maxHealth);
  assert.equal(sim.xp, COMBAT.xp.civilian);
});
test('target selection ignores range, cone and wall failures', () => {
  const sim = new CombatSimulation({ ...world, buildings: [{ x: 140, y: 80, w: 20, h: 40 }] });
  Object.assign(sim.player, { x: 100, y: 100, heading: 0 });
  sim.spawn('civilian', 'civilian', { x: 200, y: 100 });
  sim.spawn('civilian', 'civilian', { x: 100, y: 200 });
  sim.spawn('civilian', 'civilian', { x: 450, y: 100 });
  sim.engage();
  assert.equal(sim.selected, null);
  advance(sim, 1);
  assert.equal(sim.shots, 0);
});
test('projectiles sweep against walls added after launch and cannot tunnel at low frame rates', () => {
  const buildings: { x: number; y: number; w: number; h: number }[] = [];
  const sim = new CombatSimulation({ ...world, buildings });
  Object.assign(sim.player, { x: 100, y: 100, heading: 0 });
  const target = sim.spawn('melee', 'docklands', { x: 250, y: 100 }, true)!;
  sim.advance(10, false);
  buildings.push({ x: 150, y: 90, w: 1, h: 20 });
  advance(sim, 1, 20);
  assert.equal(target.health, target.maxHealth);
});
test('cooldowns and rewards agree at 20, 60 and 144 FPS; blocked time produces no catch-up shots', () => {
  const results = [20, 60, 144].map((fps) => {
    const sim = setup();
    const actor = sim.spawn('melee', 'docklands', { x: 200, y: 100 }, true)!;
    actor.health = actor.maxHealth = 1000;
    advance(sim, 3, fps);
    const before = sim.shots;
    sim.advance(100000, true);
    assert.equal(sim.shots, before);
    advance(sim, 3, fps);
    return { shots: sim.shots, health: actor.health };
  });
  assert.deepEqual(results[0], results[1]);
  assert.deepEqual(results[1], results[2]);
});
test('death rewards resolve once, stale IDs cannot damage a replacement, and pools are bounded', () => {
  const sim = setup();
  const actor = sim.spawn('melee', 'docklands', { x: 200, y: 100 })!;
  const id = actor.id;
  sim.damage(damage(id));
  sim.damage(damage(id));
  assert.equal(sim.kills, 1);
  const replacement = sim.spawn('civilian', 'civilian', { x: 200, y: 100 })!;
  assert.notEqual(replacement.id, id);
  sim.damage(damage(id));
  assert.equal(replacement.health, replacement.maxHealth);
  for (let i = 0; i < 100; i++) sim.spawn('melee', 'docklands', { x: 210, y: 100 });
  assert.equal(sim.actors.length, COMBAT.actorLimit);
  assert.equal(sim.spawn('melee', 'docklands', { x: 210, y: 100 }), null);
  advance(sim, 30);
  assert.ok(sim.projectiles.length <= COMBAT.projectileLimit);
});
test('hostile attack windup pauses, cancels on lost range, and player death stops simulation', () => {
  const sim = setup();
  const actor = sim.spawn('melee', 'docklands', { x: 110, y: 100 }, true)!;
  sim.attack(actor);
  assert.equal(sim.player.health, 100);
  sim.advance(10000, true);
  sim.attack(actor);
  assert.equal(sim.player.health, 100);
  sim.player.x = 700;
  sim.attack(actor);
  assert.equal(actor.windupUntil, 0);
  sim.player.health = 0;
  const before = sim.time;
  advance(sim, 10);
  assert.equal(sim.time, before);
});
