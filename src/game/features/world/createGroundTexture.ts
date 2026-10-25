import { t } from '../../../shared/intl/index.ts';
import type { WorldLayout } from '../../../shared/contracts.ts';
import type Phaser from 'phaser';
import { seededRandom } from '../../../shared/math.ts';
import { tokens, worldInk as ink, withAlpha } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';
import { mapTexturePrefix } from './mapTextures.ts';
import { drawCar } from './createPropTextures.ts';

export function createGroundTexture(scene: Phaser.Scene, layout: WorldLayout) {
  const key = `${mapTexturePrefix(layout)}ground`;
  if (scene.textures.exists(key)) return key;
  const { width, height } = layout.bounds;
  const ROAD = layout.streets.width;
  const texture = createCanvasTexture(scene, key, width, height),
    c = texture.context;
  const rng = seededRandom(layout.seed + 99),
    between = (a: number, b: number) => Math.floor(a + rng() * (b - a));
  rect(c, ink.ground, 0, 0, width, height);
  for (let i = 0; i < 40000; i++)
    rect(
      c,
      withAlpha(rng() > 0.5 ? ink.detail : ink.shadow, 0.12),
      between(0, width),
      between(0, height),
      between(1, 4),
      1,
    );
  const roads = [
    ...layout.streets.vertical.map((p, index) => ({
      p,
      index,
      vertical: true,
      length: height,
      crossings: layout.streets.horizontal,
    })),
    ...layout.streets.horizontal.map((p, index) => ({
      p,
      index,
      vertical: false,
      length: width,
      crossings: layout.streets.vertical,
    })),
  ];
  const along = (vertical: boolean, color: string, x: number, y: number, w: number, h: number) => {
    if (vertical) rect(c, color, x, y, w, h);
    else rect(c, color, y, x, h, w);
  };
  // Interleave the two axes to preserve Westbridge's original intersection layering.
  const roadPairs = Array.from(
    { length: Math.max(layout.streets.vertical.length, layout.streets.horizontal.length) },
    (_, index) => roads.filter((road) => road.index === index),
  );
  for (const pair of roadPairs) {
    for (const { p, vertical, length } of pair)
      along(vertical, ink.wall, p - ROAD / 2 - 14, 0, ROAD + 28, length);
    for (const { p, vertical, length } of pair)
      along(vertical, ink.road, p - ROAD / 2, 0, ROAD, length);
  }
  for (const pair of roadPairs) {
    for (const side of [-1, 1]) {
      for (const { p, vertical, length } of pair)
        along(vertical, ink.paving, p + side * (ROAD / 2 + 7) - 6, 0, 12, length);
      for (const { p, vertical, length } of pair)
        along(vertical, ink['paving-light'], p + side * (ROAD / 2 + 7) - 6, 0, 1, length);
      const length = Math.max(...pair.map((road) => road.length));
      for (let q = 0; q < length; q += 12) {
        for (const road of pair)
          if (q < road.length)
            along(road.vertical, ink['paving-dark'], road.p + side * (ROAD / 2 + 7) - 6, q, 12, 1);
        if (q % 96 === 0) {
          for (const road of pair)
            if (q < road.length)
              along(road.vertical, ink.deep, road.p + side * (ROAD / 2 + 7) - 3, q + 3, 6, 7);
          for (let slat = 0; slat < 3; slat++)
            for (const road of pair)
              if (q < road.length)
                along(
                  road.vertical,
                  ink['metal-light'],
                  road.p + side * (ROAD / 2 + 7) - 2 + slat * 2,
                  q + 4,
                  1,
                  5,
                );
        }
      }
    }
  }
  for (let i = 0; i < 18000; i++) {
    const x = between(0, width),
      y = between(0, height);
    if (
      layout.streets.vertical.some((p) => Math.abs(x - p) < ROAD / 2) ||
      layout.streets.horizontal.some((p) => Math.abs(y - p) < ROAD / 2)
    )
      rect(c, withAlpha(rng() > 0.5 ? ink.highlight : ink.deep, 0.06), x, y, 2, 1);
  }
  for (const pair of roadPairs) {
    const length = Math.max(...pair.map((road) => road.length));
    for (let q = 0; q < length; q += 22) {
      for (const road of pair) {
        if (
          q < road.length &&
          road.crossings.every((crossing) => Math.abs(q - crossing) > ROAD / 2 + 21)
        )
          along(road.vertical, ink.edge, road.p - 1, q, 2, 10);
      }
      for (const road of pair)
        if (q < road.length) {
          along(road.vertical, ink.dark, road.p - ROAD / 2 - 12, q, 2, 1);
          along(road.vertical, ink.dark, road.p + ROAD / 2 + 10, q, 2, 1);
        }
    }
  }
  for (const x of layout.streets.vertical)
    for (const y of layout.streets.horizontal) {
      for (let z = -36; z < 40; z += 10) {
        rect(c, ink.light, x + z, y - ROAD / 2 - 18, 6, 15);
        rect(c, ink.light, x + z, y + ROAD / 2 + 3, 6, 15);
        rect(c, ink.light, x - ROAD / 2 - 18, y + z, 15, 6);
        rect(c, ink.light, x + ROAD / 2 + 3, y + z, 15, 6);
      }
      rect(c, ink.wall, x + 32, y + 33, 8, 8);
      rect(c, ink.deep, x + 34, y + 35, 4, 4);
    }
  for (const { x, y, park, parking } of layout.blocks) {
    if (park) {
      const regions = layout.surfaces.filter(
        (region) => region.x >= x && region.y >= y && region.x < x + 260 && region.y < y + 260,
      );
      for (const region of regions.filter((region) => region.material === 'grass'))
        rect(c, ink.grass, region.x, region.y, region.w, region.h);
      for (let tuft = 0; tuft < 1600; tuft++) {
        const tx = x + between(1, 258),
          ty = y + between(1, 258);
        rect(c, rng() > 0.5 ? ink['leaf-dark'] : ink['leaf-mid'], tx, ty, 1, 2);
      }
      for (const region of regions.filter((region) => region.material === 'concrete'))
        rect(
          c,
          region.role === 'plaza' ? ink.wall : ink.edge,
          region.x,
          region.y,
          region.w,
          region.h,
        );
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
  for (const { key: labelKey, position } of layout.streets.labels)
    c.fillText(t(labelKey), position.x, position.y);
  texture.refresh();
  return key;
}
