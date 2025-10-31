/**
 * A* Algorithm for finding optimal influence paths
 * Finds the most effective path to influence a target node
 * 
 * Supports two modes:
 * 1. Social Trust: Pure node-to-node trust pathfinding
 * 2. Meme Trust: Considers meme acceptance probability
 */

import { Node } from '../schemas/node';
import { Meme } from '../schemas/meme';
import { Network } from '../schemas/network';
import { getNeighbors } from './propagation';
import {
  AStarMode,
  calculateSocialTrustCost,
  calculateMemeTrustCost,
  socialTrustHeuristic,
  memeTrustHeuristic,
  explainPathCost,
} from './astar-modes';

/**
 * Priority Queue implementation for A*
 */
class PriorityQueue<T> {
  private items: Array<{ priority: number; item: T }> = [];

  push(priority: number, item: T): void {
    this.items.push({ priority, item });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  pop(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * State for A* search
 */
export interface AStarState {
  currentNode: Node;
  path: string[];
  influencedNodes: Set<string>;
  cumulativeCost: number;
}

/**
 * A* visualization frame
 */
export interface AStarFrame {
  step: number;
  currentNode: string;
  openSet: string[];
  closedSet: string[];
  path: string[];
  gScores: Record<string, number>;
  fScores: Record<string, number>;
  message: string;
}

/**
 * A* result
 */
export interface AStarResult {
  success: boolean;
  path: string[];
  cost: number;
  exploredCount: number;
  frames: AStarFrame[];
  mode: AStarMode;
  pathExplanations?: string[];
}

/**
 * Calculate heuristic distance to target (mode-dependent)
 */
export function calculateHeuristic(
  currentNode: Node,
  targetNode: Node,
  meme: Meme,
  network: Network,
  mode: AStarMode
): number {
  if (mode === 'social_trust') {
    return socialTrustHeuristic(currentNode, targetNode, network);
  } else {
    return memeTrustHeuristic(currentNode, targetNode, meme, network);
  }
}

/**
 * A* algorithm for finding optimal influence path
 * 
 * @param mode - 'social_trust' for pure social network pathfinding, 
 *               'meme_trust' for meme acceptance-based pathfinding
 */
export function astarInfluencePath(
  network: Network,
  startNodeId: string,
  targetNodeId: string,
  meme: Meme,
  mode: AStarMode = 'meme_trust'
): AStarResult {
  const startNode = network.nodes.find(n => n.id === startNodeId);
  const targetNode = network.nodes.find(n => n.id === targetNodeId);

  if (!startNode || !targetNode) {
    return {
      success: false,
      path: [],
      cost: Infinity,
      exploredCount: 0,
      frames: [],
      mode,
    };
  }

  // Priority queue: (fScore, nodeId, path, gScore)
  const openSet = new PriorityQueue<{
    nodeId: string;
    path: string[];
    gScore: number;
  }>();

  openSet.push(0, {
    nodeId: startNodeId,
    path: [startNodeId],
    gScore: 0,
  });

  // Track best known cost to each node
  const gScores: Record<string, number> = { [startNodeId]: 0 };
  const fScores: Record<string, number> = {
    [startNodeId]: calculateHeuristic(startNode, targetNode, meme, network, mode),
  };

  // For visualization and explanation
  const frames: AStarFrame[] = [];
  const closedSet = new Set<string>();
  const pathExplanations: string[] = [];
  let step = 0;

  while (!openSet.isEmpty()) {
    const current = openSet.pop()!;
    const currentNode = network.nodes.find(n => n.id === current.nodeId)!;

    // Add visualization frame
    frames.push({
      step: step++,
      currentNode: current.nodeId,
      openSet: [], // Will be populated
      closedSet: Array.from(closedSet),
      path: current.path,
      gScores: { ...gScores },
      fScores: { ...fScores },
      message: `Exploring node ${current.nodeId}`,
    });

    // Check if reached target
    if (current.nodeId === targetNodeId) {
      return {
        success: true,
        path: current.path,
        cost: current.gScore,
        exploredCount: closedSet.size,
        frames,
        mode,
        pathExplanations,
      };
    }

    closedSet.add(current.nodeId);

    // Expand neighbors
    const neighbors = getNeighbors(network, current.nodeId);

    for (const neighbor of neighbors) {
      if (closedSet.has(neighbor.id)) {
        continue;
      }

      // Calculate cost to reach neighbor (mode-dependent)
      const trustWeight = currentNode.trust_network[neighbor.id];
      
      let stepCost: number;
      if (mode === 'social_trust') {
        stepCost = calculateSocialTrustCost(currentNode, neighbor, trustWeight);
      } else {
        stepCost = calculateMemeTrustCost(neighbor, meme, currentNode, trustWeight);
      }
      
      const tentativeGScore = current.gScore + stepCost;

      // Check if this path is better
      if (gScores[neighbor.id] === undefined || tentativeGScore < gScores[neighbor.id]) {
        gScores[neighbor.id] = tentativeGScore;
        const hScore = calculateHeuristic(neighbor, targetNode, meme, network, mode);
        const fScore = tentativeGScore + hScore;
        fScores[neighbor.id] = fScore;

        const newPath = [...current.path, neighbor.id];
        
        // Store explanation for this step
        const explanation = explainPathCost(currentNode, neighbor, meme, trustWeight, mode);
        pathExplanations.push(`${currentNode.id} → ${neighbor.id}:\n${explanation}`);
        
        openSet.push(fScore, {
          nodeId: neighbor.id,
          path: newPath,
          gScore: tentativeGScore,
        });
      }
    }
  }

  // No path found
  return {
    success: false,
    path: [],
    cost: Infinity,
    exploredCount: closedSet.size,
    frames,
    mode,
  };
}

// Export mode type for use in components
export type { AStarMode };

