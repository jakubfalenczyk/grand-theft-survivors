import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../../src/shared/GameSession.ts';
import { createEventBus } from '../../src/shared/EventBus.ts';

test('modal modes are exclusive, escape returns to play and zoom is bounded', () => {
  const session = new GameSession();
  session.setMode('help');
  assert.equal(session.blocked, true);
  session.toggleMap();
  assert.equal(session.state.mode, 'map');
  session.togglePause();
  assert.equal(session.state.mode, 'playing');
  session.zoomBy(100);
  assert.equal(session.state.zoom, 3);
  session.zoomBy(-100);
  assert.equal(session.state.zoom, 1);
  assert.throws(
    () =>
      session.setMode(
        // @ts-expect-error Verify runtime validation for callers outside TypeScript.
        'shop',
      ),
    /Unknown mode/,
  );
  assert.throws(() => {
    // @ts-expect-error Read-only state must also reject mutation at runtime.
    session.state.mode = 'map';
  }, TypeError);
});

test('unsubscribing removes only the owned listener', () => {
  const bus = createEventBus();
  let first = 0,
    second = 0;
  const off = bus.on('command:reset-player', () => first++);
  bus.on('command:reset-player', () => second++);
  bus.emit('command:reset-player', undefined);
  off();
  bus.emit('command:reset-player', undefined);
  assert.equal(first, 1);
  assert.equal(second, 2);
  bus.destroy();
  bus.emit('command:reset-player', undefined);
  assert.equal(second, 2);
});

test('session unsubscribes and emits only actual state changes', () => {
  const session = new GameSession();
  let updates = 0;
  const off = session.subscribe(() => updates++);
  session.setMode('playing');
  assert.equal(updates, 1);
  session.setMode('paused');
  assert.equal(updates, 2);
  off();
  session.setMode('playing');
  assert.equal(updates, 2);
});
