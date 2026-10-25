import type { DistrictId } from '../../../shared/contracts.ts';
import { tokens, worldInk } from '../../../theme/theme.ts';
export const DISTRICTS = Object.freeze(
  [{ id: 'old-town' as const }, { id: 'ironworks' as const }, { id: 'greenfield' as const }].map(
    (district) => {
      const material = tokens.world.districts[district.id as DistrictId];
      return Object.freeze({
        ...district,
        roof: worldInk[material.roof],
        edge: worldInk[material.edge],
        material: { light: worldInk[material.light], dark: worldInk[material.dark] },
      });
    },
  ),
);
