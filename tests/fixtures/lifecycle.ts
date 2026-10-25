import { AudioSettings } from '../../src/shared/audio/AudioSettings.ts';
import Phaser from 'phaser';
import '../../src/theme/index.css';
import '../../src/ui/styles/layout.css';
import '../../src/ui/styles/game.css';
import { createGame } from '../../src/game/createGame.ts';
import { createInterface } from '../../src/ui/createInterface.ts';
import { element } from '../../src/ui/dom.ts';
import { GameSession } from '../../src/shared/GameSession.ts';
import { createEventBus } from '../../src/shared/EventBus.ts';
import { EVENTS } from '../../src/shared/events.ts';
import { CityScene } from '../../src/game/scenes/CityScene.ts';
import { GAME } from '../../src/game/config.ts';
import { installDebugBridge } from '../../src/app/debug.ts';

const session = new GameSession(),
  bus = createEventBus();
const audio = new AudioSettings();
const services = { session, bus, audio };
const ui = createInterface(element(document, '#app'), services);
const game = createGame(ui.host, services);
const removeDebug = installDebugBridge(game, session);
let restarts = 0;
bus.on(EVENTS.WORLD_READY, () => {
  // Game installs its own blur handler after the first Scene.create returns.
  requestAnimationFrame(() => {
    const scene = game.scene.getScene(GAME.scene);
    if (!(scene instanceof CityScene)) throw new Error('Expected the city scene');
    const player = scene.playerController.sprite;
    const roofs = scene.worldRenderer.buildings.map((building) => building.image.texture);
    const sources = [...roofs, game.textures.get('city-tree')].map((texture) =>
      texture.getSourceImage(),
    );
    const sampleRoofs = new Map(
      scene.worldRenderer.buildings.map((building) => [building.district, building.image.texture]),
    );
    const samples = [...sampleRoofs.values(), game.textures.get('city-tree'), player.texture];
    const palette = new Set<number>();
    let fingerprint = 0;
    for (const texture of samples) {
      const canvas = texture.getSourceImage();
      if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Expected canvas art');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Expected a 2D context');
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] === 0) continue;
        const rgb = (pixels[i] << 16) | (pixels[i + 1] << 8) | pixels[i + 2];
        palette.add(rgb);
        fingerprint = (Math.imul(fingerprint, 31) + rgb) >>> 0;
      }
    }
    element(document, '#art-metrics').textContent = JSON.stringify({
      minWidth: Math.min(...sources.map((source) => source.width)),
      minHeight: Math.min(...sources.map((source) => source.height)),
      playerFrame: [player.frame.width, player.frame.height],
      playerDisplay: [player.displayWidth, player.displayHeight],
      playerBody: [player.body?.width, player.body?.height],
      paletteSize: palette.size,
      fingerprint,
      roofs: roofs.length,
    });
    element(document, '#restarts').textContent = String(++restarts);
    element(document, '#textures').textContent = String(game.textures.getTextureKeys().length);
    element(document, '#listeners').textContent = String(
      game.events.listenerCount(Phaser.Core.Events.BLUR),
    );
  });
});
element(document, '#restart-scene').addEventListener('click', () =>
  game.scene.getScene(GAME.scene).scene.restart(),
);

element(document, '#destroy-interface').addEventListener('click', () => {
  removeDebug();
  game.destroy(true);
  ui.destroy();
  audio.destroy();
  session.destroy();
  bus.destroy();
});
