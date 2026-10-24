import type { Point, Footprint } from '../../src/shared/contracts.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCity } from '../../src/game/features/world/generateCity.ts';
import { SPAWN } from '../../src/game/features/world/config.ts';
import { projectPoint } from '../../src/game/camera/projection.ts';

const inside = (point: Point, b: Footprint) =>
  point.x > b.x && point.x < b.x + b.w && point.y > b.y && point.y < b.y + b.h;
test('layout generation is seeded and independent of rendering', () => {
  assert.deepEqual(generateCity(2042), generateCity(2042));
  assert.notDeepEqual(generateCity(2042).buildings, generateCity(2043).buildings);
  assert.equal(
    generateCity().buildings.some((b) => inside(SPAWN, b)),
    false,
  );
});
test('footprints remain within the world and do not overlap', () => {
  const world = generateCity();
  for (const b of world.buildings) {
    assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= world.size && b.y + b.h <= world.size);
    for (const other of world.buildings)
      if (b.id !== other.id) {
        assert.equal(
          b.x < other.x + other.w &&
            b.x + b.w > other.x &&
            b.y < other.y + other.h &&
            b.y + b.h > other.y,
          false,
        );
      }
  }
});
test('ground projection stays fixed; higher points expand farther from camera', () => {
  assert.deepEqual(projectPoint(100, 100, 0, 50, 50), { x: 100, y: 100, scale: 1 });
  const low = projectPoint(100, 100, 95, 50, 50),
    high = projectPoint(100, 100, 165, 50, 50);
  assert.ok(high.x > low.x);
  assert.ok(high.scale > low.scale);
});
