# Responsive UI

The owner's breakpoint reference defines four width ranges in CSS pixels. The interface adapts automatically without changing browser zoom, the Phaser camera or world units.

| Width             | Layout                      | UI scale |
| ----------------- | --------------------------- | -------- |
| Up to 480 px      | Phone                       | 85%      |
| 481 to 768 px     | Tablet and large phone      | 90%      |
| 769 to 1279 px    | Laptop and landscape tablet | 95%      |
| 1280 px and wider | Desktop                     | 100%     |

The practical minimum tested page width is 320 px. The reference's zero lower bound is a category boundary, not a usable device size. Keyboard movement remains the game's input method. This work does not add touch movement.

## Scaling and layout

`tokens.json` owns the scales, breakpoint values and text-size floors under `responsive`. `npm run theme:build` generates media queries in `tokens.css`, including `--kb-ui-scale`, scaled type roles and spacing. Shared components receive these values through their existing CSS variables. Panel dimensions use the same factor. Small text stays at least 16 px for the UI role, 14 px for labels and 13 px for metadata. The 48 px minimum target, borders, focus outlines and hard shadows remain fixed.

Layout rules in `src/ui/styles` and the task browser use the same width boundaries. Tablet and phone layouts stack HUD information rather than shrinking it into overlapping panels. Desktop edition details give way to controls on narrower layouts. Phone headings wrap when needed. At up to 480 px the entire minimap panel is hidden, and a compact Map button in the tools opens the full city map. The task browser stacks its navigation below 769 px and scrolls wide Markdown tables inside the document.

In a fullscreen viewport at most 480 px high, district and health panels use a compact layout and the camera tools stay above the minimap. At phone widths the minimap remains hidden and the compact Map button stays available. Full-map access is preserved. Tall dialogs scroll inside their overlay, with their heading initially visible and their close action reachable.

The renderer still uses the same movement speeds, world coordinates, collision data and camera zoom. The app's existing resize observer updates the canvas to its host dimensions. CSS scaling does not transform the canvas or its input coordinates.

## Review and tests

The review found two issues in a low fullscreen viewport: the minimap covered camera controls, and the centered Controls dialog clipped its heading above the scrollable area. The compact HUD layout and safe dialog alignment fix those cases.

`tests/responsive.spec.ts` checks every breakpoint edge, representative phone/laptop/desktop sizes and short fullscreen windows. It covers:

- No horizontal page overflow in the game or task browser.
- HUD panels contained in the game frame, with no panel intersections.
- Canvas dimensions matching the host after resize and fullscreen changes.
- Play, Controls, City map and Sound headings remaining visible, with close actions reachable by scrolling and pointer input.
- Buttons and audio sliders retaining 48 px targets at every scale.
- Focus returning to a visible control when resizing hides the dialog opener.
- Live resizing across all four ranges without restarting the engine or changing player coordinates, seed or camera zoom.
- Wide weapon tables and feedback controls staying inside the task browser.

Run `npm run test:e2e -- tests/responsive.spec.ts`, or `npm run check` for the complete project verification. The checks use geometry and interaction rather than pixel snapshots. Screenshots are reviewed separately for typography, spacing and the overall composition.
