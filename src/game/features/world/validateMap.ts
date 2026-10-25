import type { Footprint, Point, WorldLayout } from '../../../shared/contracts.ts';
import type { MapDefinition } from './maps/types.ts';

import { PLAYER_FOOTPRINT } from '../player/config.ts';

// The body sits two units below the sprite center; validation uses the same footprint.
export const WORLD_INSET = 8;
const contains = (b: Readonly<Footprint>, p: Readonly<Point>) =>
  p.x >= b.x && p.y >= b.y && p.x < b.x + b.w && p.y < b.y + b.h;

export function validateMapDefinition(map: MapDefinition) {
  const fail = (message: string): never => {
    throw new Error(`Map ${map.id}: ${message}`);
  };
  const { width, height } = map.bounds;
  if (!map.id.trim()) fail('ID is empty');
  if (
    ![width, height].every(
      (n) =>
        Number.isSafeInteger(n) &&
        n > 2 * WORLD_INSET + Math.max(PLAYER_FOOTPRINT.w, PLAYER_FOOTPRINT.h),
    )
  )
    fail('bounds must have positive integer width and height with player clearance');
  if (!map.spawns.length) fail('at least one player spawn is required');
  if (!Number.isSafeInteger(map.seed)) fail('seed must be a safe integer');
  if (!Number.isFinite(map.streets.width) || map.streets.width <= 0)
    fail('street width must be positive');
  for (const [axis, limit] of [
    [map.streets.vertical, width],
    [map.streets.horizontal, height],
  ] as const) {
    if (
      new Set(axis).size !== axis.length ||
      axis.some((p) => !Number.isFinite(p) || p < 0 || p > limit)
    )
      fail('street coordinates must be unique and within bounds');
  }
  for (const district of map.districts) {
    const b = district.bounds;
    if (
      ![b.x, b.y, b.w, b.h].every(Number.isFinite) ||
      b.x < 0 ||
      b.y < 0 ||
      b.w <= 0 ||
      b.h <= 0 ||
      b.x + b.w > width ||
      b.y + b.h > height
    )
      fail(`invalid district bounds: ${district.id}`);
    if (!contains(b, district.label)) fail(`district label is outside ${district.id}`);
  }
  for (const [index, district] of map.districts.entries()) {
    const a = district.bounds;
    for (const other of map.districts.slice(index + 1)) {
      const b = other.bounds;
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y)
        fail(`districts overlap: ${district.id}, ${other.id}`);
    }
  }
  const districtArea = map.districts.reduce((area, { bounds: b }) => area + b.w * b.h, 0);
  if (Math.abs(districtArea - width * height) > 0.001) fail('districts must cover the world');
  for (const block of map.blocks) {
    if (
      ![block.x, block.y].every(Number.isFinite) ||
      block.x < 0 ||
      block.y < 0 ||
      block.x + 280 > width ||
      block.y + 280 > height
    )
      fail('block extends beyond bounds');
  }
}

/** Exact axis-aligned free-space connectivity, accounting for the player's clearance. */
export function validateSpawns(layout: WorldLayout) {
  const { width, height } = layout.bounds;
  const minX = WORLD_INSET - PLAYER_FOOTPRINT.x;
  const minY = WORLD_INSET - PLAYER_FOOTPRINT.y;
  const maxX = width - WORLD_INSET - PLAYER_FOOTPRINT.x - PLAYER_FOOTPRINT.w;
  const maxY = height - WORLD_INSET - PLAYER_FOOTPRINT.y - PLAYER_FOOTPRINT.h;
  const obstacles = layout.buildings.map((b) => ({
    x: b.x - PLAYER_FOOTPRINT.x - PLAYER_FOOTPRINT.w,
    y: b.y - PLAYER_FOOTPRINT.y - PLAYER_FOOTPRINT.h,
    w: b.w + PLAYER_FOOTPRINT.w,
    h: b.h + PLAYER_FOOTPRINT.h,
  }));
  const fail = (message: string): never => {
    throw new Error(`Map ${layout.mapId}: ${message}`);
  };
  for (const building of layout.buildings) {
    if (
      building.x < 0 ||
      building.y < 0 ||
      building.x + building.w > width ||
      building.y + building.h > height
    )
      fail(`building ${building.id} is outside bounds`);
  }
  for (const [index, p] of layout.spawns.entries()) {
    if (
      ![p.x, p.y].every(Number.isFinite) ||
      p.x <= minX ||
      p.y <= minY ||
      p.x >= maxX ||
      p.y >= maxY ||
      obstacles.some((b) => contains(b, p))
    )
      fail(`spawn ${index} at (${p.x}, ${p.y}) lacks player clearance`);
    if (!layout.districts.some((d) => contains(d.bounds, p)))
      fail(`spawn ${index} has no district`);
  }
  // Obstacle edges partition free space into rectangular cells. Adjacent free cells connect.
  const xs = [...new Set([minX, maxX, ...obstacles.flatMap((b) => [b.x, b.x + b.w])])]
    .filter((n) => n >= minX && n <= maxX)
    .sort((a, b) => a - b);
  const ys = [...new Set([minY, maxY, ...obstacles.flatMap((b) => [b.y, b.y + b.h])])]
    .filter((n) => n >= minY && n <= maxY)
    .sort((a, b) => a - b);
  const cols = xs.length - 1,
    rows = ys.length - 1;
  const free = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const point = { x: (xs[x] + xs[x + 1]) / 2, y: (ys[y] + ys[y + 1]) / 2 };
      free[y * cols + x] = Number(!obstacles.some((b) => contains(b, point)));
    }
  const cellAt = (p: Readonly<Point>) => {
    const x = xs.findIndex((n, i) => i < cols && p.x >= n && p.x < xs[i + 1]);
    const y = ys.findIndex((n, i) => i < rows && p.y >= n && p.y < ys[i + 1]);
    return y * cols + x;
  };
  // Use the largest connected walkable component as the public world, not a sealed spawn pocket.
  const components = new Int32Array(free.length).fill(-1);
  const areas: number[] = [];
  for (let start = 0; start < free.length; start++) {
    if (!free[start] || components[start] !== -1) continue;
    const id = areas.length,
      queue = [start];
    components[start] = id;
    let area = 0;
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i],
        x = cell % cols,
        y = Math.floor(cell / cols);
      area += (xs[x + 1] - xs[x]) * (ys[y + 1] - ys[y]);
      for (const next of [
        x > 0 ? cell - 1 : -1,
        x + 1 < cols ? cell + 1 : -1,
        y > 0 ? cell - cols : -1,
        y + 1 < rows ? cell + cols : -1,
      ]) {
        if (next >= 0 && free[next] && components[next] === -1) {
          components[next] = id;
          queue.push(next);
        }
      }
    }
    areas.push(area);
  }
  const publicComponent = areas.indexOf(Math.max(...areas));
  for (const [index, spawn] of layout.spawns.entries()) {
    if (components[cellAt(spawn)] !== publicComponent)
      fail(`spawn ${index} is unreachable from the main walkable area`);
  }
}
