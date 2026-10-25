import type { MapDefinition } from '../types.ts';
import { blocks } from './blocks.ts';

export const westbridge = {
  id: 'westbridge',
  nameKey: 'city',
  seed: 2042,
  bounds: { width: 2520, height: 2520 },
  spawns: [{ x: 1260, y: 1234 }],
  streets: {
    vertical: [0, 420, 840, 1260, 1680, 2100, 2520],
    horizontal: [0, 420, 840, 1260, 1680, 2100, 2520],
    width: 108,
    labels: [
      { key: 'street.mercer', position: { x: 1470, y: 447 } },
      { key: 'street.foundry', position: { x: 1470, y: 867 } },
      { key: 'street.westbridge', position: { x: 1470, y: 1287 } },
      { key: 'street.grove', position: { x: 1470, y: 1707 } },
      { key: 'street.south', position: { x: 1470, y: 2127 } },
    ],
  },
  districts: [
    { id: 'old-town', bounds: { x: 0, y: 0, w: 2520, h: 840 }, label: { x: 1260, y: 403.2 } },
    { id: 'ironworks', bounds: { x: 0, y: 840, w: 1680, h: 1680 }, label: { x: 705.6, y: 1461.6 } },
    {
      id: 'greenfield',
      bounds: { x: 1680, y: 840, w: 840, h: 1680 },
      label: { x: 1990.8, y: 1764 },
    },
  ],
  blocks,
} as const satisfies MapDefinition;
