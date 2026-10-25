import type { WorldLayout, BuildingData, SurfaceRegion, Point } from '../../../shared/contracts.ts';
import { seededRandom } from '../../../shared/math.ts';
import type { MapDefinition } from './maps/types.ts';
import { westbridge } from './maps/westbridge/index.ts';
import { validateMapDefinition, validateSpawns } from './validateMap.ts';
import { districtAt } from './districtAt.ts';

/** Pure layout data. Physics, map and renderer all consume these same footprints. */
export function generateCity(seed: number = westbridge.seed): WorldLayout {
  return generateMap(westbridge, seed);
}

export function generateMap(
  definition: MapDefinition,
  seed: number = definition.seed,
): WorldLayout {
  validateMapDefinition(definition);
  if (!Number.isSafeInteger(seed)) throw new Error(`Map ${definition.id}: invalid seed ${seed}`);
  const rng = seededRandom(seed),
    between = (min: number, max: number) => Math.floor(min + rng() * (max - min));
  const buildings: BuildingData[] = [],
    blocks = definition.blocks.map((block) => ({ ...block })),
    trees: Point[] = [];
  const addBuilding = (x: number, y: number, w: number, h: number, tall: number) =>
    buildings.push({
      id: buildings.length,
      x,
      y,
      w,
      h,
      height: 60 + tall * 35,
      floors: 2 + tall * 2,
      district: districtAt(definition.districts, x, y).id,
    });
  for (const { x, y, park, parking } of blocks) {
    if (park) {
      for (let a = 0; a < 14; a++) {
        const tx = x + between(12, 245),
          ty = y + between(12, 245);
        if (Math.abs(tx - x - 130) > 26 && Math.abs(ty - y - 130) > 26)
          trees.push({ x: tx, y: ty });
      }
    } else {
      addBuilding(x + 4, y + 4, between(110, 129), between(112, 134), between(1, 4));
      addBuilding(x + 151, y + 4, between(105, 126), between(99, 128), between(1, 4));
      addBuilding(x + 4, y + 158, between(108, 128), between(94, 116), between(1, 4));
      if (!parking)
        addBuilding(x + 151, y + 153, between(105, 126), between(97, 121), between(1, 4));
    }
    for (let k = 0; k < 3; k++) trees.push({ x: x + 40 + k * 82, y: y + 278 });
  }
  const surfaces: SurfaceRegion[] = [];
  for (const { x, y, park } of blocks) {
    if (!park) continue;
    surfaces.push(
      { x, y, w: 260, h: 260, material: 'grass', role: 'lawn' },
      { x: x + 118, y, w: 24, h: 260, material: 'concrete', role: 'path' },
      { x, y: y + 118, w: 260, h: 24, material: 'concrete', role: 'path' },
      { x: x + 90, y: y + 90, w: 80, h: 80, material: 'concrete', role: 'plaza' },
    );
  }
  const layout: WorldLayout = {
    mapId: definition.id,
    nameKey: definition.nameKey,
    seed,
    bounds: { ...definition.bounds },
    spawns: definition.spawns.map((point) => ({ ...point })),
    streets: structuredClone(definition.streets),
    districts: structuredClone(definition.districts),
    surfaces,
    buildings,
    blocks,
    trees,
  };
  validateSpawns(layout);
  return freezeLayout(layout);
}

/** Snapshots shared with the UI are immutable, including nested geometry. */
function freezeLayout<T extends object>(value: T): T {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') freezeLayout(child);
  }
  return Object.freeze(value);
}
