import type { Footprint, Point } from '../../../shared/contracts.ts';

export type FactionId =
  'player' | 'civilian' | 'docklands' | 'velvet-ward' | 'rust-union' | 'police';
export type ActorKind = 'civilian' | 'melee' | 'ranged' | 'officer';
export interface Actor extends Point {
  id: number;
  active: boolean;
  faction: FactionId;
  kind: ActorKind;
  health: number;
  maxHealth: number;
  hostile: boolean;
  hitByPlayer: boolean;
  heading: number;
  radius: number;
  nextAttack: number;
  windupUntil: number;
  frightenedUntil: number;
}
export interface DamageEvent {
  readonly sourceActor: number;
  readonly sourceFaction: FactionId;
  readonly instigator: number;
  readonly effect: 'pistol' | 'contact' | 'sidearm';
  readonly amount: number;
  readonly damageType: 'kinetic';
  readonly position: Readonly<Point>;
  readonly chainId: number;
  readonly target: number;
}
export interface DamageOutcome {
  readonly event: DamageEvent;
  readonly victim: Readonly<Actor>;
  readonly firstHit: boolean;
  readonly killed: boolean;
}
export interface Projectile extends Point {
  active: boolean;
  vx: number;
  vy: number;
  remaining: number;
  target: number;
  event: DamageEvent;
}
export interface CombatWorld {
  readonly buildings: readonly Readonly<Footprint>[];
  readonly width: number;
  readonly height: number;
}
