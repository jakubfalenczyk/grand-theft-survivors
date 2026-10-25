import type { MapId } from '../../../../shared/contracts.ts';
import type { MapDefinition } from './types.ts';
import { westbridge } from './westbridge/index.ts';
import { validateMapDefinition } from '../validateMap.ts';

export class MapCatalog {
  readonly #definitions = new Map<MapId, MapDefinition>();
  readonly initialId: MapId;
  constructor(definitions: readonly MapDefinition[] = [westbridge]) {
    if (!definitions.length) throw new Error('Map catalog is empty');
    this.initialId = definitions[0].id;
    for (const definition of definitions) {
      validateMapDefinition(definition);
      if (this.#definitions.has(definition.id))
        throw new Error(`Duplicate map ID: ${definition.id}`);
      this.#definitions.set(definition.id, definition);
    }
  }
  get(id: MapId): MapDefinition {
    const definition = this.#definitions.get(id);
    if (!definition) throw new Error(`Unknown map ID: ${id}`);
    return definition;
  }
}
