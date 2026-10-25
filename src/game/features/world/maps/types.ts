import type { CityBlock, MapId, WorldLayout } from '../../../../shared/contracts.ts';
import type { StaticMessageKey } from '../../../../shared/intl/index.ts';

/** Authored geometry and seeded content only. No engine objects or future-system placeholders. */
export interface MapDefinition {
  readonly id: MapId;
  readonly nameKey: StaticMessageKey;
  readonly seed: number;
  readonly bounds: WorldLayout['bounds'];
  readonly spawns: WorldLayout['spawns'];
  readonly streets: WorldLayout['streets'];
  readonly districts: WorldLayout['districts'];
  readonly blocks: readonly Readonly<CityBlock>[];
}
