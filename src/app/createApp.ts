import type { MapId } from '../shared/contracts.ts';
import { createGame } from '../game/createGame.ts';
import { GameSession } from '../shared/GameSession.ts';
import { createEventBus } from '../shared/EventBus.ts';
import { createInterface } from '../ui/createInterface.ts';
import { installDebugBridge } from './debug.ts';
import { persistAudioSettings, restoreAudioSettings } from './audioStorage.ts';

export function createApp(root: HTMLElement) {
  const session = new GameSession('start'),
    bus = createEventBus();
  const audio = restoreAudioSettings();
  const services = { session, bus, audio };
  const ui = createInterface(root, services);
  const stopStorage = persistAudioSettings(audio, () => ui.setStorageUnavailable());
  let game: ReturnType<typeof createGame> | undefined;
  let context: AudioContext | undefined;
  let removeDebug = () => {};
  const observer = new ResizeObserver(() =>
    game?.scale.resize(ui.host.clientWidth, ui.host.clientHeight),
  );
  observer.observe(ui.host);
  let currentMap: MapId | undefined;
  const stopRestart = bus.on('command:restart-run', () => {
    if (currentMap && (session.state.mode === 'paused' || session.state.mode === 'dead'))
      bus.emit('command:load-map', currentMap);
  });
  const stopReady = bus.on('game:world-ready', (layout) => {
    currentMap = layout.mapId;
    if (session.state.mode === 'loading') session.setMode('playing');
  });
  const stopPlay = bus.on('command:play', () => {
    if (session.state.mode !== 'start' || game) return;
    session.setMode('loading');
    let audioContext: AudioContext | false | undefined;
    try {
      if (typeof AudioContext !== 'undefined') {
        context = new AudioContext();
        audioContext = context;
        void context.resume().catch(() => bus.emit('audio:status', 'unavailable'));
      }
    } catch {
      audioContext = false;
    }
    game = createGame(ui.host, services, audioContext);
    if (import.meta.env.DEV) removeDebug = installDebugBridge(game, session);
  });
  return {
    destroy() {
      stopPlay();
      stopReady();
      stopRestart();
      stopStorage();
      observer.disconnect();
      removeDebug();
      game?.destroy(true);
      if (context && context.state !== 'closed') void context.close().catch(() => {});
      ui.destroy();
      audio.destroy();
      session.destroy();
      bus.destroy();
    },
  };
}
