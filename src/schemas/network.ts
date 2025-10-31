/**
 * Network Schema - Represents the social network structure
 */

import { Node } from './node';

export type NetworkType = 'small-world' | 'scale-free' | 'random';

export interface Edge {
  source: string;  // Node ID
  target: string;  // Node ID
  trust_weight: number; // 0 to 1
}

export interface Network {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    type: NetworkType;
    size: number;
    avg_degree: number;
    created_at: string;
  };
}

export interface NetworkConfig {
  size: number;
  type: NetworkType;
  identity_distribution: Record<string, number>; // identity_class -> proportion
  avg_degree?: number;
}

