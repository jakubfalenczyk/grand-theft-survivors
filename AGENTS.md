# Collaboration and architecture rules

## Collaboration

- Ask for additional permission or approval only when an action exceeds the existing authorization, is irreversible, or would materially change the result. First prepare a complete, reviewable result within the authorized scope.
- Keep important decisions in durable project files. Do not rely only on chat history or temporary files such as `/tmp`.
- If Chromium automation cannot verify a behavior, use real Chrome on Windows through an available extension or plugin. Choose the verification method for the scenario. Headless limitations do not rule out other available methods.
- Write repository content in English, including documentation, agent instructions, comments, identifiers, test fixtures and screenshots. Add future translations through the localization catalog.

## Public copy

- Describe the game as a game in public descriptions and interface text. Do not label it a prototype or preview. Keep current feature limitations in development documentation.

- Kerbside is the internal name of the project's custom design system. Use the name in design documentation, not in public game descriptions or interface branding.

## GitHub and commits

- Make each commit cover one task or coherent feature. Include its related code, tests and documentation together.
- Complete task lists in order. Commit each completed task that changes the repository separately. Three such tasks should produce three commits rather than one combined commit.
- After completing and verifying the whole list, push the prepared commits together to `origin/main`, unless the user requests another publication workflow.
- Use Conventional Commits in the form `type(scope): description`. The scope is optional. Choose the type that matches the change, such as `feat`, `fix`, `refactor`, `docs`, `test`, `build`, `ci` or `chore`.
- Write commit messages in English. Describe the change briefly in the imperative, for example `feat(audio): add footsteps`.
- Before every `git commit`, apply the `unslop` skill to the subject and any body text. Remove vague language and unnecessary words while preserving the Conventional Commits format.

## Required stack

- Use Phaser **3.90**, strict TypeScript, Vite 7, Node.js 22.12 or later, and npm with one `package-lock.json`. Phaser supplies its own types. Do not add `@types/phaser`.
- Use `.ts`, explicit data contracts and `import type`. Do not add `any`, `@ts-ignore` or disable `strict` to work around errors. Narrow types and restrict assertions to checked library interfaces.
- Do not upgrade Phaser's major version or add a second package manager as part of an ordinary feature. Tooling decisions are documented in `docs/ARCHITECTURE.md`.

## Module boundaries

- Keep `src/main.ts` limited to style imports and bootstrap. `src/app` composes the application and owns resizing and cleanup.
- `src/game/scenes` coordinates systems and scene lifecycle. Each scene has its own file. Put player logic, generation, rendering and future features in `src/game/features/<feature>/`.
- `src/game` must not access `document` or `window`, or import `ui` or `app`. `src/ui` must not import Phaser or scene classes. Connect them through typed events, `GameSession` and immutable data snapshots.
- `src/shared` contains only contracts and code independent of the engine, DOM and theme. Do not move code there merely because its correct location is unclear.
- Keep world data, collision footprints and rendering separate. The generator accepts a seed and returns plain data without `Math.random`, GameObjects or scene references. The renderer must not add Phaser objects to the generated layout.
- Do not create empty features, an ECS framework, global singletons or a generic plugin system for hypothetical needs. Add abstractions when a feature requires them.

## Kerbside

- Read `design-system/kerbside-design-system/README.md` and `docs/THEMING.md` before changing appearance.
- `design-system/kerbside-design-system/tokens.json` is the only token source. Add new tokens there, then run `npm run theme:build`. Do not edit the generated `tokens.css`.
- Shared `.kb-*` components belong in the canonical `components.css`. Application layout belongs in `src/ui/styles`. Get JavaScript, Canvas and Phaser colors from `src/theme/theme.ts`. Do not use local color literals in UI or renderers.
- Preserve accent roles, fonts, hard shadows, chamfered corners and 48 px targets. Do not add blur, glow, soft gradients or rounded cards. Pair faction colors with labels and use the correct text color. Use `muted` only for disabled text.
- Dialogs use `DialogController`, pause gameplay through `GameSession`, manage focus and have accessible labels. Do not add independent booleans for map, pause or help state.

## Lifecycle, performance and verification

- Every subscription needs an owner and cleanup. Remove listeners on `game.events` with their exact handler during `SHUTDOWN`. Never remove another owner's listeners. Clean up DOM listeners, observers and the debug bridge when unmounting the application.
- Textures are global within a game instance. Use stable keys and check whether a texture exists before creating it. Restarting a scene must not multiply resources.
- Calculate movement in world units per second and rotation in radians per second. Keep forward and backward walking at 105, forward running at 176 and turning at 4.8. Do not change balance during a refactor.
- Update the HUD from snapshots rather than writing to the DOM every frame. World rendering must not depend on frame rate. Add enemy and projectile pooling when those features arrive.
- `npm run check` must pass token checks, types, lint, formatting, unit tests, build and E2E. Test contracts, behavior and regressions rather than tests that only reproduce the implementation.
- Vite transpiles TypeScript without checking types. A working dev server or build does not replace `npm run typecheck`.
- Keep architecture decisions in `docs/ARCHITECTURE.md`, game direction in `docs/DESIGN.md` and theme rules in `docs/THEMING.md`. Update documentation with the code.
