import type Phaser from 'phaser';
import type { GameSession } from '../shared/GameSession.ts';
import type { DebugBridge } from '../shared/contracts.ts';
import type { CityScene } from '../game/scenes/CityScene.ts';
import { GAME } from '../game/config.ts';

/** Development only, read-only. Never attach engine objects to browser globals. */
export function installDebugBridge(game: Phaser.Game, session: GameSession) {
  const scene = () => game.scene.getScene(GAME.scene) as CityScene | null;
  const ready = () => {
    const current = scene();
    return Boolean(current?.sys.isActive() && current.playerController?.sprite.scene);
  };
  const bridge: DebugBridge = {
    isReady: ready,
    getCombat: () => scene()!.combat.getSnapshot(),
    getAudio: () => scene()!.audioDirector.getSnapshot(),
    getState: () => {
      const state = session.state;
      return {
        ...scene()!.getSnapshot(),
        paused: ['paused', 'help', 'audio'].includes(state.mode),
        map: state.mode === 'map',
        zoom: state.zoom,
      };
    },
    getBuildings: () => scene()!.layout.buildings.map(({ x, y, w, h }) => ({ x, y, w, h })),
    getBuildingViews: () => scene()!.worldRenderer.getViews(),
  };
  Object.defineProperty(window, '__gameDebug', {
    value: Object.freeze(bridge),
    configurable: true,
  });
  return () => {
    if (window.__gameDebug === bridge) Reflect.deleteProperty(window, '__gameDebug');
  };
}
