import type Phaser from 'phaser';
import { seededRandom } from '../../../shared/math.ts';
import { tokens, worldInk as ink, withAlpha, materialShade } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';

export function drawCar(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  vertical = false,
) {
  c.save();
  c.translate(x, y);
  if (vertical) c.rotate(Math.PI / 2);
  rect(c, withAlpha(ink.shadow, 0.5), -11, -5, 25, 14);
  rect(c, ink.deep, -10, -7, 20, 14);
  rect(c, color, -12, -6, 25, 12);
  rect(c, materialShade(color, 0.3), -10, -5, 20, 1);
  rect(c, materialShade(color, -0.25), -10, 5, 20, 1);
  rect(c, ink['rubber'], -8, -7, 5, 1);
  rect(c, ink['rubber'], 6, -7, 5, 1);
  rect(c, ink['rubber'], -8, 6, 5, 1);
  rect(c, ink['rubber'], 6, 6, 5, 1);
  rect(c, ink['glass-deep'], -5, -4, 12, 8);
  rect(c, ink['glass-light'], -4, -3, 2, 6);
  rect(c, ink['glass-light'], 5, -3, 1, 6);
  rect(c, materialShade(color, 0.15), -1, -4, 5, 8);
  rect(c, ink['metal-light'], -12, -4, 1, 8);
  rect(c, ink['metal-light'], 12, -4, 1, 8);
  rect(c, ink.lamp, 12, -4, 2, 2);
  rect(c, ink.lamp, 12, 2, 2, 2);
  rect(c, ink['car-clay'], -12, -4, 1, 2);
  rect(c, ink['car-clay'], -12, 2, 1, 2);
  c.restore();
}
export function createTreeTexture(scene: Phaser.Scene) {
  const key = 'city-tree';
  if (scene.textures.exists(key)) return key;
  const size = tokens.world['pixel-art']['min-frame-px'];
  const canopy = createCanvasTexture(scene, key, size, size),
    c = canopy.context;
  const rng = seededRandom(711);
  rect(c, ink['bark'], 57, 84, 12, 36);
  rect(c, ink.deep, 65, 88, 3, 32);
  // Leaf clusters merge without a dark contour around each lobe.
  const clusters = [
    [41, 33, 28],
    [69, 29, 26],
    [86, 48, 26],
    [79, 74, 28],
    [48, 78, 29],
    [27, 57, 24],
    [55, 52, 30],
  ];
  for (const [cx, cy, radius] of clusters) {
    for (let y = -radius; y <= radius; y++) {
      const half = Math.floor(Math.sqrt(radius * radius - y * y) / 2) * 2;
      rect(c, ink['leaf-mid'], cx - half, cy + y, half * 2 + 1, 1);
    }
    for (let leaf = 0; leaf < 180; leaf++) {
      const x = Math.floor((rng() * 2 - 1) * radius),
        y = Math.floor((rng() * 2 - 1) * radius);
      if (x * x + y * y > (radius - 2) ** 2) continue;
      const shade = (Math.floor(rng() * 6) - 3) * 0.09 + (y < -5 ? 0.12 : -0.05);
      rect(c, materialShade(ink['leaf-mid'], shade), cx + x, cy + y, 2 + Math.floor(rng() * 3), 2);
      if (leaf % 7 === 0) rect(c, ink['leaf-edge'], cx + x, cy + y, 2, 1);
    }
  }
  canopy.refresh();
  return key;
}
