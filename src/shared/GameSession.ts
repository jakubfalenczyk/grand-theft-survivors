import type { SessionState, SessionMode } from './contracts.ts';
import { clamp } from './math.ts';

/** Exclusive UI modes prevent overlapping pause/help/map state. No engine or DOM. */
export class GameSession {
  #state: SessionState = Object.freeze({ mode: 'playing', zoom: 2 });
  #audioReturn: 'playing' | 'paused' = 'playing';
  #listeners = new Set<(state: SessionState) => void>();

  constructor(mode: SessionMode = 'playing') {
    this.#state = Object.freeze({ mode, zoom: 2 });
  }
  get state() {
    return this.#state;
  }
  get blocked() {
    return this.#state.mode !== 'playing';
  }

  subscribe(listener: (state: SessionState) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }

  setMode(mode: SessionMode) {
    if (!['start', 'loading', 'playing', 'paused', 'help', 'map', 'audio'].includes(mode))
      throw new Error(`Unknown mode: ${mode}`);
    this.#update({ mode });
  }

  openAudio() {
    if (this.state.mode === 'start' || this.state.mode === 'loading') return;
    this.#audioReturn = this.blocked ? 'paused' : 'playing';
    this.setMode('audio');
  }
  closeAudio() {
    this.setMode(this.#audioReturn);
  }
  toggleMap() {
    if (this.state.mode === 'start' || this.state.mode === 'loading') return;
    this.setMode(this.state.mode === 'map' ? 'playing' : 'map');
  }
  togglePause() {
    if (this.state.mode === 'audio') {
      this.closeAudio();
      return;
    }
    if (this.state.mode === 'start' || this.state.mode === 'loading') return;
    this.setMode(this.blocked ? 'playing' : 'paused');
  }
  zoomBy(delta: number) {
    this.#update({ zoom: clamp(this.state.zoom + delta, 1, 3) });
  }

  #update(patch: Partial<SessionState>) {
    if (
      Object.entries(patch).every(
        ([key, value]) => this.#state[key as keyof SessionState] === value,
      )
    )
      return;
    this.#state = Object.freeze({ ...this.#state, ...patch });
    for (const listener of this.#listeners) listener(this.#state);
  }

  destroy() {
    this.#listeners.clear();
  }
}
