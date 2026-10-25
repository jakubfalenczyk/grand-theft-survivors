import type { SessionMode } from '../../shared/contracts.ts';
import { t } from '../../shared/intl/index.ts';
import { element } from '../dom.ts';

/** Owns dialog transitions, background blocking and focus for one game interface. */
export class DialogController {
  #root: HTMLElement;
  #pause: HTMLElement;
  #map: HTMLElement;
  #audio: HTMLElement;
  #background: HTMLElement[];
  #active: HTMLElement | null = null;
  #previousFocus: HTMLElement | null = null;
  #events = new AbortController();

  constructor(root: HTMLElement) {
    this.#root = root;
    this.#pause = element(root, '#overlay');
    this.#map = element(root, '#map-overlay');
    this.#audio = element(root, '#audio-overlay');
    for (const dialog of [this.#pause, this.#map, this.#audio]) dialog.tabIndex = -1;
    this.#background = [
      ...root.querySelectorAll<HTMLElement>(
        '.topbar, main > :not(.game-frame), .game-frame > :not([role="dialog"])',
      ),
    ];
    root.addEventListener('keydown', (event) => this.#trapFocus(event), {
      signal: this.#events.signal,
    });
  }

  setMode(mode: SessionMode) {
    const starting = mode === 'start' || mode === 'loading';
    element(this.#root, '#start-content').hidden = !starting;
    element(this.#root, '#play-button').hidden = mode !== 'start';
    element(this.#root, '#start-loading').hidden = mode !== 'loading';
    element(this.#root, '#resume-button').hidden = starting;
    element(this.#root, '#pause-audio-button').hidden = mode !== 'paused';
    element(this.#root, '#help-content').hidden = mode !== 'help';
    element(this.#root, '#dialog-title').textContent = starting
      ? t('start.title')
      : mode === 'help'
        ? t('help.title')
        : t('pause.title');
    element(this.#root, '#dialog-description').textContent = starting
      ? t('start.description')
      : mode === 'help'
        ? t('help.description')
        : t('pause.description');

    const next =
      mode === 'playing'
        ? null
        : mode === 'map'
          ? this.#map
          : mode === 'audio'
            ? this.#audio
            : this.#pause;
    if (next === this.#active) {
      if (
        next &&
        document.activeElement instanceof HTMLElement &&
        document.activeElement.closest('[hidden]')
      )
        (this.#focusTargets(next)[0] ?? next).focus({ preventScroll: true });
      return;
    }
    if (!this.#active && next) {
      this.#previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    this.#pause.hidden = next !== this.#pause;
    this.#map.hidden = next !== this.#map;
    this.#audio.hidden = next !== this.#audio;
    this.#background.forEach((node) => (node.inert = next !== null));
    this.#active = next;

    if (next) {
      (this.#focusTargets(next)[0] ?? next).focus({ preventScroll: true });
    } else {
      const previous = this.#previousFocus;
      this.#previousFocus = null;
      const target =
        previous?.isConnected &&
        previous !== document.body &&
        previous.getClientRects().length > 0 &&
        !previous.matches(':disabled') &&
        !previous.closest('[hidden], [inert]')
          ? previous
          : this.#focusTargets(this.#root)[0];
      target?.focus({ preventScroll: true });
    }
  }

  destroy() {
    this.setMode('playing');
    this.#events.abort();
  }

  #focusTargets(root: HTMLElement) {
    return [
      ...root.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex="0"]',
      ),
    ].filter((node) => node.getClientRects().length > 0 && !node.closest('[hidden], [inert]'));
  }

  #trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !this.#active) return;
    const targets = this.#focusTargets(this.#active);
    if (!targets.length) return;
    const first = targets[0],
      last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
