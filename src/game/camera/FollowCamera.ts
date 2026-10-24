import type Phaser from 'phaser';
import type { GameSession } from '../../shared/GameSession.ts';
/** Camera policy lives separately from scene composition and from player motion. */
export function attachFollowCamera(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Sprite,
  session: GameSession,
  worldSize: number,
) {
  const camera = scene.cameras.main;
  camera.setBounds(0, 0, worldSize, worldSize).startFollow(player, true, 0.11, 0.11);
  camera.centerOn(player.x, player.y);
  const unsubscribe = session.subscribe(({ zoom }) => camera.setZoom(zoom));
  const onWheel = (
    _pointer: Phaser.Input.Pointer,
    _objects: Phaser.GameObjects.GameObject[],
    _dx: number,
    dy: number,
  ) => session.zoomBy(dy > 0 ? -0.5 : 0.5);
  scene.input.on('wheel', onWheel);
  return {
    camera,
    destroy() {
      unsubscribe();
      scene.input.off('wheel', onWheel);
    },
  };
}
