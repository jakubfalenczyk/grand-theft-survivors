# Kerbside integration

Kerbside is the project's custom design system, created in Claude Design for Grand Theft Survivors. The name identifies the visual style and shared UI components in development documentation.

The canonical package is `design-system/kerbside-design-system/`. Read its README before changing appearance. `tokens.json` is the only token source. `npm run theme:build` generates CSS and the browser theme color; never edit generated `tokens.css`.

```text
tokens.json → scripts/theme.mjs → tokens.css → shared .kb-* components → UI layout
            → src/theme/theme.ts → Canvas and Phaser colors
```

Fonts are local Fontsource packages: Big Shoulders Display 900, Barlow Semi Condensed 600, Martian Mono 400/700. No runtime font service. Canonical `.kb-*` components live in `components.css`; application layout belongs in `src/ui/styles`.

## Semantic roles

Asphalt is the dark base; concrete is paper and light text. Sodium marks primary actions; riot marks danger and HUD offset ink; canal marks health and positive signals; ultramarine marks police/armor and action offsets; acid marks selection, pickups, focus and the player marker. Muted is disabled text only. Factions always have a text label and use their configured `on` text color. Do not infer territorial ownership from a building material.

Keep square or chamfered corners, hard 4/6 px shadows, 48 px targets and a 3 px focus outline with 3 px offset. No blur, glow, glass, rounded cards or soft gradients. Dialogs use `DialogController` and exclusive `GameSession` modes, with focus restoration, accessible labels and paused movement.

## World art: version 0.3.0

The monochrome city came from `world.neutral-mix`: every material interpolated only asphalt and concrete. Version 0.3.0 adds colored physical materials while retaining the existing UI accent roles.

Keep neutral roads, foundations, machinery and strong silhouettes. `world.materials` now defines subdued physical surface inks: brick and warm masonry in Old Town; blue steel in Ironworks; patinated roofs and warm plaster in Greenfield; layered green foliage/parks, restrained vehicle paint and occasional amber windows/lamps. All remain flat fills with hard shadows. Lamps do not emit glow. These tokens are world surfaces, not new UI accents. Saturated semantic colors remain reserved for readable interaction signals.

`world.districts` references material names; `worldInk` combines neutral mixes with material values. Roofs use Canvas textures generated once, while facades use projected Phaser polygons. Geometry, seeds, footprints, collision and movement balance are unchanged. The minimap remains a simplified neutral navigation view with an acid player marker.

City art will need another review once landmarks and faction signs exist. Future readable landmarks and faction signage require explicit data and labels. Do not recolor arbitrary districts using faction accents as decoration.

## Adding tokens and components

1. Reuse a semantic role and `.kb-*` component. Add only feature layout in UI styles.
2. Put new tokens in JSON and expose them through the generator/adapter as needed; run `npm run theme:build`.
3. Use CSS variables in CSS, `colors`/`worldInk` in Canvas, `phaserColors`/`toPhaserColor` in Phaser. No local color literals.
4. Add player-facing copy to the English message catalog, including accessible labels.
5. Run `npm run check`; inspect desktop/mobile views and any changed world art.

The original package gained named shadow/focus/chamfer tokens in 0.2.0 and world material inks in 0.3.0. UI accent roles and fonts have not changed. Reference components: `http://localhost:5173/design-system/kerbside-design-system/components.html`.

## Detailed pixel-art world

The [world-art standard](art/PIXEL-ART.md) requires 128 × 128 or larger standalone source textures/frames, RGBA8888 and thin one-pixel contours. `world.pixel-art` stores these settings. Roof density is at least 2× world dimensions. Images map the larger textures back to their original world dimensions; camera projection and collision remain separate. Trees and character frames use 128 × 128 sources. Tree canopies have no outline; foliage colors and stepped shading define their shape without dark rings around individual clusters. Roads and decorative parked cars remain baked into the full-resolution ground canvas.

`world.materials` includes paving, mortar, glass, metal, rubber, bark and character materials. `materialShade` derives discrete shades toward asphalt/concrete without introducing local color literals. Detailed roof tiles/seams, equipment, leaf clusters, wall joints, pavement and drains use hard fills. UI accent roles, fonts and the simplified map remain unchanged.
