import type { SoundBus, SurfaceId } from '../../../shared/audio/types.ts';

export const soundAssets = {
  'concrete-1': 'concrete-1.wav',
  'concrete-2': 'concrete-2.wav',
  'grass-1': 'grass-1.wav',
  'grass-2': 'grass-2.wav',
  'ui-confirm': 'ui-confirm.wav',
  'ui-back': 'ui-back.wav',
  'ui-change': 'ui-change.wav',
} as const;
export type SoundId = keyof typeof soundAssets;
export interface CueDefinition {
  bus: SoundBus;
  variants: readonly { sound: SoundId; weight: number }[];
  gain: number;
  rate: readonly [number, number];
  cooldownMs: number;
  maxVoices: number;
  priority: number;
  loop: boolean;
}
const steps = (sounds: readonly SoundId[]): CueDefinition => ({
  bus: 'player',
  variants: sounds.map((sound) => ({ sound, weight: 1 })),
  gain: 0.75,
  rate: [0.96, 1.04],
  cooldownMs: 100,
  maxVoices: 2,
  priority: 1,
  loop: false,
});
const ui = (sound: SoundId): CueDefinition => ({
  bus: 'ui',
  variants: [{ sound, weight: 1 }],
  gain: 0.55,
  rate: [1, 1],
  cooldownMs: 65,
  maxVoices: 2,
  priority: 2,
  loop: false,
});
export const audioManifest = {
  footsteps: {
    concrete: steps(['concrete-1', 'concrete-2']),
    grass: steps(['grass-1', 'grass-2']),
  } satisfies Record<SurfaceId, CueDefinition>,
  'ui:confirm': ui('ui-confirm'),
  'ui:back': ui('ui-back'),
  'ui:change': ui('ui-change'),
};
export const audioLimits = { maxVoices: 8, loadTimeoutMs: 8000, audioSeed: 90210 };
export const footstepConfig = { walkStride: 32, runStride: 42, teleportDistance: 70 };
export const soundKey = (id: SoundId) => `gts-audio:${id}`;
