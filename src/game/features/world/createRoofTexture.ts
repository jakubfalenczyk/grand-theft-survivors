import type { BuildingData } from '../../../shared/contracts.ts';
import type Phaser from 'phaser';
import { seededRandom } from '../../../shared/math.ts';
import { tokens, worldInk as ink, materialShade } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';
import { DISTRICTS } from './districts.ts';

export function createRoofTexture(
  scene: Phaser.Scene,
  building: BuildingData,
  seed: number,
  prefix: string,
) {
  const { id, w, h } = building,
    key = `${prefix}roof-${id}`;
  if (scene.textures.exists(key)) return key;
  const spec = tokens.world['pixel-art'];
  const density = Math.max(spec['roof-density'], Math.ceil(spec['min-frame-px'] / Math.min(w, h)));
  const width = w * density,
    height = h * density;
  const roof = createCanvasTexture(scene, key, width, height),
    c = roof.context;
  const district = DISTRICTS.find((d) => d.id === building.district);
  if (!district) throw new Error(`Unknown district: ${building.district}`);
  const rng = seededRandom(seed + id * 71);
  rect(c, ink.deep, 0, 0, width, height);
  rect(c, district.edge, 1, 1, width - 2, height - 2);
  rect(c, district.roof, 3, 3, width - 6, height - 6);
  const industrial = building.district === 'ironworks';
  const tileW = industrial ? 12 : 16,
    tileH = industrial ? 40 : 8;
  for (let y = 4; y < height - 4; y += tileH) {
    for (let x = 4 - (industrial ? 0 : ((y / tileH) % 2) * 8); x < width - 4; x += tileW) {
      const left = Math.max(4, x),
        right = Math.min(width - 4, x + tileW - 1);
      rect(
        c,
        materialShade(district.roof, (Math.floor(rng() * 7) - 3) * 0.055),
        left,
        y,
        right - left,
        Math.min(tileH - 1, height - 4 - y),
      );
      rect(c, materialShade(district.roof, 0.23), left, y, right - left, 1);
      if (industrial) rect(c, district.edge, left, y, 1, Math.min(tileH - 1, height - 4 - y));
    }
  }
  // Thin coping, gutters and regularly spaced brackets follow the perimeter.
  rect(c, ink['metal-light'], 2, 2, width - 4, 1);
  rect(c, ink['metal-dark'], 2, height - 4, width - 4, 2);
  for (let x = 8; x < width - 8; x += 24) rect(c, ink.deep, x, height - 4, 2, 2);
  for (let unit = 0; unit < Math.max(1, Math.floor(w / 65)); unit++) {
    const x = 14 + Math.floor(rng() * (width - 60));
    const y = 14 + Math.floor(rng() * (height - 60));
    rect(c, ink.deep, x + 5, y + 7, 36, 30);
    rect(c, ink['metal-dark'], x, y, 36, 30);
    rect(c, ink['metal-light'], x + 1, y + 1, 34, 27);
    rect(c, ink.wall, x + 3, y + 3, 30, 23);
    for (let v = 0; v < 2; v++) {
      rect(c, ink.deep, x + 5 + v * 15, y + 5, 11, 18);
      for (let line = 0; line < 5; line++)
        rect(c, ink.detail, x + 6 + v * 15, y + 6 + line * 3, 9, 1);
    }
    rect(c, ink['metal-dark'], x + 34, y + 12, 12, 3);
    rect(c, ink['metal-light'], x + 34, y + 12, 12, 1);
    for (const dx of [2, 32]) for (const dy of [2, 25]) rect(c, ink.deep, x + dx, y + dy, 1, 1);
  }
  if (w > 100 && h > 100) {
    const x = width - 76,
      y = height - 64;
    rect(c, ink.deep, x + 4, y + 5, 56, 40);
    rect(c, ink['metal-light'], x, y, 56, 40);
    rect(c, ink.deep, x + 1, y + 1, 54, 38);
    rect(c, ink['glass-deep'], x + 3, y + 3, 50, 34);
    for (let p = 0; p < 4; p++) {
      rect(c, ink['glass-light'], x + 4 + p * 13, y + 4, 1, 31);
      rect(c, ink['metal-light'], x + p * 13, y + 19, 13, 1);
    }
  }
  roof.refresh();
  return key;
}
