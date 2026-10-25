import Phaser from 'phaser';
import type { RenderedBuilding } from './types.ts';
import { projectPoint } from '../../camera/projection.ts';
import { worldInk, toPhaserColor } from '../../../theme/theme.ts';
import { DEPTH } from '../../config.ts';
const ink = Object.fromEntries(
  Object.entries(worldInk).map(([key, value]) => [key, toPhaserColor(value)]),
);

export class BuildingRenderer {
  buildings: RenderedBuilding[];
  constructor(_scene: Phaser.Scene, buildings: RenderedBuilding[]) {
    this.buildings = buildings;
    for (const b of buildings) {
      // Taller structures cover lower rooftops as well as the ground plane.
      b.facade.setDepth(DEPTH.building + b.height);
      b.image.setDepth(DEPTH.building + b.height + 0.1);
    }
  }

  update(camera: Phaser.Cameras.Scene2D.Camera) {
    const cx = camera.midPoint.x,
      cy = camera.midPoint.y;
    const view = camera.worldView;
    for (const b of this.buildings) {
      const roof = projectPoint(b.x, b.y, b.height, cx, cy);
      const right = roof.x + b.w * roof.scale,
        bottom = roof.y + b.h * roof.scale;
      const left = Math.min(b.x, roof.x),
        top = Math.min(b.y, roof.y);
      const visible =
        Math.max(b.x + b.w, right) >= view.x &&
        left <= view.right &&
        Math.max(b.y + b.h, bottom) >= view.y &&
        top <= view.bottom;
      b.image.setVisible(visible);
      b.facade.setVisible(visible).clear();
      if (!visible) continue;
      b.image.setPosition(roof.x, roof.y).setDisplaySize(b.w * roof.scale, b.h * roof.scale);
      if (cy < b.y) this.drawFace(b, b.x, b.y, b.x + b.w, b.y, cx, cy, false);
      if (cy > b.y + b.h) this.drawFace(b, b.x + b.w, b.y + b.h, b.x, b.y + b.h, cx, cy, false);
      if (cx < b.x) this.drawFace(b, b.x, b.y + b.h, b.x, b.y, cx, cy, true);
      if (cx > b.x + b.w) this.drawFace(b, b.x + b.w, b.y, b.x + b.w, b.y + b.h, cx, cy, true);
    }
  }

  drawFace(
    b: RenderedBuilding,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    side: boolean,
  ) {
    const g = b.facade;
    const point = (u: number, z: number) =>
      projectPoint(ax + (bx - ax) * u, ay + (by - ay) * u, z, cx, cy);
    const quad = (u1: number, u2: number, z1: number, z2: number, color: number, alpha = 1) => {
      g.fillStyle(color, alpha);
      g.fillPoints(
        [point(u1, z1), point(u2, z1), point(u2, z2), point(u1, z2)].map(
          (p) => new Phaser.Geom.Point(p.x, p.y),
        ),
        true,
      );
    };
    const floors = b.floors,
      floorHeight = b.height / floors;
    const columns = Math.max(3, Math.floor(Math.hypot(bx - ax, by - ay) / 15));
    const base = side ? b.material.dark : b.material.light;
    quad(0, 1, 0, b.height, base);
    const length = Math.hypot(bx - ax, by - ay);
    // Staggered masonry joints stay on the projected wall plane.
    for (let z = 6; z < b.height - 4; z += 6) {
      quad(0, 1, z, z + 0.5, ink.mortar, 0.35);
      for (let x = (Math.floor(z / 6) % 2) * 6; x < length; x += 12) {
        quad(x / length, Math.min(1, (x + 0.5) / length), z - 5, z, ink.mortar, 0.3);
      }
    }
    for (let row = 0; row < floors; row++) {
      const z = row * floorHeight;
      // Window rows and horizontal sills remain attached to the same wall plane.
      quad(0, 1, z, z + 1.5, ink.deep, 0.75);
      quad(0, 1, z + 1.5, z + 2.5, ink.light, 0.4);
      for (let col = 0; col < columns; col++) {
        const u = (col + 0.22) / columns,
          v = (col + 0.75) / columns;
        quad(u, v, z + floorHeight * 0.28, z + floorHeight * 0.76, ink.deep);
        quad(
          u + 0.012,
          v - 0.012,
          z + floorHeight * 0.33,
          z + floorHeight * 0.7,
          (row + col + b.floors) % 7 === 0
            ? ink['window-lit']
            : side
              ? ink['glass-deep']
              : ink['glass-light'],
        );
        quad(u, v, z + floorHeight * 0.25, z + floorHeight * 0.3, ink.detail, 0.65);
        quad(
          (u + v) / 2,
          (u + v) / 2 + 0.012,
          z + floorHeight * 0.32,
          z + floorHeight * 0.74,
          base,
        );
      }
    }
    // Dark foundation and a contrasting cornice anchor the wall to street and roof.
    quad(0, 1, 0, 4, ink.deep);
    quad(0, 1, b.height - 2, b.height - 0.5, ink.dark);
    quad(0, 1, b.height - 0.5, b.height, ink.light);
    g.lineStyle(1, ink.deep, 0.8);
    const a = point(0, 0),
      ar = point(0, b.height),
      br = point(1, b.height);
    g.lineBetween(a.x, a.y, ar.x, ar.y);
    g.lineBetween(ar.x, ar.y, br.x, br.y);
  }
}
