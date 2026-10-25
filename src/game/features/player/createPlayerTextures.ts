import type Phaser from 'phaser';
import { tokens, worldInk as ink } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';

export const PLAYER_FRAME_SIZE = tokens.world['pixel-art']['min-frame-px'];
export const PLAYER_DISPLAY_SIZE = 24;

export function createPlayerTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('player')) return;
  const size = PLAYER_FRAME_SIZE;
  const texture = createCanvasTexture(scene, 'player', size * 3, size),
    c = texture.context;
  for (let frame = 0; frame < 3; frame++) {
    const step = frame === 1 ? 9 : frame === 2 ? -9 : 0;
    c.save();
    c.translate(frame * size, 0);
    rect(c, ink.deep, 34 + step, 34, 37, 20);
    rect(c, ink.deep, 34 - step, 75, 37, 20);
    rect(c, ink.denim, 36 + step, 36, 25, 16);
    rect(c, ink.denim, 36 - step, 77, 25, 16);
    rect(c, ink['metal-dark'], 36 + step, 36, 1, 16);
    rect(c, ink['metal-dark'], 36 - step, 77, 1, 16);
    rect(c, ink.deep, 48, 26, 37, 76);
    rect(c, ink['jacket-dark'], 49, 27, 35, 74);
    rect(c, ink.jacket, 55, 29, 25, 70);
    rect(c, ink['metal-light'], 68, 30, 1, 68);
    for (const y of [29, 80]) {
      rect(c, ink.deep, 66, y, 29, 19);
      rect(c, ink.jacket, 67, y + 1, 27, 17);
      rect(c, ink.skin, 87, y + 4, 12, 11);
      rect(c, ink['jacket-dark'], 70, y + 15, 17, 1);
      rect(c, ink['metal-light'], 78, y + 3, 1, 10);
    }
    rect(c, ink.deep, 75, 44, 32, 41);
    rect(c, ink.skin, 79, 47, 29, 34);
    rect(c, ink.bark, 75, 44, 22, 41);
    rect(c, ink.deep, 76, 45, 19, 3);
    rect(c, ink['car-clay'], 98, 66, 8, 10);
    rect(c, ink['metal-light'], 103, 52, 3, 6);
    rect(c, ink.deep, 104, 61, 3, 3);
    c.restore();
  }
  texture.refresh();
  scene.textures.addSpriteSheet('', texture, { frameWidth: size, frameHeight: size });
}
