import type { AudioSettings } from './audio/AudioSettings.ts';
import type { GameSession } from './GameSession.ts';
import type { EventBus } from './EventBus.ts';
export interface AppServices {
  audio: AudioSettings;
  session: GameSession;
  bus: EventBus;
}
