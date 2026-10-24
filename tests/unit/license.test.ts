import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('the distributed project license matches the repository license', () => {
  const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.equal(read('../../LICENSE'), read('../../public/licenses/project.txt'));
});
