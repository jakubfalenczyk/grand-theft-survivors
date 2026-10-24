import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { t, translateMarkup } from '../../src/shared/intl/index.ts';

test('messages interpolate runtime values as plain text', () => {
  assert.equal(t('camera.factor', { zoom: 2.5 }), '2.5×');
  assert.equal(t('hud.coordinates', { x: '0012', y: '0034' }), 'X 0012 · Y 0034');
  assert.equal(t('district.old-town'), 'Old Town');
});
test('every shell message resolves and no visible or accessible label bypasses the catalog', () => {
  const shell = readFileSync(new URL('../../src/ui/shell.html', import.meta.url), 'utf8');
  assert.doesNotMatch(translateMarkup(shell), /\{\{/);
  const withoutMessages = shell.replace(/\{\{[\w.-]+\}\}/g, '');
  for (const text of withoutMessages.matchAll(/>([^<>]+)</g)) assert.equal(text[1].trim(), '');
  for (const label of withoutMessages.matchAll(/aria-label="([^"]*)"/g)) assert.equal(label[1], '');
  assert.throws(() => translateMarkup('{{unknown.key}}'), /Unknown translation key/);
});
