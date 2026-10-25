# GTS-01. Replaceable audio

> Status: Implemented. Owner listening review remains open.

## Goal

Add interface sounds and footsteps. Keep sound filenames in one manifest so weapons and traffic can use it later.

## Structure

Feature-owned audio manifest and a Phaser audio adapter. Game features emit semantic cues such as `player:footstep`, `weapon:fired`, `actor:hit`, `vehicle:exploded`; UI emits menu intents through the existing typed boundary. Resolve these cues to `SoundId`, variant keys and mix settings in one place. Do not put Phaser sound objects in shared events or build a generic plugin framework.

## Configuration

Asset ID/URLs (browser-tested codecs), variant weights, bus (`master`, `music`, `sfx`, `player`, `enemy`, `world`, `ui`), gain, pitch range, cooldown, priority, maximum simultaneous voices, loop policy. Positional falloff will be added when a world emitter needs it. Footstep selection uses a material ID from world data. Playback cadence follows traveled distance/animation markers, not a frame counter. Walking/running cadence changes without changing movement balance. Audio randomness has a separate seed/stream from gameplay.

## Lifecycle

Unlock on a real user gesture; make muted/unavailable audio a playable state. Own and clean up subscriptions and sound handles; prevent duplicate loops on scene restart. Pause should stop/fade world ambience and effects while allowing menu confirmation sounds. Volume and mute preferences persist locally when storage is available. Storage failure does not block play. Loading failure reports a readable status without blocking the game.

## Candidate audition

Use existing [audio candidates](../AUDIO-CANDIDATES.md), audition UI and concrete/grass footsteps first. Preserve exact downloaded license and selected filenames before integration. SnakeF8 gun packs are candidates for GTS-03; large rawAmbience recordings remain blocked on clarifying redistribution terms. Do not ship entire downloaded archives. Only selected UI and footstep files are integrated under this task.

## Acceptance

- Replacing a manifest entry changes the sound without editing gameplay code.
- Audio starts after a user gesture. Mute and volume controls work.
- Missing files do not block play. Pause, resume and scene restart do not duplicate sounds.
- Rapid events stay within voice limits. Browser tests check playback state.
- A listening session checks loudness and fatigue during repeated effects.

## Confirmed implementation decisions

- Show a start screen and create the game only after the player presses Play. Initialize audio in that user gesture.
- Download source packs outside the repository. Commit only selected effects and their license notices.
- Use the Mayra footsteps and ObsydianX interface packs for this first selection. Sound choices can be replaced after listening in the game. Do not add music or uncleared city ambience.
- Provide Master and Music levels, plus All SFX with Player, Enemy, World and Interface subgroups. Include a global mute. Music and Enemy controls reserve preferences for later content without loading unused files.
- Persist volume levels and mute in local storage. Invalid or unavailable storage must not prevent play.
- Keep concrete and grass footsteps tied to actual distance traveled. Preserve all movement speeds.

## Delivered files and verification

The manifest and Phaser adapter are in `src/game/features/audio/`. Shared preferences are in `src/shared/audio/`, storage is owned by `src/app/audioStorage.ts`, and the UI mixer is in `src/ui/components/AudioControls.ts`. See [audio assets](../AUDIO-ASSETS.md) for the seven selected samples and retained permission notices.

Browser tests cover Play gating, decoded playback, displacement-based footsteps, dialog pause, keyboard controls, live mix changes, mute, storage persistence, denied/corrupt storage, missing files, unavailable audio and scene restart cleanup. Unit tests cover the gain hierarchy, input validation, start/menu state and surface/cadence rules. Owner listening feedback is still needed to judge sample character and fatigue. Selection can change without gameplay edits.

Verified on 2026-10-25 with the full project check, including 14 unit tests and 20 browser tests.
