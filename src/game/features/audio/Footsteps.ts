import type { Point, WorldLayout } from '../../../shared/contracts.ts';
import type { EventBus } from '../../../shared/EventBus.ts';
import { surfaceAt } from '../world/surfaceAt.ts';
import { footstepConfig } from './manifest.ts';

/** Measures resolved displacement, so walls and turning in place do not produce steps. */
export class Footsteps {
  #previous: Point | undefined;
  #distance = 0;
  #layout: WorldLayout;
  #bus: EventBus;
  constructor(layout: WorldLayout, bus: EventBus) {
    this.#layout = layout;
    this.#bus = bus;
  }
  update(position: Point, running: boolean, blocked: boolean) {
    const distance = this.#previous
      ? Math.hypot(position.x - this.#previous.x, position.y - this.#previous.y)
      : 0;
    this.#previous = { x: position.x, y: position.y };
    if (blocked || distance > footstepConfig.teleportDistance) {
      this.#distance = 0;
      return;
    }
    this.#distance += distance;
    const stride = running ? footstepConfig.runStride : footstepConfig.walkStride;
    if (this.#distance >= stride) {
      this.#distance %= stride;
      this.#bus.emit('audio:cue', {
        id: 'player:footstep',
        surface: surfaceAt(this.#layout, position),
      });
    }
  }
  reset() {
    this.#previous = undefined;
    this.#distance = 0;
  }
}
