# Localization

English is the only shipped locale (`en`). The source catalog is `src/shared/intl/en.ts`; every player-facing label belongs there, including accessible names, keycaps, street names, credits, map labels and document title. Technical IDs, error diagnostics and numeric gameplay configuration are not translations.

`t(key, values)` checks message keys and required interpolation parameters at compile time. It returns plain text for DOM `textContent` or Canvas text. Do not concatenate translated sentences. Use named parameters; future quantities should use `Intl.NumberFormat` and plural selection rather than English suffixes. The current zoom and coordinates use explicit catalog patterns.

The static HTML shell uses `{{message.key}}` markers. `translateMarkup` checks keys and escapes values for text and quoted attributes. It never evaluates HTML from translations. The Vite HTML transform resolves the document title before delivery, and the UI sets the document language/title when mounted. Unit tests reject unresolved markers and uncatalogued shell labels.

Snapshots carry `DistrictId`, not translated names. The UI resolves IDs to messages; Canvas renderers use the same catalog. Text baked into textures is created once; switching language during a session is deliberately not implemented.

To add a locale, supply a catalog satisfying `Catalog`, validate that each translated message has the same named placeholders, then add explicit locale selection and fallback to English. At that point inject the selected translator into text consumers and include locale in text-bearing texture keys or invalidate those textures. Do not introduce a second English catalog, silently accept missing keys or promise live switching before handling texture regeneration. No translation library is needed for the current single-locale scope.

Verification: `npm run check` includes catalog/template contracts and English accessible names across help, pause and map modes.
