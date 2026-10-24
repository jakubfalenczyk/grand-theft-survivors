# Kerbside: UI design system for a GTA2-inspired top-down game

Hand this folder to the agent. It contains everything needed to build game UI (HUD, menus, mission cards, notifications) in a consistent look.

## Files

- `tokens.json`: token source (colors, factions, fonts, scale, shape). Port to the target engine/framework from here.
- `tokens.css` / `components.css`: ready-made CSS (web, Electron, HTML-based game UI). Prefix `kb-`.
- `components.html`: live reference of every component. Open it in a browser to see the target look.
- `AGENT_PROMPT.md`: a short brief to paste to the agent.

## Concept

Top-down night city, printed like a two-ink risograph plan. Flat color fields, a hard offset "misregistration" shadow in a second ink, chamfered corners, road-marking dividers. It keeps the GTA2 mood (gangs, pager missions, wanted level, multiplier) without copying its UI, fonts or logo.

## Rules (do)

1. Ground is `asphalt`; light panels are `concrete`. Everything else is an accent with one job (see `role` in tokens.json). Do not repurpose accents.
2. Depth = hard offset shadow `4px 4px 0` (large: `6px`) in a second ink. Primary action: ultramarine offset; danger: acid offset; HUD: riot offset.
3. Corners are square (radius 0). Cards get one chamfered corner (top-right, 18-26px) via `clip-path`.
4. Dividers: dashed 2px line (road centerline) or the `kb-stripes` crosswalk bar.
5. Fonts: Big Shoulders Display 900 uppercase for titles and multiplier; Barlow Semi Condensed 600 for UI labels; Martian Mono for money, timers, ammo, metadata.
6. Faction color is always paired with a text label (never color-only). Use the `on` color from tokens.json for text on faction fills.
7. Touch/click targets at least 48px high. Focus ring: 3px acid outline, 3px offset.
8. Wanted level = row of 5 siren lamps (filled riot = active). Always give it an accessible label.

## Rules (don't)

- No gradients (only hard-stop stripes and minimap grid lines), no blur, no glow, no glassmorphism, no rounded cards, no emoji or stock icons as decoration.
- No pixel fonts, no yellow-on-black GTA palette, no cop-head sprites, no Rockstar or DMA assets.
- Do not add new accent colors. Need a new gang? Pick a mid-tone that passes 4.5:1 with its label text and add it to tokens.json.
- Do not use `muted` for anything except disabled text.

## Contrast notes

Concrete on asphalt and asphalt on every accent pass 4.5:1. White on ultramarine, docklands, velvet-ward and rust-union passes 4.5:1. Verify any new pairing.

## Gaps (not yet designed)

Icon set, vehicle/pickup sprites, full screens (garage, gang select, pause), motion spec, sound. Extend by following the rules above; put new tokens in `tokens.json` first, then mirror to CSS.

## Integration in Grand Theft Survivors

This is the canonical package. Read [the integration guide](../../docs/THEMING.md) for the implemented adapters and additions in version 0.3.0. `tokens.css` is generated from `tokens.json`: run `npm run theme:build` from the project root. The app imports this `components.css` directly and self-hosts the three font families through Fontsource, including Latin Extended characters.

The integration adds subdued physical world materials in `world.materials`; these do not change UI accent roles. See the integration guide for the distinction between material color and faction/interaction signals.
