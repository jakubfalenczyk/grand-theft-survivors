import type { Point, WorldLayout } from '../../../shared/contracts.ts';
import type { SurfaceId } from '../../../shared/audio/types.ts';

/** Later regions overlay earlier regions, matching the ground renderer's paths. */
export function surfaceAt(layout: WorldLayout, point: Point): SurfaceId {
  for (let i = layout.surfaces.length - 1; i >= 0; i--) {
    const b = layout.surfaces[i];
    if (point.x >= b.x && point.y >= b.y && point.x < b.x + b.w && point.y < b.y + b.h)
      return b.material;
  }
  return 'concrete';
}
