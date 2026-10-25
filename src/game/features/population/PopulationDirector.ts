import type { Footprint, Point } from '../../../shared/contracts.ts';
import { seededRandom } from '../../../shared/math.ts';
import type { CombatSimulation } from '../combat/CombatSimulation.ts';
import type { Actor, ActorKind, FactionId } from '../combat/types.ts';
import { clearSegment, distance } from '../combat/geometry.ts';
import { POPULATION, validatePopulationConfig } from './config.ts';
import { Hostility, RESPONSE_FACTIONS } from './Hostility.ts';
import type { ResponseFaction } from './Hostility.ts';
import { Navigation } from './navigation.ts';
import type { WalkGraph, WalkNode } from './navigation.ts';

interface RouteState {
  route: number[];
  cursor: number;
  waitUntil: number;
  lastNode: number | null;
  planAt: number;
  fleeing: boolean;
  distantTime: number;
  reinforcement: boolean;
}
export interface PopulationMap {
  readonly graph: WalkGraph;
  readonly gangZone: Readonly<Footprint>;
}
const inside = (point: Point, bounds: Footprint, margin = 0) =>
  point.x >= bounds.x - margin &&
  point.y >= bounds.y - margin &&
  point.x <= bounds.x + bounds.w + margin &&
  point.y <= bounds.y + bounds.h + margin;

/** Ambient density and faction response have separate budgets and random streams. */
export class PopulationDirector {
  readonly navigation: Navigation;
  readonly hostility = new Hostility();
  readonly simulation: CombatSimulation;
  readonly map: PopulationMap;
  readonly states = new Map<number, RouteState>();
  readonly entries: readonly WalkNode[];
  readonly spawnHistory: { x: number; y: number; visible: boolean; initial: boolean }[] = [];
  pathRequests = 0;
  #ambientRandom: () => number;
  #responseRandom: () => number;
  #nextPlan = 0;
  #nextResponse: Record<ResponseFaction, number> = {
    docklands: 0,
    'velvet-ward': 0,
    'rust-union': 0,
    police: 0,
  };
  #planCursor = 0;
  constructor(simulation: CombatSimulation, map: PopulationMap, seed: number) {
    validatePopulationConfig();
    this.simulation = simulation;
    this.map = map;
    this.navigation = new Navigation(map.graph, simulation.world);
    const start = this.navigation.nearest(simulation.player);
    this.entries = start ? this.navigation.reachable(start.id) : [];
    this.#ambientRandom = seededRandom(seed + 7001);
    this.#responseRandom = seededRandom(seed + 9001);
    simulation.onDamage = (outcome) => this.hostility.record(outcome, simulation);
  }
  /** Establish the city before the loading screen reveals it; all subsequent entries are offscreen. */
  initialize(view: Footprint) {
    const nodes = [...this.entries].sort(
      (a, b) =>
        distance(a, this.simulation.player) - distance(b, this.simulation.player) || a.id - b.id,
    );
    let count = 0;
    for (const node of nodes) {
      if (count >= POPULATION.ambientLimit) break;
      const kind = POPULATION.ambientMix[count % POPULATION.ambientMix.length];
      if (this.#spawn(kind, this.#faction(kind), node, false, view, true)) count++;
    }
    // One street aggressor makes hostile combat available without attacking civilians.
    const aggressor = this.simulation.actors.find(
      (actor) => actor.kind === 'melee' && distance(actor, this.simulation.player) > 400,
    );
    if (aggressor) aggressor.hostile = true;
  }
  #faction(kind: ActorKind): FactionId {
    return kind === 'civilian' ? 'civilian' : kind === 'officer' ? 'police' : 'docklands';
  }
  #spawn(
    kind: ActorKind,
    faction: FactionId,
    node: WalkNode,
    reinforcement: boolean,
    view: Footprint,
    initial = false,
  ) {
    const sim = this.simulation;
    if (
      distance(node, sim.player) < POPULATION.playerClearance ||
      (!initial && inside(node, view, POPULATION.spawnMargin))
    )
      return null;
    if (faction === 'docklands' && !inside(node, this.map.gangZone)) return null;
    if (
      sim.actors.filter((actor) => actor.active && actor.faction === faction).length >=
      POPULATION.factionLimit
    )
      return null;
    if (sim.actors.some((actor) => actor.active && distance(node, actor) < POPULATION.spacing))
      return null;
    const actor = sim.spawn(kind, faction, node, reinforcement);
    if (!actor) return null;
    this.states.set(actor.id, {
      route: [],
      cursor: 0,
      waitUntil: 0,
      lastNode: node.id,
      planAt: 0,
      fleeing: false,
      distantTime: 0,
      reinforcement,
    });
    this.spawnHistory.push({ x: node.x, y: node.y, visible: inside(node, view), initial });
    if (this.spawnHistory.length > 64) this.spawnHistory.shift();
    return actor;
  }
  update(dt: number, view: Footprint) {
    const sim = this.simulation;
    this.#lastView = view;
    this.hostility.update(dt, sim);
    if (sim.time >= this.#nextPlan) {
      this.#nextPlan = sim.time + POPULATION.planningInterval;
      this.pathRequests = 0;
      for (const id of this.states.keys()) if (!sim.find(id)) this.states.delete(id);
      const actors = sim.actors.filter((actor) => actor.active);
      for (let i = 0; i < actors.length && this.pathRequests < POPULATION.pathsPerPlan; i++) {
        const actor = actors[(this.#planCursor + i) % actors.length],
          state = this.states.get(actor.id);
        if (state && sim.time >= state.planAt) {
          this.#plan(actor, state);
          this.pathRequests++;
        }
      }
      this.#planCursor = (this.#planCursor + POPULATION.pathsPerPlan) % Math.max(1, actors.length);
      this.#replenish(view);
    }
    for (const actor of sim.actors) {
      if (!actor.active) continue;
      const state = this.states.get(actor.id);
      if (!state) continue;
      const far = distance(actor, sim.player) > POPULATION.activeDistance;
      if (
        !inside(actor, view, POPULATION.spawnMargin) &&
        distance(actor, sim.player) > POPULATION.despawnDistance
      ) {
        actor.active = false;
        continue;
      }
      state.distantTime += dt;
      if (far && state.distantTime < POPULATION.distantInterval) continue;
      const elapsed = state.distantTime;
      state.distantTime = 0;
      if (
        actor.faction !== 'civilian' &&
        actor.faction !== 'player' &&
        this.hostility.tier(actor.faction).minimum > 0 &&
        distance(actor, sim.player) < POPULATION.witnessRange
      )
        actor.hostile = true;
      if (
        state.reinforcement &&
        actor.faction !== 'civilian' &&
        actor.faction !== 'player' &&
        this.hostility.factions[actor.faction].alert === 0 &&
        !inside(actor, view, POPULATION.spawnMargin)
      ) {
        actor.active = false;
        continue;
      }
      const fleeing = actor.kind === 'civilian' && actor.frightenedUntil > sim.time;
      if (fleeing !== state.fleeing) {
        state.fleeing = fleeing;
        state.route = [];
        state.planAt = 0;
      }
      if (
        actor.hostile &&
        actor.kind !== 'civilian' &&
        clearSegment(actor, sim.player, sim.world, actor.radius)
      ) {
        const stopRange = actor.kind === 'melee' ? 18 : 160;
        if (distance(actor, sim.player) > stopRange)
          this.#steer(actor, sim.player, POPULATION.speed[actor.kind], elapsed);
        if (!far) sim.attack(actor);
      } else this.#follow(actor, state, elapsed);
    }
  }
  #plan(actor: Actor, state: RouteState) {
    const sim = this.simulation;
    state.planAt = sim.time + 1;
    if (state.route.length > state.cursor && !actor.hostile && !state.fleeing) return;
    const from = this.navigation.nearest(actor);
    if (!from) return;
    let destination: WalkNode | null;
    if (actor.hostile) destination = this.navigation.nearest(sim.player);
    else {
      let choices = this.entries.filter(
        (node) => actor.faction !== 'docklands' || inside(node, this.map.gangZone),
      );
      if (state.fleeing) {
        choices = choices
          .filter((node) => node.exit)
          .sort((a, b) => distance(b, sim.player) - distance(a, sim.player));
        destination = choices[0] ?? null;
      } else destination = choices[Math.floor(this.#ambientRandom() * choices.length)] ?? null;
    }
    if (!destination) return;
    state.route = this.navigation.route(from.id, destination.id);
    state.cursor = 0;
    const second = this.navigation.node(state.route[1]);
    if (second && distance(actor, from) > 3 && clearSegment(actor, second, sim.world, actor.radius))
      state.cursor = 1;
  }
  #follow(actor: Actor, state: RouteState, dt: number) {
    const sim = this.simulation;
    if (sim.time < state.waitUntil) return;
    const next = this.navigation.node(state.route[state.cursor]);
    if (!next) return;
    if (distance(actor, next) < 3) {
      state.lastNode = next.id;
      state.cursor++;
      const following = state.route[state.cursor];
      if (following !== undefined && this.navigation.isCrossing(next.id, following))
        state.waitUntil = sim.time + POPULATION.crossingWait;
      if (state.fleeing && next.exit && !inside(actor, this.#lastView, POPULATION.spawnMargin))
        actor.active = false;
      return;
    }
    this.#steer(
      actor,
      next,
      state.fleeing ? POPULATION.fleeSpeed : POPULATION.speed[actor.kind],
      dt,
    );
  }
  #lastView: Footprint = { x: 0, y: 0, w: 0, h: 0 };
  #steer(actor: Actor, destination: Point, speed: number, dt: number) {
    let x = 0,
      y = 0;
    for (const other of this.simulation.actors) {
      if (!other.active || other.id === actor.id) continue;
      const length = distance(actor, other);
      if (length > 0 && length < POPULATION.spacing) {
        x += ((actor.x - other.x) / length) * (POPULATION.spacing - length);
        y += ((actor.y - other.y) / length) * (POPULATION.spacing - length);
      }
    }
    // Steer locally, but keep a clear corridor back to the authored route.
    const steered = { x: destination.x + x, y: destination.y + y };
    this.simulation.move(
      actor,
      clearSegment(actor, steered, this.simulation.world, actor.radius) ? steered : destination,
      speed,
      dt,
    );
  }
  #replenish(view: Footprint) {
    this.#lastView = view;
    const sim = this.simulation;
    const candidates = this.entries.filter(
      (node) =>
        !inside(node, view, POPULATION.spawnMargin) &&
        distance(node, sim.player) <= POPULATION.spawnMaxDistance &&
        distance(node, sim.player) >= POPULATION.playerClearance,
    );
    const active = sim.actors.filter((actor) => actor.active);
    const ambient = active.filter((actor) => !this.states.get(actor.id)?.reinforcement).length;
    if (ambient < POPULATION.ambientLimit && candidates.length) {
      const node = candidates[Math.floor(this.#ambientRandom() * candidates.length)];
      const kind =
        POPULATION.ambientMix[Math.floor(this.#ambientRandom() * POPULATION.ambientMix.length)];
      this.#spawn(kind, this.#faction(kind), node, false, view);
    }
    for (const faction of RESPONSE_FACTIONS) {
      const tier = this.hostility.tier(faction);
      if (
        !tier.squadSize ||
        this.hostility.factions[faction].alert <= 0 ||
        sim.time < this.#nextResponse[faction] ||
        !candidates.length
      )
        continue;
      let remaining =
        POPULATION.reinforcementLimit -
        sim.actors.filter((actor) => actor.active && this.states.get(actor.id)?.reinforcement)
          .length;
      const available = candidates.filter(
        (node) =>
          (faction !== 'docklands' || inside(node, this.map.gangZone)) &&
          !sim.actors.some((actor) => actor.active && distance(actor, node) < POPULATION.spacing),
      );
      for (let i = 0; i < tier.squadSize && remaining > 0 && available.length > 0; i++) {
        const ranged = this.#responseRandom() < tier.rangedWeight;
        const kind = ranged ? (faction === 'police' ? 'officer' : 'ranged') : 'melee';
        const index = Math.floor(this.#responseRandom() * available.length);
        const node = available.splice(index, 1)[0];
        if (this.#spawn(kind, faction, node, true, view)) remaining--;
      }
      this.#nextResponse[faction] = sim.time + tier.interval;
    }
  }
  snapshot() {
    return {
      hostility: this.hostility.snapshot(),
      lastCrime: this.hostility.latest ? { ...this.hostility.latest } : null,
      population: {
        ambient: this.simulation.actors.filter(
          (actor) => actor.active && !this.states.get(actor.id)?.reinforcement,
        ).length,
        response: this.simulation.actors.filter(
          (actor) => actor.active && this.states.get(actor.id)?.reinforcement,
        ).length,
        nodes: this.navigation.graph.nodes.length,
        pathRequests: this.pathRequests,
        recentSpawns: this.spawnHistory.map((entry) => ({ ...entry })),
      },
    };
  }
  destroy() {
    this.simulation.onDamage = () => {};
    this.states.clear();
  }
}
