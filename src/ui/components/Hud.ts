import { t } from '../../shared/intl/index.ts';
import type { EventBus } from '../../shared/EventBus.ts';
import type { GameSession } from '../../shared/GameSession.ts';
import { element } from '../dom.ts';
import { EVENTS } from '../../shared/events.ts';

export function attachHud(root: HTMLElement, bus: EventBus, session: GameSession) {
  const district = element(root, '#district-name');
  const coordinates = element(root, '#coordinates');
  const status = element(root, '#game-status');
  let player = { moving: 0, running: false };
  const render = () => {
    status.textContent = session.blocked
      ? t('status.paused')
      : player.running
        ? t('status.running')
        : player.moving
          ? t('status.moving')
          : t('status.idle');
  };
  const unsubscribe = bus.on(EVENTS.SNAPSHOT, (snapshot) => {
    player = snapshot;
    district.textContent = t(`district.${snapshot.district}`);
    coordinates.textContent = t('hud.coordinates', {
      x: Math.round(snapshot.x).toString().padStart(4, '0'),
      y: Math.round(snapshot.y).toString().padStart(4, '0'),
    });
    render();
  });
  const stopSession = session.subscribe(render);
  return () => {
    unsubscribe();
    stopSession();
  };
}
