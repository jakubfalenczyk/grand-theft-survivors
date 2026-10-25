import Phaser from 'phaser';
import type { WorldLayout } from '../../../shared/contracts.ts';
import type { PlayerController } from '../player/PlayerController.ts';
import type { AppServices } from '../../../shared/services.ts';
import { CombatSimulation } from './CombatSimulation.ts';
import { CombatRenderer } from './CombatRenderer.ts';
import { PopulationDirector } from '../population/PopulationDirector.ts';
import { populationForMap } from '../population/maps/index.ts';

export class CombatFeature {
  readonly simulation: CombatSimulation;
  readonly population: PopulationDirector;
  readonly scene: Phaser.Scene;
  readonly renderer: CombatRenderer;
  #keyboard: Phaser.Input.Keyboard.KeyboardPlugin;
  #engageKey: Phaser.Input.Keyboard.Key;
  readonly player: PlayerController;
  readonly services: AppServices;
  constructor(
    scene: Phaser.Scene,
    layout: WorldLayout,
    player: PlayerController,
    services: AppServices,
  ) {
    this.scene = scene;
    this.player = player;
    this.services = services;
    this.simulation = new CombatSimulation({
      buildings: layout.buildings,
      width: layout.bounds.width,
      height: layout.bounds.height,
    });
    Object.assign(this.simulation.player, player.getSnapshot());
    this.population = new PopulationDirector(
      this.simulation,
      populationForMap(layout.mapId),
      layout.seed,
    );
    this.population.initialize(this.view());
    this.renderer = new CombatRenderer(scene, this.simulation);
    if (!scene.input.keyboard) throw new Error('Combat requires keyboard input');
    this.#keyboard = scene.input.keyboard;
    this.#engageKey = this.#keyboard.addKey('SPACE');
  }
  update(delta: number) {
    const sim = this.simulation,
      blocked = this.services.session.blocked;
    Object.assign(sim.player, this.player.getSnapshot());
    if (!blocked && Phaser.Input.Keyboard.JustDown(this.#engageKey)) sim.engage();
    sim.advance(delta, blocked, (dt) => this.population.update(dt, this.view()));
    if (sim.player.health <= 0 && this.services.session.state.mode !== 'dead')
      this.services.session.setMode('dead');
    this.renderer.update();
  }
  getSnapshot() {
    const sim = this.simulation;
    return {
      ...this.population.snapshot(),
      health: sim.player.health,
      maxHealth: 100,
      xp: sim.xp,
      kills: sim.kills,
      selected: sim.selected,
      preview: sim.preview,
      shots: sim.shots,
      time: sim.time,
      actors: sim.actors.filter((actor) => actor.active).map((actor) => ({ ...actor })),
      projectiles: sim.projectiles
        .filter((shot) => shot.active)
        .map(({ x, y, target }) => ({ x, y, target })),
      actorSlots: sim.actors.length,
      projectileSlots: sim.projectiles.length,
    };
  }
  view() {
    const camera = this.scene.cameras.main;
    return {
      x: camera.scrollX + camera.width / 2 - camera.displayWidth / 2,
      y: camera.scrollY + camera.height / 2 - camera.displayHeight / 2,
      w: camera.displayWidth,
      h: camera.displayHeight,
    };
  }
  destroy() {
    this.population.destroy();
    this.renderer.destroy();
    this.#keyboard.removeKey(this.#engageKey, true);
  }
}
