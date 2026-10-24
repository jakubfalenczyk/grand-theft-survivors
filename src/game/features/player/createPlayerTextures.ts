import type Phaser from 'phaser';
import { worldInk as ink } from '../../../theme/theme.ts';
import { rect, createCanvasTexture } from '../../rendering/canvas.ts';

export function createPlayerTextures(scene: Phaser.Scene) {
  if (scene.textures.exists('player')) return;
  const texture = createCanvasTexture(scene, 'player', 72, 24),
    c = texture.context;
  for (let frame = 0; frame < 3; frame++) {
    const o = frame * 24,
      step = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    rect(c, ink.deep, o + 7 + step, 6, 6, 4);
    rect(c, ink.deep, o + 7 - step, 14, 6, 4);
    rect(c, ink.wall, o + 8, 5, 8, 14);
    rect(c, ink.light, o + 10, 5, 5, 14);
    rect(c, ink.highlight, o + 12, 4, 4, 5);
    rect(c, ink.highlight, o + 12, 15, 4, 5);
    rect(c, ink.light, o + 16, 6, 3, 3);
    rect(c, ink.light, o + 16, 15, 3, 3);
    rect(c, ink.deep, o + 13, 8, 6, 9);
    rect(c, ink.highlight, o + 17, 9, 4, 6);
    rect(c, ink.wall, o + 16, 8, 4, 2);
    rect(c, ink.highlight, o + 19, 10, 2, 3);
  }
  texture.refresh();
  scene.textures.addSpriteSheet('', texture, {
    frameWidth: 24,
    frameHeight: 24,
  });
}
