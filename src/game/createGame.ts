import type { AppServices } from '../shared/services.ts';
import Phaser from 'phaser';
import { colors } from '../theme/theme.ts';
import { CityScene } from './scenes/CityScene.ts';

export function createGame(
  host: HTMLElement,
  services: AppServices,
  audioContext?: AudioContext | false,
) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: host,
    backgroundColor: colors.asphalt,
    pixelArt: true,
    audio:
      audioContext === false ? { noAudio: true } : audioContext ? { context: audioContext } : {},
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: host.clientWidth, height: host.clientHeight },
    physics: { default: 'arcade', arcade: { debug: false, gravity: { x: 0, y: 0 } } },
    scene: new CityScene(services),
    input: { keyboard: true },
    render: { antialias: false },
  });
}
