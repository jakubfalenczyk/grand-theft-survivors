# Localization

English is the only current language. `src/shared/intl/en.ts` contains all player-facing text, including accessible names, controls, street names, credits, city map labels and the page title. Keep technical IDs, diagnostic errors and gameplay numbers outside the catalog.

## Messages

Use `t(key, values)` for DOM `textContent` and Canvas text. TypeScript checks the message key and required named parameters. Translate whole sentences rather than concatenating fragments. The current zoom and coordinate messages use named parameters. Future quantities should use `Intl.NumberFormat` and plural rules.

The HTML shell uses `{{message.key}}` markers. `translateMarkup` checks each key and escapes its value for text and quoted attributes. Translations contain plain text. The Vite HTML transform resolves the page title, and mounting the interface sets the document language and title.

Game snapshots contain `DistrictId`. The HUD resolves that ID to a message. Canvas renderers read the same catalog. Street names become part of the ground texture when the scene creates it.

## Adding a language

1. Create a catalog satisfying `Catalog` and check that its named parameters match English.
2. Add language selection and an English fallback.
3. Pass the selected translator to text consumers.
4. Regenerate text-bearing textures or include the language in their keys.
5. Check text length, accessible names and glyph coverage in the new language.

Language switching during a run is not implemented. Changing a text-bearing texture needs an explicit regeneration step. Do not add a second English catalog.

Unit tests check interpolation, unknown keys and shell coverage. Browser tests check English text and accessible names in the help, pause and map dialogs.
