import type Phaser from 'phaser';
import { colors, factionTheme, phaserColors, toPhaserColor, tokens } from '../../../theme/theme.ts';
import { t } from '../../../shared/intl/index.ts';
import {
  PLAYER_DISPLAY_SIZE,
  PLAYER_FRAME_SIZE,
  createPlayerTextures,
} from '../player/createPlayerTextures.ts';
import type { CombatSimulation } from './CombatSimulation.ts';

/** Visual slots follow the bounded actor pool; no game objects enter simulation data. */
export class CombatRenderer {
  #sprites: Phaser.GameObjects.Sprite[] = [];
  #labels: Phaser.GameObjects.Text[] = [];
  #marks: Phaser.GameObjects.Graphics;
  readonly scene: Phaser.Scene;
  readonly simulation: CombatSimulation;
  constructor(scene: Phaser.Scene, simulation: CombatSimulation) {
    this.scene = scene;
    this.simulation = simulation;
    createPlayerTextures(scene);
    this.#marks = scene.add.graphics().setDepth(12);
  }
  update() {
    const sim = this.simulation;
    this.#marks.clear();
    sim.actors.forEach((actor, index) => {
      let sprite = this.#sprites[index],
        label = this.#labels[index];
      if (!sprite) {
        sprite = this.scene.add
          .sprite(0, 0, 'player')
          .setScale(PLAYER_DISPLAY_SIZE / PLAYER_FRAME_SIZE)
          .setDepth(10);
        label = this.scene.add
          .text(0, 0, '', {
            fontFamily: tokens.font.mono,
            fontSize: '8px',
            color: colors.concrete,
            backgroundColor: colors.asphalt,
            padding: { x: 2, y: 1 },
          })
          .setOrigin(0.5, 1)
          .setDepth(12);
        this.#sprites.push(sprite);
        this.#labels.push(label);
      }
      sprite.setVisible(actor.active);
      label.setVisible(actor.active);
      if (!actor.active) return;
      const tint =
        actor.faction === 'police'
          ? phaserColors.ultramarine
          : actor.faction === 'civilian'
            ? phaserColors.concrete
            : toPhaserColor(factionTheme('docklands').value);
      sprite.setPosition(actor.x, actor.y).setRotation(actor.heading).setTint(tint);
      sprite.setFrame(Math.floor(sim.time * 7 + actor.id) % 3);
      label
        .setPosition(actor.x, actor.y - 16)
        .setText(t(actor.faction === 'police' ? 'actor.officer' : `actor.${actor.kind}`));
      if (actor.windupUntil)
        this.#marks.lineStyle(1, phaserColors.riot).strokeCircle(actor.x, actor.y, 12);
      if (actor.id === sim.selected || actor.id === sim.preview) {
        const selected = actor.id === sim.selected;
        this.#marks.lineStyle(selected ? 2 : 1, phaserColors.acid);
        this.#marks.strokeTriangle(
          actor.x - 3,
          actor.y - 14,
          actor.x + 3,
          actor.y - 14,
          actor.x,
          actor.y - 10,
        );
        if (selected) this.#marks.strokeCircle(actor.x, actor.y, 10);
      }
      if (actor.health < actor.maxHealth) {
        this.#marks.fillStyle(phaserColors.asphalt).fillRect(actor.x - 9, actor.y + 13, 18, 2);
        this.#marks
          .fillStyle(phaserColors.riot)
          .fillRect(actor.x - 9, actor.y + 13, (18 * actor.health) / actor.maxHealth, 2);
      }
    });
    for (const shot of sim.projectiles)
      if (shot.active) {
        this.#marks
          .fillStyle(shot.target === 0 ? phaserColors.riot : phaserColors.concrete)
          .fillRect(shot.x - 1, shot.y - 1, 2, 2);
      }
  }
  destroy() {
    this.#sprites.forEach((sprite) => sprite.destroy());
    this.#labels.forEach((label) => label.destroy());
    this.#marks.destroy();
  }
}
