import type { MapDefinition } from '../../src/game/features/world/maps/types.ts';

// Test-only maps deliberately share a seed and building IDs, with different materials and bounds.
export const mapA = {
  id: 'fixture-a',
  nameKey: 'district.old-town',
  seed: 2042,
  bounds: { width: 840, height: 840 },
  spawns: [{ x: 420, y: 394 }],
  streets: { vertical: [0, 420, 840], horizontal: [0, 420, 840], width: 108, labels: [] },
  districts: [
    { id: 'old-town', bounds: { x: 0, y: 0, w: 840, h: 840 }, label: { x: 420, y: 180 } },
  ],
  blocks: [{ x: 80, y: 80, park: false, parking: false }],
} as const satisfies MapDefinition;

export const mapB = {
  id: 'fixture-b',
  nameKey: 'district.greenfield',
  seed: 2042,
  bounds: { width: 1260, height: 840 },
  spawns: [
    { x: 840, y: 394 },
    { x: 420, y: 814 },
  ],
  streets: { vertical: [0, 420, 840, 1260], horizontal: [0, 420, 840], width: 108, labels: [] },
  districts: [
    { id: 'greenfield', bounds: { x: 0, y: 0, w: 1260, h: 840 }, label: { x: 630, y: 180 } },
  ],
  blocks: [
    { x: 80, y: 80, park: false, parking: false },
    { x: 500, y: 500, park: true, parking: false },
  ],
} as const satisfies MapDefinition;
