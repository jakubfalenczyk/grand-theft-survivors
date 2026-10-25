import Phaser from 'phaser';
import '../../src/theme/index.css';
import '../../src/ui/styles/layout.css';
import '../../src/ui/styles/game.css';
import { createGame } from '../../src/game/createGame.ts';
import { createInterface } from '../../src/ui/createInterface.ts';
import { GameSession } from '../../src/shared/GameSession.ts';
import { createEventBus } from '../../src/shared/EventBus.ts';
import { AudioSettings } from '../../src/shared/audio/AudioSettings.ts';
import { MapCatalog } from '../../src/game/features/world/maps/catalog.ts';
import { CityScene } from '../../src/game/scenes/CityScene.ts';
import { GAME } from '../../src/game/config.ts';
import { installDebugBridge } from '../../src/app/debug.ts';
import { mapA, mapB } from './maps.ts';
import { element } from '../../src/ui/dom.ts';
import type { EventBus } from '../../src/shared/EventBus.ts';
import type { AppEvents } from '../../src/shared/contracts.ts';

const transport = createEventBus();
let subscriptions = 0;
const bus: EventBus = {
  on<K extends keyof AppEvents>(name: K, handler: (payload: AppEvents[K]) => void) {
    subscriptions++;
    const off = transport.on(name, handler);
    return () => {
      subscriptions--;
      off();
    };
  },
  emit: transport.emit,
  destroy: transport.destroy,
};
const session = new GameSession(),
  audio = new AudioSettings();
const services = { session, bus, audio };
createInterface(element(document, '#app'), services);
const game = createGame(
  element(document, '#game'),
  services,
  undefined,
  new MapCatalog([mapA, mapB]),
);
installDebugBridge(game, session);
let loads = 0;
let oldSceneObjects: Phaser.GameObjects.GameObject[] = [];
let oldPhysics: Phaser.Physics.Arcade.Body[] = [];
let oldAudio: CityScene['audioDirector'] | undefined;
let oldKeyboard: Phaser.Input.Keyboard.Key[] = [];
bus.on('game:world-ready', () => {
  session.setMode('playing');
  const scene = game.scene.getScene(GAME.scene);
  if (!(scene instanceof CityScene)) throw new Error('Expected city scene');
  scene.physics.world.once(Phaser.Physics.Arcade.Events.WORLD_STEP, () => {
    const body = scene.playerController.sprite.body;
    if (!(body instanceof Phaser.Physics.Arcade.Body))
      throw new Error('Expected dynamic player body');
    const metrics = {
      mapId: scene.layout.mapId,
      bounds: scene.layout.bounds,
      physicsBounds: scene.physics.world.bounds,
      cameraBounds: scene.cameras.main.getBounds(),
      textures: game.textures.getTextureKeys().sort(),
      objects: scene.children.length,
      bodies: scene.physics.world.bodies.size,
      staticBodies: scene.physics.world.staticBodies.size,
      colliders: scene.physics.world.colliders.getActive().length,
      blurListeners: game.events.listenerCount(Phaser.Core.Events.BLUR),
      subscriptions,
      oldObjectsAlive: oldSceneObjects.filter((object) => object.scene).length,
      oldBodiesAlive: oldPhysics.filter((body) => body.enable).length,
      oldKeysAlive: oldKeyboard.filter((key) => key.plugin).length,
      oldAudioActive: oldAudio?.getSnapshot().active.length ?? 0,
      audioCached: scene.audioDirector.getSnapshot().cached,
      material: scene.worldRenderer.buildings[0].district,
      roofKey: scene.worldRenderer.buildings[0].image.texture.key,
      groundSize: [
        game.textures.get(`map:${scene.layout.mapId}:${scene.layout.seed}:ground`).getSourceImage()
          .width,
        game.textures.get(`map:${scene.layout.mapId}:${scene.layout.seed}:ground`).getSourceImage()
          .height,
      ],
    };
    oldSceneObjects = [...scene.children.list];
    oldPhysics = [body];
    oldAudio = scene.audioDirector;
    oldKeyboard = scene.input.keyboard!.keys.filter((key) => Boolean(key));
    element(document, '#metrics').textContent = JSON.stringify(metrics);
    element(document, '#loads').textContent = String(++loads);
  });
});
for (const [button, id] of [
  ['load-a', mapA.id],
  ['load-b', mapB.id],
  ['load-invalid', 'missing'],
]) {
  element(document, `#${button}`).addEventListener('click', () => bus.emit('command:load-map', id));
}
