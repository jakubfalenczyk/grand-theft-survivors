import type Phaser from 'phaser';
import type { WorldLayout } from '../../../shared/contracts.ts';
import type { RenderedBuilding } from './types.ts';
import { toPhaserColor } from '../../../theme/theme.ts';
import { DEPTH } from '../../config.ts';
import { BuildingRenderer } from './BuildingRenderer.ts';
import { mapTexturePrefix } from './mapTextures.ts';
import { DISTRICTS } from './districts.ts';
import { createGroundTexture } from './createGroundTexture.ts';
import { createRoofTexture } from './createRoofTexture.ts';
import { createTreeTexture } from './createPropTextures.ts';

export class WorldRenderer {
  buildings: RenderedBuilding[];
  buildingRenderer: BuildingRenderer;
  constructor(scene: Phaser.Scene, layout: WorldLayout) {
    const groundKey = createGroundTexture(scene, layout);
    scene.add.image(0, 0, groundKey).setOrigin(0).setDepth(DEPTH.ground);
    const treeKey = createTreeTexture(scene);
    layout.trees.forEach((tree) =>
      scene.add.image(tree.x, tree.y, treeKey).setDisplaySize(38, 42).setDepth(DEPTH.trees),
    );
    // Renderer-owned copies: adding GameObjects never mutates the generated layout.
    this.buildings = layout.buildings.map((building) => {
      const district = DISTRICTS.find((d) => d.id === building.district);
      if (!district) throw new Error(`Unknown district ${building.district}`);
      const material = district.material;
      return {
        ...building,
        facade: scene.add.graphics(),
        material: { light: toPhaserColor(material.light), dark: toPhaserColor(material.dark) },
        image: scene.add
          .image(
            building.x,
            building.y,
            createRoofTexture(scene, building, layout.seed, mapTexturePrefix(layout)),
          )
          .setOrigin(0),
      };
    });
    this.buildingRenderer = new BuildingRenderer(scene, this.buildings);
  }
  update(camera: Phaser.Cameras.Scene2D.Camera) {
    this.buildingRenderer.update(camera);
  }
  getViews() {
    return this.buildings
      .filter((b) => b.image.visible)
      .map((b) => ({
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        height: b.height,
        roofX: b.image.x,
        roofY: b.image.y,
        scale: b.image.displayWidth / b.w,
      }));
  }
}
