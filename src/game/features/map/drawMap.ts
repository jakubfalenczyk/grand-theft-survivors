import { t } from '../../../shared/intl/index.ts';
import type { WorldLayout, PlayerSnapshot } from '../../../shared/contracts.ts';
import { clamp } from '../../../shared/math.ts';
import { colors, tokens } from '../../../theme/theme.ts';
import { BLOCK } from '../world/config.ts';

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
  const range = full ? layout.size : 910;
  const ox = full ? 0 : clamp(player.x - range / 2, 0, layout.size - range);
  const oy = full ? 0 : clamp(player.y - range / 2, 0, layout.size - range);
  const sx = w / range,
    sy = h / range;
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
  for (let p = 0; p <= layout.size; p += BLOCK) {
    c.beginPath();
    c.moveTo((p - ox) * sx, 0);
    c.lineTo((p - ox) * sx, h);
    c.stroke();
    c.beginPath();
    c.moveTo(0, (p - oy) * sy);
    c.lineTo(w, (p - oy) * sy);
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
    c.fillText(t('district.old-town').toUpperCase(), w * 0.5, h * 0.16);
    c.fillText(t('district.ironworks').toUpperCase(), w * 0.28, h * 0.58);
    c.fillText(t('district.greenfield').toUpperCase(), w * 0.79, h * 0.7);
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
}
