// Top-down perspective: a roof closer to the camera expands away from its center.
// These are world units, so changing the screen size or zoom does not change height.
export const CAMERA_HEIGHT = 500;
export function projectPoint(
  x: number,
  y: number,
  height: number,
  centerX: number,
  centerY: number,
) {
  const scale = CAMERA_HEIGHT / (CAMERA_HEIGHT - height);
  return { x: centerX + (x - centerX) * scale, y: centerY + (y - centerY) * scale, scale };
}
