import type {
  WorldLayout,
  BuildingData,
  CityBlock,
  Point,
  DistrictId,
} from '../../../shared/contracts.ts';
import { seededRandom } from '../../../shared/math.ts';
import { BLOCK, SEED, WORLD_SIZE } from './config.ts';
import { districtAt } from './districts.ts';

/** Pure layout data. Physics, map and renderer all consume these same footprints. */
export function generateCity(seed = SEED): WorldLayout {
  const rng = seededRandom(seed),
    between = (min: number, max: number) => Math.floor(min + rng() * (max - min));
  const buildings: BuildingData[] = [],
    blocks: CityBlock[] = [],
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
      district: districtAt(x, y).id as DistrictId,
    });
  for (let bx = 0; bx < 6; bx++)
    for (let by = 0; by < 6; by++) {
      const x = bx * BLOCK + 80,
        y = by * BLOCK + 80;
      const park = (bx === 3 && by === 3) || (bx === 4 && by === 4) || (bx === 1 && by === 1);
      const parking = !park && (bx + by) % 3 === 0;
      blocks.push({ x, y, park, parking });
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
  return { seed, size: WORLD_SIZE, buildings, blocks, trees };
}
