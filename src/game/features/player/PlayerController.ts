import type Phaser from 'phaser';
import type { Point } from '../../../shared/contracts.ts';
import { phaserColors } from '../../../theme/theme.ts';
import { DEPTH } from '../../config.ts';
import { PLAYER, PLAYER_FOOTPRINT } from './config.ts';
import {
  createPlayerTextures,
  PLAYER_FRAME_SIZE,
  PLAYER_DISPLAY_SIZE,
} from './createPlayerTextures.ts';

type PlayerKey =
  'forward' | 'backward' | 'left' | 'right' | 'up' | 'down' | 'arrowLeft' | 'arrowRight' | 'run';
export class PlayerController {
  scene: Phaser.Scene;
  spawn: Point;
  sprite: Phaser.Physics.Arcade.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  keys: Record<PlayerKey, Phaser.Input.Keyboard.Key>;
  heading: number = PLAYER.initialHeading;
  walkTime = 0;
  moving = 0;
  running = false;
  constructor(scene: Phaser.Scene, spawn: Point) {
    this.scene = scene;
    this.spawn = spawn;
    createPlayerTextures(scene);
    this.shadow = scene.add
      .ellipse(spawn.x + 2, spawn.y + 3, 14, 10, phaserColors.asphalt, 0.48)
      .setDepth(DEPTH.playerShadow);
    this.sprite = scene.physics.add
      .sprite(spawn.x, spawn.y, 'player', 0)
      .setScale(PLAYER_DISPLAY_SIZE / PLAYER_FRAME_SIZE)
      .setDepth(DEPTH.player);
    const body = this.sprite.body;
    if (!body) throw new Error('Arcade Physics body is required');
    const density = PLAYER_FRAME_SIZE / PLAYER_DISPLAY_SIZE;
    body
      .setSize(PLAYER_FOOTPRINT.w * density, PLAYER_FOOTPRINT.h * density)
      .setOffset(
        (PLAYER_DISPLAY_SIZE / 2 + PLAYER_FOOTPRINT.x) * density,
        (PLAYER_DISPLAY_SIZE / 2 + PLAYER_FOOTPRINT.y) * density,
      );
    this.sprite.setCollideWorldBounds(true);
    if (!scene.input.keyboard) throw new Error('Keyboard input is required');
    this.keys = scene.input.keyboard.addKeys({
      forward: 'W',
      backward: 'S',
      left: 'A',
      right: 'D',
      up: 'UP',
      down: 'DOWN',
      arrowLeft: 'LEFT',
      arrowRight: 'RIGHT',
      run: 'SHIFT',
    }) as Record<PlayerKey, Phaser.Input.Keyboard.Key>;
    this.reset();
  }
  update(delta: number, blocked: boolean) {
    const dt = Math.min(delta, 50) / 1000,
      k = this.keys;
    this.moving = 0;
    this.running = false;
    if (!blocked) {
      const turn =
        Number(k.right.isDown || k.arrowRight.isDown) - Number(k.left.isDown || k.arrowLeft.isDown);
      this.heading += turn * PLAYER.turnSpeed * dt;
      this.moving =
        Number(k.forward.isDown || k.up.isDown) - Number(k.backward.isDown || k.down.isDown);
      this.running = k.run.isDown && this.moving > 0;
      const speed = this.running ? PLAYER.runSpeed : PLAYER.walkSpeed;
      this.sprite.setVelocity(
        Math.cos(this.heading) * this.moving * speed,
        Math.sin(this.heading) * this.moving * speed,
      );
    } else this.sprite.setVelocity(0, 0);
    this.sprite.rotation = this.heading;
    if (this.moving) {
      this.walkTime += dt * (this.running ? PLAYER.runAnimationRate : PLAYER.walkAnimationRate);
      this.sprite.setFrame(1 + (Math.floor(this.walkTime) % 2));
    } else {
      this.sprite.setFrame(0);
      this.walkTime = 0;
    }
    this.shadow.setPosition(this.sprite.x + 2, this.sprite.y + 3);
  }
  stop() {
    this.sprite.setVelocity(0, 0);
    this.scene.input.keyboard?.resetKeys();
  }
  reset() {
    this.stop();
    this.sprite.setPosition(this.spawn.x, this.spawn.y);
    this.heading = PLAYER.initialHeading;
    this.walkTime = 0;
    this.moving = 0;
    this.running = false;
  }
  destroy() {
    for (const key of Object.values(this.keys))
      if (key.plugin) this.scene.input.keyboard?.removeKey(key, true, true);
  }
  getSnapshot() {
    return {
      x: this.sprite.x,
      y: this.sprite.y,
      heading: this.heading,
      moving: this.moving,
      running: this.running,
    };
  }
}
