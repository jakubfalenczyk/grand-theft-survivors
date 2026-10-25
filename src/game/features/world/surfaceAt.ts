import type { Point, WorldLayout } from '../../../shared/contracts.ts';
import type { SurfaceId } from '../../../shared/audio/types.ts';

/** Matches the existing park lawn and concrete paths in createGroundTexture. */
export function surfaceAt(layout: WorldLayout, point: Point): SurfaceId {
  for (const block of layout.blocks) {
    if (!block.park) continue;
    const x = point.x - block.x,
      y = point.y - block.y;
    if (x < 0 || y < 0 || x >= 260 || y >= 260) continue;
    if ((x >= 118 && x < 142) || (y >= 118 && y < 142)) return 'concrete';
    if (x >= 90 && x < 170 && y >= 90 && y < 170) return 'concrete';
    return 'grass';
  }
  return 'concrete';
}
