import type { CombatSimulation } from '../combat/CombatSimulation.ts';
import type { DamageOutcome, FactionId } from '../combat/types.ts';
import { clearSegment, distance } from '../combat/geometry.ts';
import { POPULATION } from './config.ts';

export const RESPONSE_FACTIONS = ['docklands', 'velvet-ward', 'rust-union', 'police'] as const;
export type ResponseFaction = (typeof RESPONSE_FACTIONS)[number];
interface Pressure {
  progress: number;
  alert: number;
  lastContact: number;
  cause: 'none' | 'assault' | 'kill';
}

export class Hostility {
  readonly factions: Record<ResponseFaction, Pressure> = {
    docklands: { progress: 0, alert: 0, lastContact: 0, cause: 'none' },
    'velvet-ward': { progress: 0, alert: 0, lastContact: 0, cause: 'none' },
    'rust-union': { progress: 0, alert: 0, lastContact: 0, cause: 'none' },
    police: { progress: 0, alert: 0, lastContact: 0, cause: 'none' },
  };
  latest: { cause: 'assault' | 'kill'; gang: number; police: number } | null = null;
  #chains = new Map<number, Partial<Record<ResponseFaction, number>>>();
  #processed = new Set<string>();
  tier(faction: ResponseFaction) {
    const progress = this.factions[faction].progress;
    return [...POPULATION.tiers].reverse().find((tier) => progress >= tier.minimum)!;
  }
  record(outcome: DamageOutcome, sim: CombatSimulation) {
    const { event, victim, firstHit, killed } = outcome;
    if (event.instigator !== 0) return;
    const key = `${event.chainId}:${victim.id}:${killed ? 'death' : 'hit'}`;
    if (this.#processed.has(key)) return;
    this.#processed.add(key);
    if (this.#processed.size > 512) this.#processed.delete(this.#processed.values().next().value!);
    const witnesses = sim.actors.filter(
      (actor) =>
        actor.active &&
        actor.id !== victim.id &&
        distance(actor, event.position) <= POPULATION.witnessRange &&
        clearSegment(actor, event.position, sim.world),
    );
    const policeWitness =
      victim.faction === 'police' ||
      witnesses.some((actor) => actor.kind === 'officer' || actor.kind === 'civilian');
    const beforeGang = this.factions.docklands.progress;
    const beforePolice = this.factions.police.progress;
    const amount = (firstHit ? 1 : 0) + (killed ? 3 : 0);
    if (victim.faction !== 'civilian' && victim.faction !== 'player')
      this.#raisePressure(victim.faction, amount, event.chainId, killed, sim.time);
    if (policeWitness && victim.faction !== 'police')
      this.#raisePressure('police', amount, event.chainId, killed, sim.time);
    const gang = this.factions.docklands.progress - beforeGang;
    const police = this.factions.police.progress - beforePolice;
    if (gang || police) this.latest = { cause: killed ? 'kill' : 'assault', gang, police };
    for (const actor of witnesses) {
      if (actor.kind === 'civilian') actor.frightenedUntil = sim.time + POPULATION.fleeSeconds;
      else if (actor.faction === victim.faction || (actor.faction === 'police' && policeWitness))
        actor.hostile = true;
    }
  }
  #raisePressure(faction: FactionId, amount: number, chain: number, killed: boolean, time: number) {
    if (faction === 'civilian' || faction === 'player' || !amount) return;
    let entries = this.#chains.get(chain);
    if (!entries) {
      entries = {};
      this.#chains.set(chain, entries);
    }
    const previous = entries[faction] ?? 0,
      contribution = Math.min(amount, POPULATION.chainCap - previous);
    entries[faction] = previous + contribution;
    if (this.#chains.size > 256) this.#chains.delete(this.#chains.keys().next().value!);
    if (contribution <= 0) return;
    const pressure = this.factions[faction];
    pressure.progress = Math.min(100, pressure.progress + contribution);
    pressure.alert = Math.min(100, pressure.alert + contribution * 10);
    pressure.lastContact = time;
    pressure.cause = killed ? 'kill' : 'assault';
  }
  update(dt: number, sim: CombatSimulation) {
    for (const faction of RESPONSE_FACTIONS) {
      const pressure = this.factions[faction];
      const contact = sim.actors.some(
        (actor) =>
          actor.active &&
          actor.hostile &&
          actor.faction === faction &&
          distance(actor, sim.player) <= POPULATION.witnessRange &&
          clearSegment(actor, sim.player, sim.world),
      );
      if (contact) {
        pressure.lastContact = sim.time;
        pressure.alert = Math.max(10, pressure.alert);
      }
      if (sim.time - pressure.lastContact > POPULATION.alertGrace)
        pressure.alert = Math.max(0, pressure.alert - dt * POPULATION.alertDecay);
    }
  }
  snapshot() {
    return RESPONSE_FACTIONS.map((id) => ({ id, ...this.factions[id] }));
  }
}
