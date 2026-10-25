import { readFile, writeFile } from 'node:fs/promises';

const source = new URL('../design-system/kerbside-design-system/tokens.json', import.meta.url);
const output = new URL('../design-system/kerbside-design-system/tokens.css', import.meta.url);
const tokens = JSON.parse(await readFile(source, 'utf8'));
const entries = [];
const add = (key, value) => entries.push(`  --kb-${key}: ${value};`);
for (const [name, { value }] of Object.entries(tokens.color)) add(name, value);
for (const [name, { value, on }] of Object.entries(tokens.faction)) {
  add(name, value);
  add(`${name}-on`, on);
}
for (const name of ['display', 'ui', 'mono']) add(`font-${name}`, tokens.font[name]);
for (const [name, value] of Object.entries(tokens['type-scale-px']))
  add(`text-${name}`, `${value}px`);
tokens['space-px'].forEach((value, index) => add(`space-${index + 1}`, `${value}px`));
for (const [name, value] of Object.entries(tokens.shape)) {
  if (typeof value === 'number') add(name.replace(/-px$/, ''), `${value}px`);
}
for (const [name, value] of Object.entries(tokens.shadow)) add(`shadow-${name}`, value);
for (const [name, value] of Object.entries(tokens.focus)) add(`focus-${name}`, `${value}px`);
add('ui-scale', tokens.responsive.scale.desktop);
let responsiveCss = '';
for (const name of ['compact', 'tablet', 'phone']) {
  const scale = tokens.responsive.scale[name];
  const values = [`  --kb-ui-scale: ${scale};`];
  for (const [role, size] of Object.entries(tokens['type-scale-px'])) {
    const value = Math.max(tokens.responsive['type-min-px'][role] ?? 0, size * scale);
    values.push(`  --kb-text-${role}: ${Number(value.toFixed(3))}px;`);
  }
  tokens['space-px'].forEach((size, index) =>
    values.push(`  --kb-space-${index + 1}: ${Number((size * scale).toFixed(3))}px;`),
  );
  responsiveCss += `\n@media (max-width: ${tokens.responsive[`${name}-max-width-px`]}px) {\n  :root {\n${values.map((line) => `  ${line}`).join('\n')}\n  }\n}\n`;
}
const css = `/* Generated from tokens.json by npm run theme:build. Do not edit. */\n:root {\n${entries.join('\n')}\n}\n${responsiveCss}`;
if (process.argv.includes('--check')) {
  if ((await readFile(output, 'utf8')) !== css) {
    throw new Error('Theme CSS is out of date. Run npm run theme:build.');
  }
} else await writeFile(output, css);

// Browser chrome follows the same asphalt token as the application.
const documentPath = new URL('../index.html', import.meta.url);
const document = await readFile(documentPath, 'utf8');
const themedDocument = document.replace(
  /(<meta name="theme-color" content=")[^"]+("\s*\/?>)/,
  `$1${tokens.color.asphalt.value}$2`,
);
if (process.argv.includes('--check')) {
  if (document !== themedDocument)
    throw new Error('Browser theme color is out of date. Run npm run theme:build.');
} else await writeFile(documentPath, themedDocument);
