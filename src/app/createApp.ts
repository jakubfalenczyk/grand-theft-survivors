import { createGame } from '../game/createGame.ts';
import { GameSession } from '../shared/GameSession.ts';
import { createEventBus } from '../shared/EventBus.ts';
import { createInterface } from '../ui/createInterface.ts';
import { installDebugBridge } from './debug.ts';

export function createApp(root: HTMLElement) {
  const session = new GameSession(),
    bus = createEventBus();
  const services = { session, bus };
  const ui = createInterface(root, services);
  const game = createGame(ui.host, services);
  const observer = new ResizeObserver(() =>
    game.scale.resize(ui.host.clientWidth, ui.host.clientHeight),
  );
  observer.observe(ui.host);
  const removeDebug = import.meta.env.DEV ? installDebugBridge(game, session) : () => {};
  return {
    destroy() {
      observer.disconnect();
      removeDebug();
      game.destroy(true);
      ui.destroy();
      session.destroy();
      bus.destroy();
    },
  };
}
