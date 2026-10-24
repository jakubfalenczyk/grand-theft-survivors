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
export interface WorldLayout {
  seed: number;
  size: number;
  buildings: BuildingData[];
  blocks: CityBlock[];
  trees: Point[];
}
export interface PlayerSnapshot extends Point {
  heading: number;
  moving: number;
  running: boolean;
}
export interface GameSnapshot extends PlayerSnapshot {
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
export type SessionMode = 'playing' | 'paused' | 'help' | 'map';
export interface SessionState {
  readonly mode: SessionMode;
  readonly zoom: number;
}
export interface AppEvents {
  'command:reset-player': undefined;
  'game:world-ready': WorldLayout;
  'game:snapshot': GameSnapshot;
}
export interface DebugBridge {
  isReady(): boolean;
  getState(): GameSnapshot & { paused: boolean; map: boolean; zoom: number };
  getBuildings(): Footprint[];
  getBuildingViews(): BuildingView[];
}
