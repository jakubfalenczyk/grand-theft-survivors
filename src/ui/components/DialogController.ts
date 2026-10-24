import type { SessionMode } from '../../shared/contracts.ts';
import { t } from '../../shared/intl/index.ts';
import { element } from '../dom.ts';

/** Owns dialog transitions, background blocking and focus for one game interface. */
export class DialogController {
  #root: HTMLElement;
  #pause: HTMLElement;
  #map: HTMLElement;
  #background: HTMLElement[];
  #active: HTMLElement | null = null;
  #previousFocus: HTMLElement | null = null;
  #events = new AbortController();

  constructor(root: HTMLElement) {
    this.#root = root;
    this.#pause = element(root, '#overlay');
    this.#map = element(root, '#map-overlay');
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
    element(this.#root, '#help-content').hidden = mode !== 'help';
    element(this.#root, '#dialog-title').textContent =
      mode === 'help' ? t('help.title') : t('pause.title');
    element(this.#root, '#dialog-description').textContent =
      mode === 'help' ? t('help.description') : t('pause.description');

    const next = mode === 'playing' ? null : mode === 'map' ? this.#map : this.#pause;
    if (next === this.#active) return;
    if (!this.#active && next) {
      this.#previousFocus =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }

    this.#pause.hidden = next !== this.#pause;
    this.#map.hidden = next !== this.#map;
    this.#background.forEach((node) => (node.inert = next !== null));
    this.#active = next;

    if (next) {
      this.#focusTargets(next)[0]?.focus({ preventScroll: true });
    } else {
      const previous = this.#previousFocus;
      this.#previousFocus = null;
      const target =
        previous?.isConnected &&
        previous !== document.body &&
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
      ...root.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex="0"]'),
    ].filter((node) => !node.closest('[hidden], [inert]'));
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
