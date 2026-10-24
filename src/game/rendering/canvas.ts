import type Phaser from 'phaser';
export function rect(
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

export function createCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
) {
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`Cannot create canvas texture: ${key}`);
  return texture;
}
