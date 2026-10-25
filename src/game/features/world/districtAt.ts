import type { DistrictId, Footprint } from '../../../shared/contracts.ts';

export function districtAt(
  districts: readonly { readonly id: DistrictId; readonly bounds: Readonly<Footprint> }[],
  x: number,
  y: number,
) {
  const district = districts.find(
    ({ bounds: b }) => x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h,
  );
  if (!district) throw new Error(`No district at (${x}, ${y})`);
  return district;
}
