export const PLAYER = Object.freeze({
  walkSpeed: 105,
  runSpeed: 176,
  turnSpeed: 4.8,
  walkAnimationRate: 10,
  runAnimationRate: 15,
  initialHeading: -Math.PI / 2,
});

/** Ground footprint relative to the sprite's centered world position. */
export const PLAYER_FOOTPRINT = Object.freeze({ x: -5, y: -3, w: 10, h: 10 });
