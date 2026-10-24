import type Phaser from 'phaser';
import type { WorldLayout } from '../../../shared/contracts.ts';
/** Collision uses ground footprints, never projected roofs or facade bounds. */
export function createWorldColliders(scene: Phaser.Scene, layout: WorldLayout) {
  const blockers = scene.physics.add.staticGroup();
  for (const b of layout.buildings) {
    const body = scene.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h).setVisible(false);
    blockers.add(body);
  }
  return blockers;
}
