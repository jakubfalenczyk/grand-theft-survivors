import tokens from '../../design-system/kerbside-design-system/tokens.json' with { type: 'json' };

export { tokens };
export const colors = Object.freeze(
  Object.fromEntries(Object.entries(tokens.color).map(([name, token]) => [name, token.value])),
);
export const toPhaserColor = (color: string) => Number.parseInt(color.slice(1), 16);
export const phaserColors = Object.freeze(
  Object.fromEntries(Object.entries(colors).map(([name, color]) => [name, toPhaserColor(color)])),
);

function neutral(mix: number) {
  const from = (colors.asphalt.match(/[a-f\d]{2}/gi) ?? []).map((part) =>
    Number.parseInt(part, 16),
  );
  const to = (colors.concrete.match(/[a-f\d]{2}/gi) ?? []).map((part) => Number.parseInt(part, 16));
  return (
    '#' +
    from
      .map((channel, i) =>
        Math.round(channel + (to[i] - channel) * mix)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

/** Physical materials stay subdued; saturated UI accents retain their semantic roles. */
export const worldInk = Object.freeze(
  Object.fromEntries([
    ...Object.entries(tokens.world['neutral-mix']).map(([name, mix]): [string, string] => [
      name,
      neutral(mix),
    ]),
    ...Object.entries(tokens.world.materials),
  ]),
);
export const withAlpha = (color: string, alpha: number) =>
  color +
  Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
export const factionTheme = (id: keyof typeof tokens.faction) => tokens.faction[id];
export const THEME_VERSION = tokens.version;

/** Discrete material ramps add surface detail without repurposing UI accents. */
export function materialShade(color: string, amount: number) {
  const target = amount < 0 ? colors.asphalt : colors.concrete;
  const strength = Math.min(1, Math.abs(amount));
  const channels = [1, 3, 5].map((offset) => {
    const source = Number.parseInt(color.slice(offset, offset + 2), 16);
    const end = Number.parseInt(target.slice(offset, offset + 2), 16);
    return Math.round(source + (end - source) * strength)
      .toString(16)
      .padStart(2, '0');
  });
  return `#${channels.join('')}`;
}
