import { readdir, readFile } from 'node:fs/promises';

async function checkDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await checkDirectory(path);
    else if (/\.(ts|css|html)$/.test(path)) {
      const source = await readFile(path, 'utf8');
      if (/(?:#[\da-f]{3,8}\b|\b0x[\da-f]{6}\b|\b(?:rgb|rgba|hsl|hsla)\()/i.test(source)) {
        throw new Error(`${path}: use theme tokens instead of literal colors.`);
      }
      if (/\b(?:blur|drop-shadow)\s*\(/i.test(source)) {
        throw new Error(`${path}: Kerbside does not use blur or soft shadows.`);
      }
    }
  }
}
await checkDirectory('src/ui');
await checkDirectory('src/game');
await checkDirectory('docs/backlog');
console.log('UI, game renderers and task browser use the shared theme.');
