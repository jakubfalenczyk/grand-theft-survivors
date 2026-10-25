import type { Point } from '../../../shared/contracts.ts';
import { COMBAT, validateCombatConfig } from './config.ts';
import { clearSegment, distance, segmentBox, segmentCircle, validPoint } from './geometry.ts';
import { selectTarget } from './targeting.ts';
import type {
  Actor,
  ActorKind,
  CombatWorld,
  DamageEvent,
  DamageOutcome,
  FactionId,
  Projectile,
} from './types.ts';

/** Engine-independent run state. Pool identities never repeat within a run. */
export class CombatSimulation {
  readonly actors: Actor[] = [];
  readonly projectiles: Projectile[] = [];
  readonly outcomes: DamageOutcome[] = [];
  player: Point & { heading: number; health: number } = {
    x: 0,
    y: 0,
    heading: 0,
    health: COMBAT.playerHealth,
  };
  time = 0;
  xp = 0;
  kills = 0;
  shots = 0;
  selected: number | null = null;
  preview: number | null = null;
  autoTarget: number | null = null;
  onDamage: (outcome: DamageOutcome) => void = () => {};
  #nextId = 1;
  #nextChain = 1;
  #nextShot = 0;
  #accumulator = 0;
  readonly world: CombatWorld;
  constructor(world: CombatWorld) {
    this.world = world;
    validateCombatConfig();
  }

  spawn(kind: ActorKind, faction: FactionId, point: Point, hostile = false): Actor | null {
    if (!validPoint(point, this.world)) return null;
    let actor = this.actors.find((entry) => !entry.active);
    if (!actor && this.actors.length >= COMBAT.actorLimit) return null;
    const state: Actor = {
      ...point,
      id: this.#nextId++,
      active: true,
      kind,
      faction,
      health: COMBAT.health[kind],
      maxHealth: COMBAT.health[kind],
      hostile,
      heading: 0,
      radius: 8,
      nextAttack: 0,
      windupUntil: 0,
      frightenedUntil: 0,
    };
    if (actor) Object.assign(actor, state);
    else {
      actor = state;
      this.actors.push(actor);
    }
    return actor;
  }
  find(id: number | null) {
    return this.actors.find((actor) => actor.active && actor.id === id);
  }
  engage() {
    if (this.player.health <= 0) return;
    const target = selectTarget(this.actors, this.player, this.world, true);
    if (target) this.selected = target.id;
  }
  advance(delta: number, blocked: boolean, beforeStep: (dt: number) => void = () => {}) {
    if (blocked || this.player.health <= 0) {
      this.#accumulator = 0;
      return;
    }
    this.#accumulator += Math.min(delta, 250) / 1000;
    while (this.#accumulator + 1e-9 >= COMBAT.step && this.player.health > 0) {
      this.#accumulator -= COMBAT.step;
      this.time += COMBAT.step;
      beforeStep(COMBAT.step);
      this.#step(COMBAT.step);
    }
  }
  move(actor: Actor, destination: Point, speed: number, dt: number) {
    const length = distance(actor, destination);
    if (!length) return;
    const scale = Math.min(1, (speed * dt) / length);
    const next = {
      x: actor.x + (destination.x - actor.x) * scale,
      y: actor.y + (destination.y - actor.y) * scale,
    };
    if (
      validPoint(next, this.world, actor.radius) &&
      clearSegment(actor, next, this.world, actor.radius)
    ) {
      actor.heading = Math.atan2(next.y - actor.y, next.x - actor.x);
      actor.x = next.x;
      actor.y = next.y;
    }
  }
  damage(event: DamageEvent) {
    if (!Number.isFinite(event.amount) || event.amount <= 0 || this.player.health <= 0) return;
    const actor = this.find(event.target);
    if (!actor) return;
    const firstHit = !actor.hostile && actor.frightenedUntil === 0;
    actor.health = Math.max(0, actor.health - event.amount);
    if (event.instigator === 0) {
      actor.hostile = actor.kind !== 'civilian';
      actor.frightenedUntil = this.time + 8;
    }
    const killed = actor.health === 0;
    if (killed) {
      actor.active = false;
      if (event.instigator === 0) {
        this.xp += COMBAT.xp[actor.kind];
        this.kills++;
      }
    }
    const outcome: DamageOutcome = {
      event: { ...event, position: { ...event.position } },
      victim: { ...actor },
      firstHit,
      killed,
    };
    this.outcomes.push(outcome);
    if (this.outcomes.length > 32) this.outcomes.shift();
    this.onDamage(outcome);
  }
  attack(actor: Actor) {
    if (!actor.active || !actor.hostile || actor.kind === 'civilian') return;
    const ranged = actor.kind !== 'melee',
      spec = ranged ? COMBAT.sidearm : COMBAT.contact;
    if (
      distance(actor, this.player) > spec.range ||
      !clearSegment(actor, this.player, this.world)
    ) {
      actor.windupUntil = 0;
      return;
    }
    if (this.time < actor.nextAttack) return;
    if (!actor.windupUntil) {
      actor.windupUntil = this.time + spec.windup;
      return;
    }
    if (this.time + 1e-9 < actor.windupUntil) return;
    const event = this.#event(
      actor.id,
      actor.faction,
      0,
      ranged ? 'sidearm' : 'contact',
      spec.damage,
      actor,
    );
    if (ranged) this.#fire(actor, this.player, event, COMBAT.sidearm.speed, COMBAT.sidearm.range);
    else this.player.health = Math.max(0, this.player.health - spec.damage);
    actor.windupUntil = 0;
    actor.nextAttack = this.time + spec.cooldown;
  }
  #event(
    sourceActor: number,
    sourceFaction: FactionId,
    target: number,
    effect: DamageEvent['effect'],
    amount: number,
    position: Point,
  ): DamageEvent {
    return {
      sourceActor,
      sourceFaction,
      instigator: sourceActor,
      target,
      effect,
      amount,
      damageType: 'kinetic',
      position: { ...position },
      chainId: this.#nextChain++,
    };
  }
  #fire(source: Point, target: Point, event: DamageEvent, speed: number, range: number) {
    let shot = this.projectiles.find((entry) => !entry.active);
    if (!shot && this.projectiles.length >= COMBAT.projectileLimit) return false;
    const angle = Math.atan2(target.y - source.y, target.x - source.x);
    const state: Projectile = {
      x: source.x,
      y: source.y,
      active: true,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      remaining: range,
      target: event.target,
      event,
    };
    if (shot) Object.assign(shot, state);
    else {
      shot = state;
      this.projectiles.push(shot);
    }
    return true;
  }
  #step(dt: number) {
    this.preview = selectTarget(this.actors, this.player, this.world, true)?.id ?? null;
    if (!this.find(this.selected)) this.selected = null;
    const manual = this.find(this.selected);
    this.autoTarget =
      selectTarget(this.actors, this.player, this.world, false, this.autoTarget)?.id ?? null;
    const target = manual ?? this.find(this.autoTarget);
    if (
      target &&
      this.time + 1e-9 >= this.#nextShot &&
      distance(this.player, target) <= COMBAT.pistol.range &&
      clearSegment(this.player, target, this.world)
    ) {
      const event = this.#event(
        0,
        'player',
        target.id,
        'pistol',
        COMBAT.pistol.damage,
        this.player,
      );
      if (this.#fire(this.player, target, event, COMBAT.pistol.speed, COMBAT.pistol.range)) {
        this.shots++;
        this.#nextShot = this.time + COMBAT.pistol.cooldown;
      }
    }
    for (const shot of this.projectiles) {
      if (!shot.active) continue;
      const travel = Math.min(Math.hypot(shot.vx, shot.vy) * dt, shot.remaining);
      const scale = travel / Math.hypot(shot.vx, shot.vy);
      const end = { x: shot.x + shot.vx * scale, y: shot.y + shot.vy * scale };
      let wall = Infinity;
      for (const box of this.world.buildings)
        wall = Math.min(wall, segmentBox(shot, end, box) ?? Infinity);
      const targetActor = shot.target === 0 ? this.player : this.find(shot.target);
      const hit = targetActor
        ? segmentCircle(shot, end, targetActor, shot.target === 0 ? 7 : 8)
        : null;
      if (hit !== null && hit < wall) {
        if (shot.target === 0)
          this.player.health = Math.max(0, this.player.health - shot.event.amount);
        else
          this.damage({
            ...shot.event,
            position: { x: shot.x + (end.x - shot.x) * hit, y: shot.y + (end.y - shot.y) * hit },
          });
        shot.active = false;
      } else if (wall <= 1) shot.active = false;
      shot.x = end.x;
      shot.y = end.y;
      shot.remaining -= travel;
      if (shot.remaining <= 1e-8 || !validPoint(shot, { ...this.world, buildings: [] }, 0))
        shot.active = false;
    }
  }
}
