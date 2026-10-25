# Grand Theft Survivors architecture

Current game architecture, updated 2026-10-24. Future systems are proposals in [the backlog](backlog/README.md), not existing APIs.

## Stack and boundaries

Phaser 3.90, strict TypeScript, Vite 7, Node.js 22.12+ and npm with one `package-lock.json`. Phaser provides its own types; do not add `@types/phaser`. Vite transpiles TypeScript without checking its types. Run `npm run typecheck` as part of every verification. No UI framework, ECS, global service singleton or plugin framework is needed at this scope.

`src/main.ts` only imports styles and bootstraps. `src/app` composes the application and owns resize/unmount. `src/game/scenes` coordinates lifecycle; each scene has its own file. Features own behavior and configuration in `src/game/features/<feature>`. Camera projection is in `src/game/camera`; shared drawing primitives are in `src/game/rendering`.

`src/game` does not access `document`/`window` or import UI/app. `src/ui` does not import Phaser or scene classes. Engine-independent contracts, the typed `EventBus`, `GameSession`, math and English localization live in `src/shared`. Theme adapters belong in `src/theme`. ESLint enforces the principal import/global boundaries.

## Data flow

The application creates and injects `GameSession`, `EventBus` and engine-independent `AudioSettings` into game and UI. The interface is mounted first; Phaser and its audio context are created only in the Play input handler. Interface commands change session mode/zoom or emit reset. The scene coordinates player, colliders, world renderer and camera. The seeded generator returns plain `WorldLayout` data; rendering does not add GameObjects to that data. Separate colliders use the ground footprints, even when roofs project outward.

`game:world-ready` publishes the layout. `game:snapshot` publishes player position, movement and `DistrictId` at most once per 80 ms. The HUD translates district IDs; no localized display names cross the game/UI boundary. UI maps consume the same data. Snapshots never contain Phaser or DOM objects.

`GameSession` has exactly one mode: `start`, `loading`, `playing`, `paused`, `help`, `map` or `audio`. One `DialogController` owns visibility, background blocking and focus across all dialogs. It remembers the initial opener while the player switches dialogs, then restores focus when returning to play. Future gameplay state belongs to its feature, not this application session class.

The event map checks names/payloads at compile time; its one internal `unknown` narrowing is isolated. Every subscription has an owner and cleanup. Global Phaser event listeners are removed with the exact handler on scene `SHUTDOWN`; never remove other owners' listeners. App destruction aborts DOM listeners, disconnects resize observers and removes its development debug bridge.

## World and rendering

The current seed is 2042, with a fixed 6 × 6 block grid and a 2520-unit square world. Generation uses seeded randomness; independent decorative streams prevent changing roof details from rearranging buildings. It is not yet a chunked world or a curated multi-map system.

Canvas textures are created once and reused with stable keys. Roofs and ground include seed/ID where needed. Scene restart must not accumulate textures/listeners. Dynamic facades use projected Phaser Graphics; see `ART-PIPELINE.md` for the audit and external-asset recommendation. Kerbside tokens, material inks and adapters are documented in `THEMING.md`; English catalog rules are in `LOCALIZATION.md`.

Movement remains 105 world units/s forward/backward, 176 running forward and 4.8 rad/s turning. Camera projection uses H=500 and building heights 95/130/165, giving roof scales about 1.23/1.35/1.49. Collision stays at ground level. Rendering does not change gameplay based on frame rate.

## Growth rules

Add abstractions only for a real feature. Scenes decide when modules start/update/stop; modules decide how they behave. Keep configuration with the owning feature. Future enemies/projectiles should use bounded pools when introduced. Weapons own targeting/cooldown; spawn pressure belongs to a director; leveling does not belong to the player renderer. No such future feature is implemented yet.

Vite separates the Phaser chunk for caching. The engine remains about 1.2 MB before gzip; the size warning is intentional and is not suppressed. Keep npm as the only package manager. Consider a runtime change only after measuring a build or test problem. `window.__gameDebug` is development-only, read-only and removed on destroy; it is not gameplay communication.

## Verification

`npm run check` runs token synchronization/usage, strict types, lint, formatting, unit tests, production build and Chromium E2E. Contracts cover deterministic world data, non-overlapping footprints, projection, session and listener cleanup, faction contrast and localization. Browser tests cover real movement/collision, pause/map/help, keyboard focus, local fonts, scene restart, English accessibility and mobile layout. The movement speed test uses a controlled browser clock so runner load does not determine its simulated interval. The footstep playback test waits for 70 units of movement before checking its sound count. Keyboard is required to play; touch controls are not implemented.

## Sources

- [Phaser Scenes](https://docs.phaser.io/phaser/concepts/scenes): scene lifecycle and shared game resources.
- [Phaser Events](https://docs.phaser.io/phaser/concepts/events): event ownership and handler cleanup.
- [Phaser TypeScript installation](https://docs.phaser.io/phaser/getting-started/installation#phaser-typescript-definitions): bundled engine types, also checked in the installed package.
- [Phaser Groups](https://docs.phaser.io/phaser/concepts/gameobjects/group): future recycling of enemies/projectiles.
- [Vite 7](https://v7.vite.dev/guide/): bundling/dev server, separate type checking.

## Deployment

The GitHub Pages workflow verifies the project, builds it under `/grand-theft-survivors/`, tests that production path and deploys only `dist/`. See `PUBLISHING.md`. The architecture review and selected modal change are recorded in `ARCHITECTURE-REVIEW.md`.

## Task browser

`docs/backlog/index.html` is a separate Vite entry, published alongside the game at `/docs/backlog/`. Its TypeScript module uses an eager raw Markdown glob, so adding or removing a Markdown file changes the list without a registry. Markdown-it renders tables and lists with raw HTML disabled and unsafe link schemes rejected. The browser shares the canonical design tokens, components and local fonts without loading Phaser. Shared decisions live in the backlog README; each task has its own Markdown file. Feedback drafts stay in memory per document, and the copy button prepares a message for the project chat. There is no comment service or repository write access in the page.

## Audio

`src/game/features/audio/manifest.ts` maps semantic cues to selected assets, weighted variants, buses, gain, rate range, cooldown, priority and voice limits. Files and tuning belong there. Footsteps use actual displacement and a separate stride configuration. World-owned `surfaceAt` resolves the current lawn and concrete path shapes from layout data. Audio randomness uses its own seed and never advances world generation.

`AudioDirector` preloads only selected files, reuses the game cache and owns scene voices and bus/session subscriptions. It updates active voice levels when preferences change, stops world sounds in dialogs and destroys all owned voices on shutdown. Each cue has a voice cap, and the global cap is eight. UI cues remain available during pause. Failed files have an eight-second request timeout and produce a readable status while play continues. There are no ambience loops to resume in this release. Positional attenuation is deferred until a world emitter needs it.

The app creates and resumes an AudioContext synchronously inside Play and passes it to Phaser. Audio failure can fall back to silent play. `AudioSettings` validates versioned plain data and computes Master × All SFX × subgroup, or Master × Music. Global mute yields zero without changing levels. `src/app/audioStorage.ts` owns local storage reads/writes and catches browser denials and invalid JSON. UI settings use the same dialog controller, pause model, focus trap and English catalog as the other menus. Phaser key capture is disabled while dialogs own input so range inputs retain their native arrow controls.

Only runtime sound exports and notices are committed. Source archives and unused samples stay in temporary storage outside the checkout. See `AUDIO-ASSETS.md` for original filenames, hashes, edits and licenses.
