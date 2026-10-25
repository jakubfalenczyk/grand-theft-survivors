import { attachAudioControls } from './components/AudioControls.ts';
import { locale, t, translateMarkup } from '../shared/intl/index.ts';
import type { AppServices } from '../shared/services.ts';
import shell from './shell.html?raw';
import { EVENTS } from '../shared/events.ts';
import { element } from './dom.ts';
import { DialogController } from './components/DialogController.ts';
import { attachHud } from './components/Hud.ts';
import { attachMapView } from './components/MapView.ts';

export function createInterface(root: HTMLElement, services: AppServices) {
  const { session, bus } = services;
  document.documentElement.lang = locale;
  document.title = t('page.title');
  root.innerHTML = translateMarkup(shell);
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => element<T>(root, `#${id}`);
  const events = new AbortController();
  const onClick = (id: string, handler: () => void) =>
    $(id).addEventListener(
      'click',
      () => {
        handler();
        if (id !== 'audio-test')
          bus.emit('audio:cue', {
            id: ['resume-button', 'close-map', 'audio-close'].includes(id)
              ? 'ui:back'
              : 'ui:confirm',
          });
      },
      { signal: events.signal },
    );
  const dialogs = new DialogController(root);
  onClick('play-button', () => bus.emit('command:play', undefined));
  onClick('audio-button', () => session.openAudio());
  onClick('pause-audio-button', () => session.openAudio());
  onClick('audio-close', () => session.closeAudio());
  onClick('audio-test', () => bus.emit('audio:cue', { id: 'ui:confirm' }));
  onClick('help-button', () => session.setMode('help'));
  onClick('resume-button', () => session.setMode('playing'));
  onClick('pause-button', () => session.togglePause());
  onClick('open-map', () => session.toggleMap());
  onClick('open-map-compact', () => session.toggleMap());
  onClick('close-map', () => session.setMode('playing'));
  onClick('zoom-in', () => session.zoomBy(0.5));
  onClick('zoom-out', () => session.zoomBy(-0.5));
  onClick('reset-button', () => bus.emit(EVENTS.RESET_PLAYER, undefined));
  onClick('fullscreen-button', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await element(root, '.game-frame').requestFullscreen();
    } catch {
      $('game-status').textContent = t('fullscreen.unavailable');
    }
  });
  // Native events avoid Phaser replaying unregistered menu keys from its queue.
  window.addEventListener(
    'keydown',
    (event) => {
      if (session.state.mode === 'start' || session.state.mode === 'loading') return;
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      if (
        event.code !== 'Escape' &&
        event.target instanceof Element &&
        event.target.closest('input,textarea,select,[contenteditable="true"]')
      )
        return;
      if (event.code === 'Escape') {
        event.preventDefault();
        session.togglePause();
        bus.emit('audio:cue', { id: 'ui:back' });
      }
      if (event.code === 'KeyM') {
        event.preventDefault();
        session.toggleMap();
        bus.emit('audio:cue', { id: session.state.mode === 'map' ? 'ui:confirm' : 'ui:back' });
      }
      if (event.code === 'KeyH') {
        event.preventDefault();
        session.setMode('help');
        bus.emit('audio:cue', { id: 'ui:confirm' });
      }
    },
    { signal: events.signal },
  );
  const stopSession = session.subscribe(({ mode, zoom }) => {
    dialogs.setMode(mode);
    $('pause-button').textContent = mode === 'playing' ? t('pause.button') : t('resume.short');
    $('pause-button').setAttribute(
      'aria-label',
      mode === 'playing' ? t('pause.label') : t('resume.label'),
    );
    $('zoom-label').textContent = t('camera.factor', { zoom });
    $<HTMLButtonElement>('zoom-out').disabled = zoom <= 1;
    $<HTMLButtonElement>('zoom-in').disabled = zoom >= 3;
  });
  const cleanups = [
    attachAudioControls(root, services),
    stopSession,
    attachHud(root, bus, session),
    attachMapView(root, bus, session),
  ];
  return {
    host: $('game'),
    setStorageUnavailable() {
      $('audio-storage-status').textContent = t('audio.storageUnavailable');
    },
    destroy() {
      events.abort();
      cleanups.forEach((cleanup) => cleanup());
      dialogs.destroy();
      root.replaceChildren();
    },
  };
}
