import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatSimulation } from '../../src/game/features/combat/CombatSimulation.ts';
import type { DamageEvent } from '../../src/game/features/combat/types.ts';
import { Hostility } from '../../src/game/features/population/Hostility.ts';
import { PopulationDirector } from '../../src/game/features/population/PopulationDirector.ts';
import { Navigation } from '../../src/game/features/population/navigation.ts';
import { westbridgeWalkGraph } from '../../src/game/features/population/maps/westbridge.ts';
import { POPULATION } from '../../src/game/features/population/config.ts';
import { generateCity } from '../../src/game/features/world/generateCity.ts';
import { clearSegment, distance, validPoint } from '../../src/game/features/combat/geometry.ts';

function scenario() {
  const sim = new CombatSimulation({ width: 1000, height: 800, buildings: [] });
  Object.assign(sim.player, { x: 100, y: 100, heading: 0 });
  const hostility = new Hostility();
  sim.onDamage = (outcome) => hostility.record(outcome, sim);
  return { sim, hostility };
}
function event(target: number, amount = 12, chainId = 1): DamageEvent {
  return {
    sourceActor: 0,
    sourceFaction: 'player',
    instigator: 0,
    target,
    effect: 'pistol',
    amount,
    damageType: 'kinetic',
    position: { x: 200, y: 100 },
    chainId,
  };
}
test('first harm and death add pressure once; civilian witnesses alert police and unrelated gangs stay unchanged', () => {
  const { sim, hostility } = scenario();
  const victim = sim.spawn('melee', 'docklands', { x: 200, y: 100 })!;
  const witness = sim.spawn('civilian', 'civilian', { x: 220, y: 100 })!;
  sim.damage(event(victim.id));
  assert.equal(hostility.factions.docklands.progress, 1);
  assert.equal(hostility.factions.police.progress, 1);
  assert.ok(witness.frightenedUntil > 0);
  sim.damage(event(victim.id, 100, 2));
  sim.damage(event(victim.id, 100, 2));
  assert.equal(hostility.factions.docklands.progress, 4);
  assert.equal(hostility.factions.police.progress, 4);
  assert.equal(hostility.factions['velvet-ward'].progress, 0);
  assert.equal(hostility.factions['rust-union'].progress, 0);
  assert.equal(sim.xp, 12);
});
test('unwitnessed civilian harm grants XP without police pressure; a wall prevents reporting', () => {
  const { sim, hostility } = scenario();
  const victim = sim.spawn('civilian', 'civilian', { x: 200, y: 100 })!;
  sim.spawn('officer', 'police', { x: 500, y: 100 });
  sim.damage(event(victim.id, 100));
  assert.equal(hostility.factions.police.progress, 0);
  assert.equal(sim.xp, 2);
  const blocked = new CombatSimulation({
    width: 1000,
    height: 800,
    buildings: [{ x: 230, y: 50, w: 20, h: 100 }],
  });
  const pressure = new Hostility();
  blocked.onDamage = (outcome) => pressure.record(outcome, blocked);
  const second = blocked.spawn('civilian', 'civilian', { x: 200, y: 100 })!;
  const officer = blocked.spawn('officer', 'police', { x: 280, y: 100 })!;
  blocked.damage(event(second.id));
  assert.equal(pressure.factions.police.progress, 0);
  assert.equal(officer.hostile, false);
});
test('witnessed civilian assault activates a police patrol without angering an unrelated gang', () => {
  const { sim, hostility } = scenario();
  const civilian = sim.spawn('civilian', 'civilian', { x: 200, y: 100 })!;
  const officer = sim.spawn('officer', 'police', { x: 250, y: 100 })!;
  const gang = sim.spawn('melee', 'docklands', { x: 260, y: 100 })!;
  sim.damage(event(civilian.id));
  assert.equal(officer.hostile, true);
  assert.equal(gang.hostile, false);
  assert.equal(hostility.factions.police.progress, 1);
  assert.equal(hostility.factions.docklands.progress, 0);
});
test('local alert decays after contact loss while permanent progress survives; chains have a contribution cap', () => {
  const { sim, hostility } = scenario();
  for (let i = 0; i < 10; i++) {
    const victim = sim.spawn('melee', 'docklands', { x: 200, y: 100 })!;
    sim.damage(event(victim.id, 100, 1));
  }
  assert.equal(hostility.factions.docklands.progress, POPULATION.chainCap);
  sim.time = 100;
  hostility.update(100, sim);
  assert.equal(hostility.factions.docklands.alert, 0);
  assert.equal(hostility.factions.docklands.progress, POPULATION.chainCap);
  hostility.factions.docklands.progress = 50;
  assert.equal(hostility.tier('docklands').rangedWeight, 0.7);
  assert.equal(hostility.tier('police').rangedWeight, 0);
});
function city() {
  const layout = generateCity();
  const sim = new CombatSimulation({
    width: layout.bounds.width,
    height: layout.bounds.height,
    buildings: layout.buildings,
  });
  Object.assign(sim.player, { x: 1260, y: 1234, heading: -Math.PI / 2 });
  const director = new PopulationDirector(
    sim,
    { graph: westbridgeWalkGraph(), gangZone: { x: 0, y: 840, w: 1680, h: 1680 } },
    layout.seed,
  );
  const view = { x: 960, y: 1084, w: 600, h: 300 };
  director.initialize(view);
  return { sim, director, view };
}
test('Westbridge sidewalks and crossings are connected and clear of building footprints', () => {
  const { sim, director } = city();
  assert.equal(director.entries.length, director.navigation.graph.nodes.length);
  assert.ok(director.entries.length > 100);
  for (const node of director.entries) assert.ok(validPoint(node, sim.world));
  for (const edge of director.navigation.graph.edges) {
    assert.ok(
      clearSegment(
        director.navigation.node(edge.from)!,
        director.navigation.node(edge.to)!,
        sim.world,
        8,
      ),
    );
  }
  assert.ok(director.navigation.graph.edges.some((edge) => edge.crossing));
});
test('a rectangular graph routes around an obstruction and excludes disconnected entries', () => {
  const navigation = new Navigation(
    {
      nodes: [
        { id: 0, x: 100, y: 100, exit: false },
        { id: 1, x: 100, y: 300, exit: false },
        { id: 2, x: 300, y: 300, exit: false },
        { id: 3, x: 300, y: 100, exit: true },
        { id: 4, x: 700, y: 100, exit: true },
      ],
      edges: [
        { from: 0, to: 3, crossing: false },
        { from: 0, to: 1, crossing: false },
        { from: 1, to: 2, crossing: true },
        { from: 2, to: 3, crossing: false },
      ],
    },
    { width: 800, height: 400, buildings: [{ x: 180, y: 50, w: 40, h: 160 }] },
  );
  assert.deepEqual(navigation.route(0, 3), [0, 1, 2, 3]);
  assert.equal(navigation.reachable(0).length, 4);
  assert.deepEqual(navigation.route(0, 4), []);
});
test('population moves before crime, stays bounded, uses offscreen replacements, and resets deterministically', () => {
  const { sim, director, view } = city();
  const initial = sim.actors.map((actor) => ({ id: actor.id, x: actor.x, y: actor.y }));
  assert.ok(sim.actors.some((actor) => actor.kind === 'civilian'));
  assert.ok(sim.actors.some((actor) => actor.kind === 'ranged'));
  assert.ok(sim.actors.some((actor) => actor.kind === 'officer'));
  sim.actors[0].active = false;
  for (let i = 0; i < 600; i++) sim.advance(1000 / 60, false, (dt) => director.update(dt, view));
  assert.ok(
    sim.actors.some(
      (actor) => distance(actor, initial.find((entry) => entry.id === actor.id) ?? actor) > 5,
    ),
  );
  assert.ok(sim.actors.length <= 64);
  assert.ok(director.snapshot().population.ambient <= POPULATION.ambientLimit);
  assert.ok(director.pathRequests <= POPULATION.pathsPerPlan);
  assert.ok(director.spawnHistory.some((entry) => !entry.initial));
  for (const spawn of director.spawnHistory.filter((entry) => !entry.initial))
    assert.equal(spawn.visible, false);
  const fresh = city();
  assert.deepEqual(
    fresh.sim.actors.map((actor) => ({ id: actor.id, x: actor.x, y: actor.y })),
    initial,
  );
  assert.equal(fresh.director.hostility.factions.docklands.progress, 0);
  director.destroy();
  assert.equal(director.states.size, 0);
});
test('hostility tiers summon independent response immediately and composition changes with pressure', () => {
  const { sim, director, view } = city();
  director.hostility.factions.docklands.progress = 75;
  director.hostility.factions.docklands.alert = 100;
  director.hostility.factions.police.progress = 25;
  director.hostility.factions.police.alert = 100;
  sim.advance(20, false, (dt) => director.update(dt, view));
  const responses = sim.actors.filter(
    (actor) => actor.active && director.states.get(actor.id)?.reinforcement,
  );
  assert.ok(responses.some((actor) => actor.faction === 'docklands'));
  assert.ok(responses.some((actor) => actor.faction === 'police'));
  assert.ok(responses.some((actor) => actor.kind === 'ranged'));
  assert.ok(responses.length <= POPULATION.reinforcementLimit);
  for (const spawn of director.spawnHistory.filter((entry) => !entry.initial))
    assert.equal(spawn.visible, false);
});

test('a frightened civilian waits at a crossing, pauses with the run, and then flees along the route', () => {
  const sim = new CombatSimulation({ width: 500, height: 400, buildings: [] });
  Object.assign(sim.player, { x: 400, y: 300, heading: 0 });
  const director = new PopulationDirector(
    sim,
    {
      graph: {
        nodes: [
          { id: 0, x: 100, y: 100, exit: false },
          { id: 1, x: 228, y: 100, exit: true },
        ],
        edges: [{ from: 0, to: 1, crossing: true }],
      },
      gangZone: { x: 0, y: 0, w: 500, h: 400 },
    },
    2042,
  );
  const view = { x: 0, y: 0, w: 500, h: 400 };
  director.initialize(view);
  const actor = sim.actors.find((entry) => entry.x === 100)!;
  for (const other of sim.actors) if (other.id !== actor.id) other.active = false;
  sim.damage({ ...event(actor.id), position: { x: 100, y: 100 } });
  for (let i = 0; i < 24; i++) sim.advance(1000 / 60, false, (dt) => director.update(dt, view));
  assert.equal(actor.x, 100);
  assert.ok(director.states.get(actor.id)!.waitUntil > sim.time);
  const before = sim.time;
  sim.advance(10000, true, (dt) => director.update(dt, view));
  assert.equal(sim.time, before);
  assert.equal(actor.x, 100);
  for (let i = 0; i < 90; i++) sim.advance(1000 / 60, false, (dt) => director.update(dt, view));
  assert.ok(actor.x > 120);
  assert.equal(actor.y, 100);
  assert.equal(actor.hostile, false);
  assert.ok(actor.frightenedUntil > sim.time);
});
