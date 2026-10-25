export const AUDIO_BUSES = ['master', 'music', 'sfx', 'player', 'enemy', 'world', 'ui'] as const;
export type AudioBus = (typeof AUDIO_BUSES)[number];
export type SoundBus = Exclude<AudioBus, 'master' | 'sfx'>;
export type SurfaceId = 'concrete' | 'grass';
export type AudioCue =
  { id: 'player:footstep'; surface: SurfaceId } | { id: 'ui:confirm' | 'ui:back' | 'ui:change' };
export interface AudioPreferences {
  readonly version: 1;
  readonly muted: boolean;
  readonly volumes: Readonly<Record<AudioBus, number>>;
}
export type AudioStatus = 'ready' | 'partial' | 'unavailable';
