import type { StaticMessageKey } from './intl/index.ts';
import type { AudioCue, AudioStatus } from './audio/types.ts';
/** Plain-data boundary contracts; never place engine or DOM objects here. */
export interface Point {
  x: number;
  y: number;
}
export interface Footprint extends Point {
  w: number;
  h: number;
}
export type DistrictId = 'old-town' | 'ironworks' | 'greenfield';
export interface BuildingData extends Footprint {
  id: number;
  height: number;
  floors: number;
  district: DistrictId;
}
export interface CityBlock extends Point {
  park: boolean;
  parking: boolean;
}
export type MapId = string;
export interface WorldBounds {
  readonly width: number;
  readonly height: number;
}
export interface SurfaceRegion extends Footprint {
  readonly material: 'grass' | 'concrete';
  readonly role: 'lawn' | 'path' | 'plaza';
}
export interface WorldLayout {
  readonly mapId: MapId;
  readonly nameKey: StaticMessageKey;
  readonly seed: number;
  readonly bounds: WorldBounds;
  readonly spawns: readonly Readonly<Point>[];
  readonly streets: {
    readonly vertical: readonly number[];
    readonly horizontal: readonly number[];
    readonly width: number;
    readonly labels: readonly {
      readonly key: StaticMessageKey;
      readonly position: Readonly<Point>;
    }[];
  };
  readonly districts: readonly {
    readonly id: DistrictId;
    readonly bounds: Readonly<Footprint>;
    readonly label: Readonly<Point>;
  }[];
  readonly surfaces: readonly Readonly<SurfaceRegion>[];
  readonly buildings: readonly Readonly<BuildingData>[];
  readonly blocks: readonly Readonly<CityBlock>[];
  readonly trees: readonly Readonly<Point>[];
}
export interface PlayerSnapshot extends Point {
  heading: number;
  moving: number;
  running: boolean;
}
export interface GameSnapshot extends PlayerSnapshot {
  mapId: MapId;
  combat?: CombatSnapshot;
  district: DistrictId;
  seed: number;
  buildings: number;
}
export interface BuildingView extends Footprint {
  height: number;
  roofX: number;
  roofY: number;
  scale: number;
}
export interface CombatSnapshot {
  readonly health: number;
  readonly maxHealth: number;
  readonly xp: number;
  readonly kills: number;
}
export type SessionMode =
  'start' | 'loading' | 'playing' | 'paused' | 'help' | 'map' | 'audio' | 'dead';
export interface SessionState {
  readonly mode: SessionMode;
  readonly zoom: number;
}
export interface AppEvents {
  'command:play': undefined;
  'command:restart-run': undefined;
  'command:load-map': MapId;
  'game:map-error': string;
  'audio:cue': AudioCue;
  'audio:status': AudioStatus;
  'command:reset-player': undefined;
  'game:world-ready': WorldLayout;
  'game:snapshot': GameSnapshot;
}
export interface AudioDebugSnapshot {
  status: AudioStatus;
  played: number;
  lastCue: string;
  active: { cue: string; bus: string; volume: number }[];
  context: string;
  cached: number;
  managed: number;
}
export interface DebugBridge {
  getCombat(): CombatSnapshot & {
    selected: number | null;
    preview: number | null;
    shots: number;
    time: number;
    actors: readonly {
      id: number;
      kind: string;
      faction: string;
      x: number;
      y: number;
      health: number;
      hostile: boolean;
    }[];
    projectiles: readonly { x: number; y: number; target: number }[];
    actorSlots: number;
    projectileSlots: number;
  };
  getAudio(): AudioDebugSnapshot;
  isReady(): boolean;
  getState(): GameSnapshot & { paused: boolean; map: boolean; zoom: number };
  getBuildings(): Footprint[];
  getBuildingViews(): BuildingView[];
}
