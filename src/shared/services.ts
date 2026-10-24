import type { GameSession } from './GameSession.ts';
import type { EventBus } from './EventBus.ts';
export interface AppServices {
  session: GameSession;
  bus: EventBus;
}
