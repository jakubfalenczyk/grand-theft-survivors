import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AudioSettings,
  busVolume,
  parseAudioPreferences,
} from '../../src/shared/audio/AudioSettings.ts';
import { GameSession } from '../../src/shared/GameSession.ts';
import { createEventBus } from '../../src/shared/EventBus.ts';
import { Footsteps } from '../../src/game/features/audio/Footsteps.ts';
import { surfaceAt } from '../../src/game/features/world/surfaceAt.ts';
import type { WorldLayout } from '../../src/shared/contracts.ts';

const layout: WorldLayout = {
  seed: 1,
  mapId: 'footsteps-fixture',
  nameKey: 'city',
  bounds: { width: 1000, height: 1000 },
  spawns: [{ x: 500, y: 500 }],
  streets: { vertical: [], horizontal: [], width: 108, labels: [] },
  districts: [],
  surfaces: [
    { x: 0, y: 0, w: 260, h: 260, material: 'grass', role: 'lawn' },
    { x: 118, y: 0, w: 24, h: 260, material: 'concrete', role: 'path' },
    { x: 0, y: 118, w: 260, h: 24, material: 'concrete', role: 'path' },
    { x: 90, y: 90, w: 80, h: 80, material: 'concrete', role: 'plaza' },
  ],
  buildings: [],
  trees: [],
  blocks: [{ x: 0, y: 0, park: true, parking: false }],
};

test('audio preferences validate stored data and preserve the volume hierarchy', () => {
  const settings = new AudioSettings({
    version: 1,
    muted: false,
    volumes: { master: 0.5, sfx: 0.4, player: 0.3, music: 0.2, ui: 5, world: -1, enemy: 'bad' },
  });
  assert.equal(busVolume(settings.state, 'player'), 0.06);
  assert.equal(busVolume(settings.state, 'music'), 0.1);
  assert.equal(settings.state.volumes.ui, 1);
  assert.equal(settings.state.volumes.world, 0);
  assert.equal(settings.state.volumes.enemy, 0.8);
  settings.setVolume('player', NaN);
  assert.equal(settings.state.volumes.player, 0.3);
  settings.setMuted(true);
  assert.equal(busVolume(settings.state, 'music'), 0);
  settings.setMuted(false);
  assert.equal(settings.state.volumes.music, 0.2);
  assert.deepEqual(parseAudioPreferences({ version: 99 }), parseAudioPreferences(null));
  assert.throws(() => {
    // Preferences cannot be mutated by a subscriber.
    // @ts-expect-error Verify immutability at runtime too.
    settings.state.volumes.master = 1;
  }, TypeError);
  let notifications = 0;
  const stop = settings.subscribe(() => notifications++);
  settings.setVolume('master', 0.5);
  stop();
  settings.setMuted(true);
  assert.equal(notifications, 1);
});

test('the start screen cannot be skipped by map or pause shortcuts; sound returns to its caller', () => {
  const session = new GameSession('start');
  session.toggleMap();
  session.togglePause();
  session.openAudio();
  assert.equal(session.state.mode, 'start');
  session.setMode('loading');
  session.togglePause();
  assert.equal(session.blocked, true);
  session.setMode('playing');
  session.openAudio();
  session.togglePause();
  assert.equal(session.state.mode, 'playing');
  session.setMode('paused');
  session.openAudio();
  session.closeAudio();
  assert.equal(session.state.mode, 'paused');
});

test('footsteps follow distance, ground material and resolved movement across frame rates', () => {
  const cues = (count: number) => {
    const bus = createEventBus();
    const steps = new Footsteps(layout, bus);
    const results: string[] = [];
    bus.on('audio:cue', (cue) => {
      if (cue.id === 'player:footstep') results.push(cue.surface);
    });
    steps.update({ x: 10, y: 10 }, false, false);
    for (let i = 1; i <= count; i++)
      steps.update({ x: 10 + (96 * i) / count, y: 10 }, false, false);
    for (let i = 0; i < 20; i++) steps.update({ x: 106, y: 10 }, false, false);
    assert.equal(results.length, 3);
    steps.update({ x: 130, y: 10 }, false, true);
    steps.update({ x: 130, y: 10 }, false, false);
    assert.equal(results.length, 3);
    steps.reset();
    steps.update({ x: 130, y: 10 }, false, false);
    steps.update({ x: 900, y: 10 }, false, false);
    assert.equal(results.length, 3);
    return results;
  };
  assert.deepEqual(cues(30), cues(120));
  assert.equal(surfaceAt(layout, { x: 130, y: 10 }), 'concrete');
  assert.equal(surfaceAt(layout, { x: 10, y: 10 }), 'grass');
  assert.equal(surfaceAt(layout, { x: 100, y: 100 }), 'concrete');
  assert.equal(surfaceAt(layout, { x: 400, y: 10 }), 'concrete');
});
