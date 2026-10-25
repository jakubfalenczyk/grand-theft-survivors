import { AudioDirector, preloadAudio } from '../features/audio/AudioDirector.ts';
import { Footsteps } from '../features/audio/Footsteps.ts';
import type { AppServices } from '../../shared/services.ts';
import type { WorldLayout } from '../../shared/contracts.ts';
import type { GameSession } from '../../shared/GameSession.ts';
import type { EventBus } from '../../shared/EventBus.ts';
import Phaser from 'phaser';
import { EVENTS } from '../../shared/events.ts';
import { GAME } from '../config.ts';
import { PlayerController } from '../features/player/PlayerController.ts';
import { generateCity } from '../features/world/generateCity.ts';
import { createWorldColliders } from '../features/world/createWorldColliders.ts';
import { WorldRenderer } from '../features/world/WorldRenderer.ts';
import { SPAWN } from '../features/world/config.ts';
import { districtAt } from '../features/world/districts.ts';
import { attachFollowCamera } from '../camera/FollowCamera.ts';

/** Composition only. Features own behavior; UI receives plain data through the bus. */
export class CityScene extends Phaser.Scene {
  audioDirector!: AudioDirector;
  footsteps!: Footsteps;
  services: AppServices;
  session: GameSession;
  bus: EventBus;
  layout!: WorldLayout;
  worldRenderer!: WorldRenderer;
  playerController!: PlayerController;
  follow!: ReturnType<typeof attachFollowCamera>;
  lastHud = -Infinity;
  constructor(services: AppServices) {
    super(GAME.scene);
    this.services = services;
    this.session = services.session;
    this.bus = services.bus;
  }
  preload() {
    preloadAudio(this);
  }
  create() {
    this.audioDirector = new AudioDirector(this, this.services);
    this.layout = generateCity();
    this.footsteps = new Footsteps(this.layout, this.bus);
    this.worldRenderer = new WorldRenderer(this, this.layout);
    this.playerController = new PlayerController(this, SPAWN);
    this.physics.world.setBounds(8, 8, this.layout.size - 16, this.layout.size - 16);
    const blockers = createWorldColliders(this, this.layout);
    this.physics.add.collider(this.playerController.sprite, blockers);
    this.follow = attachFollowCamera(
      this,
      this.playerController.sprite,
      this.session,
      this.layout.size,
    );
    this.lastHud = -Infinity;
    const reset = () => {
      this.playerController.reset();
      this.footsteps.reset();
      this.follow.camera.centerOn(SPAWN.x, SPAWN.y);
      this.session.setMode('playing');
      this.publishSnapshot();
    };
    const onBlur = () => {
      this.playerController.stop();
      this.session.setMode('paused');
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    const cleanups = [
      this.bus.on(EVENTS.RESET_PLAYER, reset),
      this.session.subscribe(() => {
        if (this.input.keyboard) {
          this.input.keyboard.enabled = !this.session.blocked;
          if (this.session.blocked) this.input.keyboard.disableGlobalCapture();
          else this.input.keyboard.enableGlobalCapture();
        }
        if (this.session.blocked) this.playerController.stop();
      }),
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cleanups.forEach((cleanup) => cleanup());
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
      this.follow.destroy();
      this.audioDirector.destroy();
    });
    this.bus.emit(EVENTS.WORLD_READY, this.layout);
    this.publishSnapshot();
  }
  update(time: number, delta: number) {
    this.playerController.update(delta, this.session.blocked);
    this.footsteps.update(
      this.playerController.sprite,
      this.playerController.running,
      this.session.blocked,
    );
    this.worldRenderer.update(this.cameras.main);
    if (time - this.lastHud >= GAME.hudIntervalMs) {
      this.lastHud = time;
      this.publishSnapshot();
    }
  }
  getSnapshot() {
    const player = this.playerController.getSnapshot();
    return {
      ...player,
      district: districtAt(player.x, player.y).id,
      seed: this.layout.seed,
      buildings: this.layout.buildings.length,
    };
  }
  publishSnapshot() {
    this.bus.emit(EVENTS.SNAPSHOT, this.getSnapshot());
  }
}
