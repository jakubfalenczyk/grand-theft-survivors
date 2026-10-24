# Architecture review

Reviewed 2026-10-24 with the `improve-codebase-architecture` and `codebase-design` skills. The repository has two commits, so its history does not yet establish frequently changed modules. This review covers the recently added localization, district materials and dialog behavior. The owner selected modal transitions for implementation. District material resolution remains a proposal.

## Modal transitions

Recommendation strength: Strong. Dependencies are local-substitutable; use the real DOM in Chromium.

The modal interface splits transition ordering, background blocking and focus history between `src/ui/createInterface.ts` and `src/ui/components/DialogController.ts`. The caller must close one dialog before opening the other, while each controller keeps its own previous focus.

Before the change, Chromium reproduced a defect through the game's interface. Open Controls, press M, then Escape. Focus remains on `close-map` inside the hidden city map. Open the city map, press H, then Escape. Focus remains on `resume-button` inside the hidden controls dialog. Existing tests cover closing one dialog but miss both transitions.

Deepen the modal module so it owns cross-dialog ordering, background blocking and final focus restoration. Keep the engine-independent `GameSession` and its exclusive modes. The existing focus trap earns its keep; moving caller-side coordination behind the modal seam would concentrate the implementation instead of duplicating it for each new dialog.

This improves locality for focus behavior and leverage for future dialogs. Test through the same interface as the caller, with real keyboard focus, visible dialog state and cleanup. No mock adapter or modal plugin framework is needed. The selected implementation has one `DialogController` per mounted interface. It receives the session mode and owns the dialog transition, background state and original opener.

## District materials

Recommendation strength: Worth exploring. Dependencies are in-process.

`src/game/features/world/districts.ts` joins district identity with theme material strings. The city layout generator imports it only to select IDs. `WorldRenderer.ts` and `createRoofTexture.ts` repeat district lookup and validation. `BuildingRenderer.ts` performs another numeric color conversion. `worldInk` permits arbitrary string keys.

Keep district geography plain and deepen material resolution in the theme-owned module. Check references and convert representations there. Canvas and Phaser are the existing rendering adapters; neither needs a new adapter framework. This adds depth by removing lookup policy from their callers.

The deletion test favors removing the identity-and-material assembly, while keeping the shared district selection calculation. Moving that calculation into callers would spread geographic rules. Material validation in one implementation would improve locality; both rendering callers would gain leverage. Tests should check every district material and equivalent Canvas/Phaser colors, then preserve layout output across appearance changes.

## Existing choices to keep

- The city layout contains plain data shared by rendering and collision.
- The game/UI seam carries typed events and snapshots.
- `GameSession` hides exclusive modes and zoom rules behind a small interface.
- Stable texture keys and scene-restart checks address actual Phaser lifecycle behavior.
- Projected facades remain separate from ground collision.
- Localization does not need live language switching while English is the only locale.

The owner selected modal transitions. Browser regressions now cover both switching directions, repeated switches, reverse Tab traversal, background blocking and destruction while a dialog is open. District material resolution has not been implemented.
