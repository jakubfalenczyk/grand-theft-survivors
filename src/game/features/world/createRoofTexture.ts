import type { BuildingData } from '../../../shared/contracts.ts';
import type Phaser from 'phaser';
import { seededRandom } from '../../../shared/math.ts';
import { worldInk as ink, withAlpha } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';
import { DISTRICTS } from './districts.ts';

export function createRoofTexture(scene: Phaser.Scene, building: BuildingData, seed: number) {
  const { id, w, h } = building,
    key = `city-${seed}-roof-${id}`;
  if (scene.textures.exists(key)) return key;
  const rng = seededRandom(seed + id * 71),
    between = (a: number, b: number) => Math.floor(a + rng() * (b - a));
  const district = DISTRICTS.find((d) => d.id === building.district);
  if (!district) throw new Error(`Unknown district: ${building.district}`);
  const roof = createCanvasTexture(scene, key, w, h),
    r = roof.context;
  rect(r, district.edge, 0, 0, w, h);
  rect(r, ink.deep, 3, 3, w - 6, h - 6);
  rect(r, district.roof, 5, 5, w - 10, h - 10);
  for (let a = 8; a < w - 6; a += 7) rect(r, withAlpha(ink.highlight, 0.12), a, 7, 1, h - 14);
  for (let a = 9; a < h - 8; a += 28) rect(r, withAlpha(ink.deep, 0.4), 6, a, w - 12, 1);
  rect(r, ink.edge, 5, 5, w - 10, 2);
  rect(r, ink.dark, 5, h - 8, w - 10, 3);
  for (let a = 0; a < Math.max(1, Math.floor(w / 65)); a++) {
    const ax = between(13, w - 28),
      ay = between(13, h - 28);
    rect(r, ink.deep, ax + 3, ay + 4, 19, 20);
    rect(r, ink.detail, ax, ay, 18, 16);
    rect(r, ink.wall, ax + 2, ay + 2, 14, 12);
    for (let k = 0; k < 4; k++) rect(r, ink.edge, ax + 3, ay + 3 + k * 3, 12, 1);
  }
  if (w > 100 && h > 100) {
    rect(r, ink.deep, w - 44, h - 40, 30, 25);
    rect(r, ink.edge, w - 45, h - 42, 29, 24);
    rect(r, ink.detail, w - 43, h - 40, 25, 2);
  }
  roof.refresh();
  return key;
}
