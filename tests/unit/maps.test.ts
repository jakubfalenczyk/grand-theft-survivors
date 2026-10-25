import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateCity, generateMap } from '../../src/game/features/world/generateCity.ts';
import { MapCatalog } from '../../src/game/features/world/maps/catalog.ts';
import { validateSpawns } from '../../src/game/features/world/validateMap.ts';
import { surfaceAt } from '../../src/game/features/world/surfaceAt.ts';
import { mapA, mapB } from '../fixtures/maps.ts';
import type { BuildingData, WorldLayout } from '../../src/shared/contracts.ts';

// Recorded from the pre-migration generator at commit 99af829.
test('Westbridge keeps its original seeded geometry and immutable snapshots', () => {
  const { buildings, blocks, trees } = generateCity();
  const hash = createHash('sha256')
    .update(JSON.stringify({ buildings, blocks, trees }))
    .digest('hex');
  assert.equal(hash, 'bd1a38dd8df8bd2ca1313e19269953ad2c342df2c325c9e598b180f12bf4dfe3');
  assert.throws(() => {
    Object.assign(buildings[0], { x: 0 });
  }, TypeError);
  assert.equal(Object.isFrozen(blocks), true);
});

test('authored maps use their own bounds, spawns, districts and surface geometry', () => {
  const a = generateMap(mapA),
    b = generateMap(mapB);
  assert.deepEqual(b, generateMap(mapB));
  assert.deepEqual(b.bounds, { width: 1260, height: 840 });
  assert.deepEqual(b.spawns, mapB.spawns);
  assert.equal(a.seed, b.seed);
  assert.notDeepEqual(a.buildings, b.buildings);
  assert.equal(surfaceAt(b, { x: 520, y: 520 }), 'grass');
  assert.equal(surfaceAt(b, { x: 630, y: 520 }), 'concrete');
  assert.equal(surfaceAt(a, { x: 520, y: 520 }), 'concrete');
  assert.deepEqual(generateMap(mapA), a);
});

test('invalid map IDs, definitions and blocked spawns have descriptive errors', () => {
  const catalog = new MapCatalog([mapA, mapB]);
  assert.throws(() => catalog.get('missing'), /Unknown map ID: missing/);
  assert.throws(() => new MapCatalog([mapA, mapA]), /Duplicate map ID/);
  assert.throws(() => new MapCatalog([]), /catalog is empty/);
  assert.throws(
    () => generateMap({ ...mapA, bounds: { width: NaN, height: 840 } }),
    /fixture-a.*bounds/,
  );
  assert.throws(() => generateMap({ ...mapA, spawns: [] }), /fixture-a.*spawn/);
  assert.throws(() => generateMap({ ...mapA, spawns: [{ x: 85, y: 85 }] }), /spawn 0.*clearance/);
  assert.throws(() => generateMap({ ...mapA, spawns: [{ x: 12, y: 394 }] }), /clearance/);
  assert.throws(() => generateMap(mapA, NaN), /invalid seed/);
  assert.throws(() => generateMap({ ...mapA, districts: [] }), /districts must cover/);
  assert.throws(
    () => generateMap({ ...mapA, districts: [...mapA.districts, ...mapA.districts] }),
    /districts overlap/,
  );
});

test('spawn validation rejects sealed pockets and corridors too narrow for the player', () => {
  const base = generateMap({ ...mapA, blocks: [] });
  const wall = (id: number, x: number, y: number, w: number, h: number): BuildingData => ({
    id,
    x,
    y,
    w,
    h,
    height: 95,
    floors: 4,
    district: 'old-town',
  });
  const ring = [
    wall(0, 100, 100, 200, 20),
    wall(1, 100, 280, 200, 20),
    wall(2, 100, 120, 20, 160),
    wall(3, 280, 120, 20, 160),
  ];
  const pocket: WorldLayout = { ...base, buildings: ring, spawns: [{ x: 200, y: 200 }] };
  assert.throws(() => validateSpawns(pocket), /spawn 0 is unreachable/);
  // A visual gap of eight units is narrower than the ten-unit physics body.
  const gap = {
    ...pocket,
    buildings: [...ring.slice(0, 3), wall(3, 280, 120, 20, 76), wall(4, 280, 204, 20, 76)],
  };
  assert.throws(() => validateSpawns(gap), /unreachable/);
  validateSpawns({
    ...pocket,
    buildings: [...ring.slice(0, 3), wall(3, 280, 120, 20, 60), wall(4, 280, 220, 20, 60)],
  });
});
