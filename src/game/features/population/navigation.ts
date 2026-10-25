import type { Point } from '../../../shared/contracts.ts';
import { clearSegment, distance, validPoint } from '../combat/geometry.ts';
import type { CombatWorld } from '../combat/types.ts';

export interface WalkNode extends Point {
  readonly id: number;
  readonly exit: boolean;
}
export interface WalkEdge {
  readonly from: number;
  readonly to: number;
  readonly crossing: boolean;
}
export interface WalkGraph {
  readonly nodes: readonly WalkNode[];
  readonly edges: readonly WalkEdge[];
}

/** Graph geometry is map-authored. Buildings only remove obstructed nodes and edges. */
export class Navigation {
  readonly graph: WalkGraph;
  readonly neighbors = new Map<number, { to: number; crossing: boolean }[]>();
  readonly world: CombatWorld;
  constructor(graph: WalkGraph, world: CombatWorld) {
    this.world = world;
    const nodes = graph.nodes.filter((node) => validPoint(node, world));
    const ids = new Set(nodes.map((node) => node.id));
    const edges = graph.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    this.graph = {
      nodes,
      edges: edges.filter((edge) =>
        clearSegment(byId.get(edge.from)!, byId.get(edge.to)!, world, 8),
      ),
    };
    for (const node of nodes) this.neighbors.set(node.id, []);
    for (const edge of this.graph.edges) {
      this.neighbors.get(edge.from)!.push({ to: edge.to, crossing: edge.crossing });
      this.neighbors.get(edge.to)!.push({ to: edge.from, crossing: edge.crossing });
    }
  }
  nearest(point: Point) {
    return (
      this.graph.nodes
        .filter((node) => clearSegment(point, node, this.world, 8))
        .sort((a, b) => distance(point, a) - distance(point, b) || a.id - b.id)[0] ?? null
    );
  }
  route(from: number, to: number): number[] {
    const queue = [from],
      previous = new Map<number, number | null>([[from, null]]);
    for (let i = 0; i < queue.length; i++) {
      const id = queue[i];
      if (id === to) {
        const result: number[] = [];
        let cursor: number | null = id;
        while (cursor !== null) {
          result.unshift(cursor);
          cursor = previous.get(cursor) ?? null;
        }
        return result;
      }
      for (const neighbor of this.neighbors.get(id) ?? [])
        if (!previous.has(neighbor.to)) {
          previous.set(neighbor.to, id);
          queue.push(neighbor.to);
        }
    }
    return [];
  }
  reachable(from: number) {
    const visited = new Set([from]),
      queue = [from];
    for (let i = 0; i < queue.length; i++) {
      for (const edge of this.neighbors.get(queue[i]) ?? [])
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push(edge.to);
        }
    }
    return this.graph.nodes.filter((node) => visited.has(node.id));
  }
  node(id: number) {
    return this.graph.nodes.find((node) => node.id === id);
  }
  isCrossing(from: number, to: number) {
    return this.neighbors.get(from)?.some((edge) => edge.to === to && edge.crossing) ?? false;
  }
}
