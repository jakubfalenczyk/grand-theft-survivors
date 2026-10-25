import Phaser from 'phaser';
import type { WorldLayout } from '../../../shared/contracts.ts';
import type { PlayerController } from '../player/PlayerController.ts';
import type { AppServices } from '../../../shared/services.ts';
import { CombatSimulation } from './CombatSimulation.ts';
import { CombatRenderer } from './CombatRenderer.ts';
import { validPoint } from './geometry.ts';

export class CombatFeature {
  readonly simulation: CombatSimulation;
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
    this.player = player;
    this.services = services;
    this.simulation = new CombatSimulation({
      buildings: layout.buildings,
      width: layout.bounds.width,
      height: layout.bounds.height,
    });
    Object.assign(this.simulation.player, player.getSnapshot());
    const origin = player.getSnapshot();
    for (const [kind, faction, offset] of [
      ['civilian', 'civilian', -90],
      ['melee', 'docklands', -460],
    ] as const) {
      const point = { x: origin.x, y: origin.y + offset };
      if (validPoint(point, this.simulation.world))
        this.simulation.spawn(kind, faction, point, kind === 'melee');
    }
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
    sim.advance(delta, blocked, (dt) => {
      for (const actor of sim.actors)
        if (actor.active && actor.hostile) {
          sim.move(actor, sim.player, 65, dt);
          sim.attack(actor);
        }
    });
    if (sim.player.health <= 0 && this.services.session.state.mode !== 'dead')
      this.services.session.setMode('dead');
    this.renderer.update();
  }
  getSnapshot() {
    const sim = this.simulation;
    return {
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
  destroy() {
    this.renderer.destroy();
    this.#keyboard.removeKey(this.#engageKey, true);
  }
}
