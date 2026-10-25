import type { Footprint, Point } from '../../../shared/contracts.ts';
import type { CombatWorld } from './types.ts';

/** First intersection along a segment, including a start inside the expanded footprint. */
export function segmentBox(
  a: Point,
  b: Point,
  box: Readonly<Footprint>,
  padding = 0,
): number | null {
  let enter = 0,
    exit = 1;
  for (const [start, delta, low, high] of [
    [a.x, b.x - a.x, box.x - padding, box.x + box.w + padding],
    [a.y, b.y - a.y, box.y - padding, box.y + box.h + padding],
  ]) {
    if (Math.abs(delta) < 1e-10) {
      if (start < low || start > high) return null;
    } else {
      const t1 = (low - start) / delta,
        t2 = (high - start) / delta;
      enter = Math.max(enter, Math.min(t1, t2));
      exit = Math.min(exit, Math.max(t1, t2));
      if (enter > exit) return null;
    }
  }
  return enter;
}
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export function clearSegment(a: Point, b: Point, world: CombatWorld, padding = 0) {
  return !world.buildings.some((box) => segmentBox(a, b, box, padding) !== null);
}
export function validPoint(point: Point, world: CombatWorld, radius = 8) {
  return (
    point.x >= radius &&
    point.y >= radius &&
    point.x <= world.width - radius &&
    point.y <= world.height - radius &&
    clearSegment(point, point, world, radius)
  );
}
export function segmentCircle(a: Point, b: Point, center: Point, radius: number): number | null {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    ox = a.x - center.x,
    oy = a.y - center.y;
  const aa = dx * dx + dy * dy,
    cc = ox * ox + oy * oy - radius * radius;
  if (cc <= 0) return 0;
  if (!aa) return null;
  const bb = 2 * (ox * dx + oy * dy),
    disc = bb * bb - 4 * aa * cc;
  if (disc < 0) return null;
  const t = (-bb - Math.sqrt(disc)) / (2 * aa);
  return t >= 0 && t <= 1 ? t : null;
}
