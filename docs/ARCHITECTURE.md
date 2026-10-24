# Grand Theft Survivors architecture

Implemented prototype baseline, updated 2026-10-24. Future systems are proposals in `BACKLOG.md`, not existing APIs.

## Stack and boundaries

Phaser 3.90, strict TypeScript, Vite 7, Node.js 22.12+ and npm with one `package-lock.json`. Phaser provides its own types; do not add `@types/phaser`. Vite transpiles TypeScript without checking its types. Run `npm run typecheck` as part of every verification. No UI framework, ECS, global service singleton or plugin framework is needed at this scope.

`src/main.ts` only imports styles and bootstraps. `src/app` composes the application and owns resize/unmount. `src/game/scenes` coordinates lifecycle; each scene has its own file. Features own behavior and configuration in `src/game/features/<feature>`. Camera projection is in `src/game/camera`; shared drawing primitives are in `src/game/rendering`.

`src/game` does not access `document`/`window` or import UI/app. `src/ui` does not import Phaser or scene classes. Engine-independent contracts, the typed `EventBus`, `GameSession`, math and English localization live in `src/shared`. Theme adapters belong in `src/theme`. ESLint enforces the principal import/global boundaries.

## Data flow

The application creates and injects `GameSession` and `EventBus` into game and UI. Interface commands change session mode/zoom or emit reset. The scene coordinates player, colliders, world renderer and camera. The seeded generator returns plain `WorldLayout` data; rendering does not add GameObjects to that data. Separate colliders use the ground footprints, even when roofs project outward.

`game:world-ready` publishes the layout. `game:snapshot` publishes player position, movement and `DistrictId` at most once per 80 ms. The HUD translates district IDs; no localized display names cross the game/UI boundary. UI maps consume the same data. Snapshots never contain Phaser or DOM objects.

`GameSession` has exactly one mode: `playing`, `paused`, `help` or `map`. One `DialogController` owns visibility, background blocking and focus across all dialogs. It remembers the initial opener while the player switches dialogs, then restores focus when returning to play. Future gameplay state belongs to its feature, not this application session class.

The event map checks names/payloads at compile time; its one internal `unknown` narrowing is isolated. Every subscription has an owner and cleanup. Global Phaser event listeners are removed with the exact handler on scene `SHUTDOWN`; never remove other owners' listeners. App destruction aborts DOM listeners, disconnects resize observers and removes its development debug bridge.

## World and rendering

The current seed is 2042, with a fixed 6 × 6 block grid and a 2520-unit square world. Generation uses seeded randomness; independent decorative streams prevent changing roof details from rearranging buildings. It is not yet a chunked world or a curated multi-map system.

Canvas textures are created once and reused with stable keys. Roofs and ground include seed/ID where needed. Scene restart must not accumulate textures/listeners. Dynamic facades use projected Phaser Graphics; see `ART-PIPELINE.md` for the audit and external-asset recommendation. Kerbside tokens, material inks and adapters are documented in `THEMING.md`; English catalog rules are in `LOCALIZATION.md`.

Movement remains 105 world units/s forward/backward, 176 running forward and 4.8 rad/s turning. Camera projection uses H=500 and building heights 95/130/165, giving roof scales about 1.23/1.35/1.49. Collision stays at ground level. Rendering does not change gameplay based on frame rate.

## Growth rules

Add abstractions only for a real feature. Scenes decide when modules start/update/stop; modules decide how they behave. Keep configuration with the owning feature. Future enemies/projectiles should use bounded pools when introduced. Weapons own targeting/cooldown; spawn pressure belongs to a director; leveling does not belong to the player renderer. No such future feature is implemented yet.

Vite separates the Phaser chunk for caching. The engine remains about 1.2 MB before gzip; the size warning is intentional and is not suppressed. Keep npm as the only package manager. Consider a runtime change only after measuring a build or test problem. `window.__gameDebug` is development-only, read-only and removed on destroy; it is not gameplay communication.

## Verification

`npm run check` runs token synchronization/usage, strict types, lint, formatting, unit tests, production build and Chromium E2E. Contracts cover deterministic world data, non-overlapping footprints, projection, session and listener cleanup, faction contrast and localization. Browser tests cover real movement/collision, pause/map/help, keyboard focus, local fonts, scene restart, English accessibility and mobile layout. Keyboard is required to play; touch controls are not implemented.

## Sources

- [Phaser Scenes](https://docs.phaser.io/phaser/concepts/scenes): scene lifecycle and shared game resources.
- [Phaser Events](https://docs.phaser.io/phaser/concepts/events): event ownership and handler cleanup.
- [Phaser TypeScript installation](https://docs.phaser.io/phaser/getting-started/installation#phaser-typescript-definitions): bundled engine types, also checked in the installed package.
- [Phaser Groups](https://docs.phaser.io/phaser/concepts/gameobjects/group): future recycling of enemies/projectiles.
- [Vite 7](https://v7.vite.dev/guide/): bundling/dev server, separate type checking.

## Deployment

The GitHub Pages workflow verifies the project, builds it under `/grand-theft-survivors/`, tests that production path and deploys only `dist/`. See `PUBLISHING.md`. The architecture review and selected modal change are recorded in `ARCHITECTURE-REVIEW.md`.
