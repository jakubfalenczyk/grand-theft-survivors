import type { PopulationMap } from '../PopulationDirector.ts';
import type { WalkGraph, WalkNode, WalkEdge } from '../navigation.ts';

/** Sidewalk centers and intersection crossings match Westbridge's authored road grid. */
const sidewalks = [64, 356, 484, 776, 904, 1196, 1324, 1616, 1744, 2036, 2164, 2456] as const;
export function westbridgeWalkGraph(): WalkGraph {
  const nodes: WalkNode[] = [],
    edges: WalkEdge[] = [];
  for (const [row, y] of sidewalks.entries())
    for (const [col, x] of sidewalks.entries()) {
      const id = row * sidewalks.length + col;
      nodes.push({
        id,
        x,
        y,
        exit:
          row === 0 || col === 0 || row === sidewalks.length - 1 || col === sidewalks.length - 1,
      });
      if (col > 0) edges.push({ from: id - 1, to: id, crossing: x - sidewalks[col - 1] === 128 });
      if (row > 0)
        edges.push({
          from: id - sidewalks.length,
          to: id,
          crossing: y - sidewalks[row - 1] === 128,
        });
    }
  return { nodes, edges };
}

export function westbridgePopulation(): PopulationMap {
  return { graph: westbridgeWalkGraph(), gangZone: { x: 0, y: 840, w: 1680, h: 1680 } };
}
