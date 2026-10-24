import type Phaser from 'phaser';
import type { BuildingData } from '../../../shared/contracts.ts';
export interface RenderedBuilding extends BuildingData {
  material: { light: number; dark: number };
  image: Phaser.GameObjects.Image;
  facade: Phaser.GameObjects.Graphics;
}
