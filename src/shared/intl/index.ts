import { en } from './en.ts';

export type MessageKey = keyof typeof en;
export type Catalog = { readonly [K in MessageKey]: string };
export const locale = 'en';

type Placeholders<S extends string> = S extends `${string}{${infer P}}${infer Rest}`
  ? P | Placeholders<Rest>
  : never;
export type StaticMessageKey = {
  [K in MessageKey]: [Placeholders<(typeof en)[K]>] extends [never] ? K : never;
}[MessageKey];
type Arguments<K extends MessageKey> = [Placeholders<(typeof en)[K]>] extends [never]
  ? []
  : [values: Record<Placeholders<(typeof en)[K]>, string | number>];

/** Plain text only: translated messages never contain executable markup. */
export function t<K extends MessageKey>(key: K, ...args: Arguments<K>): string {
  const values: Readonly<Record<string, string | number>> = args[0] ?? {};
  return en[key].replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in values)) throw new Error(`Missing translation parameter: ${key}.${name}`);
    return String(values[name]);
  });
}

/** Resolve static text/attribute markers; escape values for both HTML contexts. */
export function translateMarkup(markup: string): string {
  return markup.replace(/\{\{([\w.-]+)\}\}/g, (_, key: string) => {
    if (!Object.hasOwn(en, key)) throw new Error(`Unknown translation key: ${key}`);
    const value = en[key as MessageKey];
    return value.replace(/[&<>"']/g, (char) => {
      const escapes: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return escapes[char];
    });
  });
}
