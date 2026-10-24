# GTS-01. Replaceable audio

> Status: Design review. Implementation has not started.

## Goal

Add interface sounds and footsteps. Keep sound filenames in one manifest so weapons and traffic can use it later.

## Proposed structure

Feature-owned audio manifest and a Phaser audio adapter. Game features emit semantic cues such as `player:footstep`, `weapon:fired`, `actor:hit`, `vehicle:exploded`; UI emits menu intents through the existing typed boundary. Resolve these cues to `SoundId`, variant keys and mix settings in one place. Do not put Phaser sound objects in shared events or build a generic plugin framework.

## Configuration

Asset ID/URLs (browser-tested codecs), variant weights, bus (`master`, `sfx`, `ambience`, `ui`), gain, pitch range, cooldown, priority, maximum simultaneous voices, spatial falloff and loop policy. Footstep selection uses a material ID from world data. Playback cadence follows traveled distance/animation markers, not a frame counter. Walking/running cadence changes without changing movement balance. Audio randomness has a separate seed/stream from gameplay.

## Lifecycle

Unlock on a real user gesture; make muted/unavailable audio a playable state. Own and clean up subscriptions and sound handles; prevent duplicate loops on scene restart. Pause should stop/fade world ambience and effects while allowing menu confirmation sounds. UI volume/mute preferences may persist locally; handle unavailable storage. Loading failure reports a readable status without blocking the game.

## Candidate audition

Use existing [audio candidates](../AUDIO-CANDIDATES.md), audition UI and concrete/grass footsteps first. Preserve exact downloaded license and selected filenames before integration. SnakeF8 gun packs are candidates for GTS-03; large rawAmbience recordings remain blocked on clarifying redistribution terms. Do not ship entire downloaded archives. No download/integration is performed by this planning task.

## Acceptance

- Replacing a manifest entry changes the sound without editing gameplay code.
- Audio starts after a user gesture. Mute and volume controls work.
- Missing files do not block play. Pause, resume and scene restart do not duplicate sounds.
- Rapid events stay within voice limits. Browser tests check playback state.
- A listening session checks loudness and fatigue during repeated effects.

## Decisions needed

Choose the audition set and ambience style. Decide whether volume settings persist between visits.
