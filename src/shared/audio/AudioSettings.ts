import { AUDIO_BUSES } from './types.ts';
import type { AudioBus, AudioPreferences, SoundBus } from './types.ts';
import { clamp } from '../math.ts';

const defaults: AudioPreferences = {
  version: 1,
  muted: false,
  volumes: { master: 0.8, music: 0.6, sfx: 0.8, player: 0.7, enemy: 0.8, world: 0.7, ui: 0.6 },
};
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function parseAudioPreferences(value: unknown): AudioPreferences {
  const volumes = { ...defaults.volumes };
  if (record(value) && value.version === 1) {
    const stored = value.volumes;
    if (record(stored)) {
      for (const bus of AUDIO_BUSES) {
        const level = stored[bus];
        if (typeof level === 'number' && Number.isFinite(level)) volumes[bus] = clamp(level, 0, 1);
      }
    }
    return Object.freeze({
      version: 1,
      muted: value.muted === true,
      volumes: Object.freeze(volumes),
    });
  }
  return Object.freeze({ ...defaults, volumes: Object.freeze(volumes) });
}
export function busVolume(preferences: AudioPreferences, bus: SoundBus) {
  if (preferences.muted) return 0;
  return (
    preferences.volumes.master *
    preferences.volumes[bus] *
    (bus === 'music' ? 1 : preferences.volumes.sfx)
  );
}
/** App-scoped preferences. Storage and sound engines are adapters owned by their layers. */
export class AudioSettings {
  #state: AudioPreferences;
  #listeners = new Set<(state: AudioPreferences) => void>();
  constructor(value?: unknown) {
    this.#state = parseAudioPreferences(value);
  }
  get state() {
    return this.#state;
  }
  setVolume(bus: AudioBus, volume: number) {
    if (!Number.isFinite(volume)) return;
    const level = clamp(volume, 0, 1);
    if (this.#state.volumes[bus] === level) return;
    this.#set({ ...this.#state, volumes: { ...this.#state.volumes, [bus]: level } });
  }
  setMuted(muted: boolean) {
    if (this.#state.muted !== muted) this.#set({ ...this.#state, muted });
  }
  subscribe(listener: (state: AudioPreferences) => void) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }
  #set(state: AudioPreferences) {
    this.#state = parseAudioPreferences(state);
    for (const listener of this.#listeners) listener(this.#state);
  }
  destroy() {
    this.#listeners.clear();
  }
}
