import { t } from '../../../shared/intl/index.ts';
import type { WorldLayout, PlayerSnapshot } from '../../../shared/contracts.ts';
import { clamp } from '../../../shared/math.ts';
import { colors, tokens } from '../../../theme/theme.ts';

/** Canvas UI projection of layout data; independent of Phaser and world textures. */
export function drawMap(
  canvas: HTMLCanvasElement,
  layout: WorldLayout,
  player: PlayerSnapshot,
  full = false,
) {
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas 2D context unavailable');
  const w = canvas.width,
    h = canvas.height;
  c.imageSmoothingEnabled = false;
  c.fillStyle = colors['asphalt-2'];
  c.fillRect(0, 0, w, h);
  const rangeX = full ? layout.bounds.width : Math.min(910, layout.bounds.width);
  const rangeY = full ? layout.bounds.height : Math.min(910, layout.bounds.height);
  const ox = full ? 0 : clamp(player.x - rangeX / 2, 0, layout.bounds.width - rangeX);
  const oy = full ? 0 : clamp(player.y - rangeY / 2, 0, layout.bounds.height - rangeY);
  const scale = Math.min(w / rangeX, h / rangeY);
  const offsetX = (w - rangeX * scale) / 2,
    offsetY = (h - rangeY * scale) / 2;
  c.save();
  c.translate(offsetX, offsetY);
  const sx = scale,
    sy = scale;
  c.strokeStyle = colors['asphalt-3'];
  c.lineWidth = 2;
  for (let p = 0; p <= w; p += 38) {
    c.beginPath();
    c.moveTo(p, 0);
    c.lineTo(p, h);
    c.stroke();
  }
  for (let p = 0; p <= h; p += 38) {
    c.beginPath();
    c.moveTo(0, p);
    c.lineTo(w, p);
    c.stroke();
  }
  c.strokeStyle = colors.concrete;
  c.lineWidth = full ? 12 : 9;
  for (const p of layout.streets.vertical) {
    c.beginPath();
    c.moveTo((p - ox) * sx, -oy * sy);
    c.lineTo((p - ox) * sx, (layout.bounds.height - oy) * sy);
    c.stroke();
  }
  for (const p of layout.streets.horizontal) {
    c.beginPath();
    c.moveTo(-ox * sx, (p - oy) * sy);
    c.lineTo((layout.bounds.width - ox) * sx, (p - oy) * sy);
    c.stroke();
  }
  for (const b of layout.buildings) {
    c.fillStyle = colors['asphalt-3'];
    c.fillRect((b.x - ox) * sx, (b.y - oy) * sy, b.w * sx, b.h * sy);
  }
  if (full) {
    c.fillStyle = colors.concrete;
    c.font = `600 ${tokens['type-scale-px']['mono-label']}px ${tokens.font.mono}`;
    c.textAlign = 'center';
    for (const district of layout.districts)
      c.fillText(
        t(`district.${district.id}`).toUpperCase(),
        district.label.x * sx,
        district.label.y * sy,
      );
  }
  const px = (player.x - ox) * sx,
    py = (player.y - oy) * sy;
  c.fillStyle = colors.acid;
  c.fillRect(px - 6, py - 6, 12, 12);
  c.strokeStyle = colors.acid;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(px + Math.cos(player.heading) * 8, py + Math.sin(player.heading) * 8);
  c.lineTo(px + Math.cos(player.heading) * 16, py + Math.sin(player.heading) * 16);
  c.stroke();
  c.restore();
}
