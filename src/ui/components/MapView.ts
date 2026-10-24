import type { WorldLayout, PlayerSnapshot } from '../../shared/contracts.ts';
import type { EventBus } from '../../shared/EventBus.ts';
import type { GameSession } from '../../shared/GameSession.ts';
import { element } from '../dom.ts';
import { EVENTS } from '../../shared/events.ts';
import { drawMap } from '../../game/features/map/drawMap.ts';

export function attachMapView(root: HTMLElement, bus: EventBus, session: GameSession) {
  const mini = element<HTMLCanvasElement>(root, '#minimap'),
    full = element<HTMLCanvasElement>(root, '#city-map');
  let layout: WorldLayout | undefined, player: PlayerSnapshot | undefined;
  const render = () => {
    if (!layout || !player) return;
    drawMap(mini, layout, player);
    if (session.state.mode === 'map') drawMap(full, layout, player, true);
  };
  const cleanups = [
    bus.on(EVENTS.WORLD_READY, (value) => {
      layout = value;
      render();
    }),
    bus.on(EVENTS.SNAPSHOT, (value) => {
      player = value;
      render();
    }),
    session.subscribe(render),
  ];
  return () => cleanups.forEach((cleanup) => cleanup());
}
