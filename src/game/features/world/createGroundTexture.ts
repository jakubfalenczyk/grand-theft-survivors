import { t } from '../../../shared/intl/index.ts';
import type { WorldLayout } from '../../../shared/contracts.ts';
import type Phaser from 'phaser';
import { seededRandom } from '../../../shared/math.ts';
import { tokens, worldInk as ink, withAlpha } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';
import { BLOCK, ROAD } from './config.ts';
import { drawCar } from './createPropTextures.ts';

export function createGroundTexture(scene: Phaser.Scene, layout: WorldLayout) {
  const key = `city-${layout.seed}-ground`;
  if (scene.textures.exists(key)) return key;
  const texture = createCanvasTexture(scene, key, layout.size, layout.size),
    c = texture.context;
  const rng = seededRandom(layout.seed + 99),
    between = (a: number, b: number) => Math.floor(a + rng() * (b - a));
  rect(c, ink.ground, 0, 0, layout.size, layout.size);
  for (let i = 0; i < 40000; i++)
    rect(
      c,
      withAlpha(rng() > 0.5 ? ink.detail : ink.shadow, 0.12),
      between(0, layout.size),
      between(0, layout.size),
      between(1, 4),
      1,
    );
  for (let i = 0; i <= 6; i++) {
    const p = i * BLOCK;
    rect(c, ink.wall, p - ROAD / 2 - 14, 0, ROAD + 28, layout.size);
    rect(c, ink.wall, 0, p - ROAD / 2 - 14, layout.size, ROAD + 28);
    rect(c, ink.road, p - ROAD / 2, 0, ROAD, layout.size);
    rect(c, ink.road, 0, p - ROAD / 2, layout.size, ROAD);
  }
  // Paving slabs, curb joints and drains are baked once at world resolution.
  for (let i = 0; i <= 6; i++) {
    const p = i * BLOCK;
    for (const side of [-1, 1]) {
      const edge = p + side * (ROAD / 2 + 7);
      rect(c, ink.paving, edge - 6, 0, 12, layout.size);
      rect(c, ink.paving, 0, edge - 6, layout.size, 12);
      rect(c, ink['paving-light'], edge - 6, 0, 1, layout.size);
      rect(c, ink['paving-light'], 0, edge - 6, layout.size, 1);
      for (let q = 0; q < layout.size; q += 12) {
        rect(c, ink['paving-dark'], edge - 6, q, 12, 1);
        rect(c, ink['paving-dark'], q, edge - 6, 1, 12);
        if (q % 96 === 0) {
          rect(c, ink.deep, edge - 3, q + 3, 6, 7);
          rect(c, ink.deep, q + 3, edge - 3, 7, 6);
          for (let slat = 0; slat < 3; slat++) {
            rect(c, ink['metal-light'], edge - 2 + slat * 2, q + 4, 1, 5);
            rect(c, ink['metal-light'], q + 4, edge - 2 + slat * 2, 5, 1);
          }
        }
      }
    }
  }
  for (let i = 0; i < 18000; i++) {
    const x = between(0, layout.size),
      y = between(0, layout.size);
    if (
      Math.min(x % BLOCK, BLOCK - (x % BLOCK)) < ROAD / 2 ||
      Math.min(y % BLOCK, BLOCK - (y % BLOCK)) < ROAD / 2
    )
      rect(c, withAlpha(rng() > 0.5 ? ink.highlight : ink.deep, 0.06), x, y, 2, 1);
  }
  for (let i = 0; i <= 6; i++)
    for (let q = 0; q < layout.size; q += 22) {
      const p = i * BLOCK;
      if (Math.min(q % BLOCK, BLOCK - (q % BLOCK)) > 75) {
        rect(c, ink.edge, p - 1, q, 2, 10);
        rect(c, ink.edge, q, p - 1, 10, 2);
      }
      rect(c, ink.dark, p - 66, q, 2, 1);
      rect(c, ink.dark, p + 64, q, 2, 1);
      rect(c, ink.dark, q, p - 66, 1, 2);
      rect(c, ink.dark, q, p + 64, 1, 2);
    }
  for (let i = 0; i <= 6; i++)
    for (let j = 0; j <= 6; j++) {
      const x = i * BLOCK,
        y = j * BLOCK;
      for (let z = -36; z < 40; z += 10) {
        rect(c, ink.light, x + z, y - 72, 6, 15);
        rect(c, ink.light, x + z, y + 57, 6, 15);
        rect(c, ink.light, x - 72, y + z, 15, 6);
        rect(c, ink.light, x + 57, y + z, 15, 6);
      }
      rect(c, ink.wall, x + 32, y + 33, 8, 8);
      rect(c, ink.deep, x + 34, y + 35, 4, 4);
    }
  for (const { x, y, park, parking } of layout.blocks) {
    if (park) {
      rect(c, ink.grass, x, y, 260, 260);
      for (let tuft = 0; tuft < 1600; tuft++) {
        const tx = x + between(1, 258),
          ty = y + between(1, 258);
        rect(c, rng() > 0.5 ? ink['leaf-dark'] : ink['leaf-mid'], tx, ty, 1, 2);
      }
      rect(c, ink.edge, x + 118, y, 24, 260);
      rect(c, ink.edge, x, y + 118, 260, 24);
      rect(c, ink.wall, x + 90, y + 90, 80, 80);
      rect(c, ink.deep, x + 103, y + 103, 54, 54);
      rect(c, ink.roof, x + 108, y + 108, 44, 44);
      rect(c, ink.light, x + 125, y + 123, 9, 12);
      for (let a = 0; a < 4; a++) {
        rect(c, ink.deep, x + 102, y + 20 + a * 67, 5, 20);
        rect(c, ink.detail, x + 101, y + 20 + a * 67, 3, 20);
      }
    } else {
      if (parking) {
        rect(c, ink.dark, x + 150, y + 151, 124, 123);
        for (let k = 0; k < 4; k++) {
          rect(c, ink.edge, x + 155, y + 158 + k * 27, 31, 1);
          drawCar(
            c,
            x + 170,
            y + 169 + k * 27,
            [ink['car-clay'], ink['car-steel'], ink['car-sage'], ink['car-paper']][k],
          );
        }
      }
      rect(c, ink.deep, x + 134, y + 160, 7, 13);
      rect(c, ink.wall, x + 135, y + 161, 5, 10);
      drawCar(
        c,
        x + between(10, 210),
        y - 39,
        [ink['car-clay'], ink['car-steel'], ink['car-sage'], ink['car-paper']][between(0, 4)],
      );
      drawCar(c, x - 38, y + between(10, 215), ink['car-steel'], true);
    }
    rect(c, ink.deep, x + 273, y + 25, 5, 12);
    rect(c, ink.edge, x + 274, y + 24, 3, 11);
    for (const [lx, ly] of [
      [x - 17, y - 15],
      [x + 273, y + 275],
    ]) {
      rect(c, withAlpha(ink.shadow, 0.4), lx + 2, ly + 2, 16, 4);
      rect(c, ink.dark, lx, ly, 3, 8);
      rect(c, ink.lamp, lx - 2, ly - 2, 7, 4);
    }
  }
  for (const b of layout.buildings) {
    rect(c, withAlpha(ink.shadow, 0.4), b.x + 11, b.y + 15, b.w + 8, b.h + 9);
    rect(c, ink.deep, b.x - 2, b.y - 2, b.w + 4, b.h + 4);
    rect(c, ink.dark, b.x, b.y, b.w, b.h);
  }
  c.fillStyle = ink.edge;
  c.font = `600 11px ${tokens.font.mono}`;
  c.textAlign = 'center';
  for (let j = 1; j < 6; j++)
    c.fillText(
      [
        '',
        t('street.mercer'),
        t('street.foundry'),
        t('street.westbridge'),
        t('street.grove'),
        t('street.south'),
      ][j],
      BLOCK * 3 + 210,
      j * BLOCK + 27,
    );
  texture.refresh();
  return key;
}
