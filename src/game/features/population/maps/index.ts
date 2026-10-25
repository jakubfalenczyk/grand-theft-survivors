import type { MapId } from '../../../../shared/contracts.ts';
import type { PopulationMap } from '../PopulationDirector.ts';
import { westbridgePopulation } from './westbridge.ts';

/** New map content supplies its own routes; geometry fixtures have no authored population. */
export function populationForMap(id: MapId): PopulationMap {
  return id === 'westbridge'
    ? westbridgePopulation()
    : {
        graph: { nodes: [], edges: [] },
        gangZone: { x: 0, y: 0, w: 0, h: 0 },
      };
}
