import { AudioSettings } from '../shared/audio/AudioSettings.ts';
export const AUDIO_STORAGE_KEY = 'gts.audio.v1';

export function restoreAudioSettings() {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    return new AudioSettings(raw ? JSON.parse(raw) : undefined);
  } catch {
    return new AudioSettings();
  }
}
export function persistAudioSettings(settings: AudioSettings, onUnavailable: () => void) {
  return settings.subscribe((state) => {
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      onUnavailable();
    }
  });
}
