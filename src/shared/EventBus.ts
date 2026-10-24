import type { AppEvents } from './contracts.ts';

export interface EventBus {
  on<K extends keyof AppEvents>(name: K, handler: (payload: AppEvents[K]) => void): () => void;
  emit<K extends keyof AppEvents>(name: K, payload: AppEvents[K]): void;
  destroy(): void;
}

/** App-scoped transport. Each subscription owns exactly one cleanup function. */
export function createEventBus(): EventBus {
  const listeners = new Map<keyof AppEvents, Set<(payload: unknown) => void>>();
  return {
    on<K extends keyof AppEvents>(name: K, handler: (payload: AppEvents[K]) => void) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      // Type erasure is isolated here; on/emit share the same event-key contract.
      const wrapped = (payload: unknown) => handler(payload as AppEvents[K]);
      listeners.get(name)!.add(wrapped);
      return () => {
        listeners.get(name)?.delete(wrapped);
      };
    },
    emit(name, payload) {
      for (const handler of listeners.get(name) ?? []) handler(payload);
    },
    destroy() {
      listeners.clear();
    },
  };
}
