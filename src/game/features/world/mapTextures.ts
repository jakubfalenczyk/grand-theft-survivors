import type Phaser from 'phaser';
import type { WorldLayout } from '../../../shared/contracts.ts';

export const mapTexturePrefix = (layout: WorldLayout) =>
  `map:${encodeURIComponent(layout.mapId)}:${layout.seed}:`;

/** Called after scene objects shut down; shared player/tree textures and audio stay cached. */
export function releaseMapTextures(scene: Phaser.Scene, layout: WorldLayout) {
  const prefix = mapTexturePrefix(layout);
  for (const key of scene.textures.getTextureKeys()) {
    if (key.startsWith(prefix)) scene.textures.remove(key);
  }
}
