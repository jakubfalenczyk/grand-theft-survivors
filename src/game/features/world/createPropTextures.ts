import type Phaser from 'phaser';
import { seededRandom } from '../../../shared/math.ts';
import { worldInk as ink, withAlpha } from '../../../theme/theme.ts';
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
  rect(c, ink.light, -4, -5, 11, 10);
  rect(c, ink.road, -4, -4, 3, 8);
  rect(c, ink.road, 5, -4, 3, 8);
  rect(c, ink.highlight, 12, -4, 2, 2);
  rect(c, ink.highlight, 12, 2, 2, 2);
  rect(c, ink.detail, -12, -4, 2, 2);
  rect(c, ink.detail, -12, 2, 2, 2);
  c.restore();
}
export function createTreeTexture(scene: Phaser.Scene) {
  const key = 'city-tree';
  if (scene.textures.exists(key)) return key;
  const canopy = createCanvasTexture(scene, key, 38, 42),
    c = canopy.context,
    rng = seededRandom(711);
  rect(c, withAlpha(ink.shadow, 0.5), 8, 14, 28, 25);
  rect(c, ink.deep, 17, 29, 4, 11);
  for (const [color, x, y, w, h] of [
    [ink['leaf-deep'], 5, 9, 27, 23],
    [ink['leaf-dark'], 2, 11, 30, 15],
    [ink['leaf-mid'], 7, 3, 22, 27],
    [ink['leaf-light'], 8, 4, 16, 15],
    [ink['leaf-edge'], 10, 5, 9, 6],
  ] as [string, number, number, number, number][])
    rect(c, color, x, y, w, h);
  for (let i = 0; i < 25; i++)
    rect(
      c,
      rng() > 0.5 ? ink['leaf-light'] : ink['leaf-dark'],
      7 + rng() * 22,
      9 + rng() * 19,
      2,
      2,
    );
  canopy.refresh();
  return key;
}
