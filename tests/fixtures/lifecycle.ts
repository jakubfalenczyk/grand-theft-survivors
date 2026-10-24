import Phaser from 'phaser';
import '../../src/theme/index.css';
import '../../src/ui/styles/layout.css';
import '../../src/ui/styles/game.css';
import { createGame } from '../../src/game/createGame.ts';
import { createInterface } from '../../src/ui/createInterface.ts';
import { element } from '../../src/ui/dom.ts';
import { GameSession } from '../../src/shared/GameSession.ts';
import { createEventBus } from '../../src/shared/EventBus.ts';
import { EVENTS } from '../../src/shared/events.ts';
import { GAME } from '../../src/game/config.ts';
import { installDebugBridge } from '../../src/app/debug.ts';

const session = new GameSession(),
  bus = createEventBus();
const services = { session, bus };
const ui = createInterface(element(document, '#app'), services);
const game = createGame(ui.host, services);
const removeDebug = installDebugBridge(game, session);
let restarts = 0;
bus.on(EVENTS.WORLD_READY, () => {
  // Game installs its own blur handler after the first Scene.create returns.
  requestAnimationFrame(() => {
    element(document, '#restarts').textContent = String(++restarts);
    element(document, '#textures').textContent = String(game.textures.getTextureKeys().length);
    element(document, '#listeners').textContent = String(
      game.events.listenerCount(Phaser.Core.Events.BLUR),
    );
  });
});
element(document, '#restart-scene').addEventListener('click', () =>
  game.scene.getScene(GAME.scene).scene.restart(),
);

element(document, '#destroy-interface').addEventListener('click', () => {
  removeDebug();
  game.destroy(true);
  ui.destroy();
  session.destroy();
  bus.destroy();
});
