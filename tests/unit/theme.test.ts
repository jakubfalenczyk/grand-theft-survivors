import test from 'node:test';
import assert from 'node:assert/strict';
import { tokens, colors, phaserColors, toPhaserColor } from '../../src/theme/theme.ts';

function luminance(hex: string) {
  const c = hex
    .match(/[a-f\d]{2}/gi)!
    .map((n) => parseInt(n, 16) / 255)
    .map((n) => (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
const contrast = (a: string, b: string) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
test('UI text pairings and every faction label meet WCAG AA contrast', () => {
  for (const fill of ['concrete', 'sodium', 'riot', 'canal', 'acid'])
    assert.ok(contrast(colors.asphalt, colors[fill]) >= 4.5, fill);
  assert.ok(contrast(colors.concrete, colors.asphalt) >= 4.5);
  for (const [id, faction] of Object.entries(tokens.faction))
    assert.ok(contrast(faction.value, faction.on) >= 4.5, id);
});
test('Canvas and Phaser colors are derived from the same tokens', () => {
  assert.equal(phaserColors.acid, toPhaserColor(tokens.color.acid.value));
  assert.equal(tokens.color.muted.role, 'disabled text only');
});
