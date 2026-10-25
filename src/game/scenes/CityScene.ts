import { AudioDirector, preloadAudio } from '../features/audio/AudioDirector.ts';
import { Footsteps } from '../features/audio/Footsteps.ts';
import type { AppServices } from '../../shared/services.ts';
import type { MapId, WorldLayout } from '../../shared/contracts.ts';
import type { GameSession } from '../../shared/GameSession.ts';
import type { EventBus } from '../../shared/EventBus.ts';
import Phaser from 'phaser';
import { EVENTS } from '../../shared/events.ts';
import { GAME } from '../config.ts';
import { PlayerController } from '../features/player/PlayerController.ts';
import { generateMap } from '../features/world/generateCity.ts';
import { createWorldColliders } from '../features/world/createWorldColliders.ts';
import { WorldRenderer } from '../features/world/WorldRenderer.ts';
import { WORLD_INSET } from '../features/world/validateMap.ts';
import { MapCatalog } from '../features/world/maps/catalog.ts';
import { releaseMapTextures } from '../features/world/mapTextures.ts';
import { districtAt } from '../features/world/districtAt.ts';
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
  readonly catalog: MapCatalog;
  constructor(services: AppServices, catalog = new MapCatalog()) {
    super(GAME.scene);
    this.catalog = catalog;
    this.services = services;
    this.session = services.session;
    this.bus = services.bus;
  }
  init(data: { layout?: WorldLayout } = {}) {
    this.layout =
      data.layout ?? generateMap(this.catalog.get(this.layout?.mapId ?? this.catalog.initialId));
  }
  preload() {
    preloadAudio(this);
  }
  create() {
    this.audioDirector = new AudioDirector(this, this.services);
    this.footsteps = new Footsteps(this.layout, this.bus);
    this.worldRenderer = new WorldRenderer(this, this.layout);
    const spawn = this.layout.spawns[0];
    this.playerController = new PlayerController(this, spawn);
    this.physics.world.setBounds(
      WORLD_INSET,
      WORLD_INSET,
      this.layout.bounds.width - WORLD_INSET * 2,
      this.layout.bounds.height - WORLD_INSET * 2,
    );
    const blockers = createWorldColliders(this, this.layout);
    this.physics.add.collider(this.playerController.sprite, blockers);
    this.follow = attachFollowCamera(
      this,
      this.playerController.sprite,
      this.session,
      this.layout.bounds,
    );
    this.lastHud = -Infinity;
    const reset = () => {
      this.playerController.reset();
      this.footsteps.reset();
      this.follow.camera.centerOn(spawn.x, spawn.y);
      this.session.setMode('playing');
      this.publishSnapshot();
    };
    const onBlur = () => {
      this.playerController.stop();
      this.session.setMode('paused');
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    const loadMap = (id: MapId) => {
      if (this.session.state.mode === 'loading') return;
      let layout: WorldLayout;
      try {
        // Prepare and validate before shutting down the playable map.
        layout = generateMap(this.catalog.get(id));
      } catch (error) {
        this.bus.emit('game:map-error', error instanceof Error ? error.message : String(error));
        return;
      }
      this.session.setMode('loading');
      this.playerController.stop();
      this.scene.restart({ layout });
    };
    const cleanups = [
      this.bus.on('command:load-map', loadMap),
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
    const shutdown = () => {
      this.events.off(Phaser.Scenes.Events.SHUTDOWN, shutdown);
      this.events.off(Phaser.Scenes.Events.DESTROY, shutdown);
      cleanups.forEach((cleanup) => cleanup());
      this.game.events.off(Phaser.Core.Events.BLUR, onBlur);
      this.follow.destroy();
      this.audioDirector.destroy();
      this.playerController.destroy();
      releaseMapTextures(this, this.layout);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, shutdown);
    this.events.once(Phaser.Scenes.Events.DESTROY, shutdown);
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
      mapId: this.layout.mapId,
      district: districtAt(this.layout.districts, player.x, player.y).id,
      seed: this.layout.seed,
      buildings: this.layout.buildings.length,
    };
  }
  publishSnapshot() {
    this.bus.emit(EVENTS.SNAPSHOT, this.getSnapshot());
  }
}
