/**
 * Network Pipeline - High-level functions for network operations
 */

import { generateNetwork } from '../algorithms/network-generation';
import { Network, NetworkConfig } from '../schemas/network';

/**
 * Create a default network configuration
 */
export function getDefaultNetworkConfig(): NetworkConfig {
  return {
    size: 50,
    type: 'small-world',
    identity_distribution: {
      urban_professional: 0.25,
      university_student: 0.20,
      rural_traditional: 0.20,
      suburban_family: 0.20,
      tech_worker: 0.15,
    },
    avg_degree: 5,
  };
}

/**
 * Create a network from configuration
 */
export function createNetwork(config?: Partial<NetworkConfig>): Network {
  const fullConfig = { ...getDefaultNetworkConfig(), ...config };
  return generateNetwork(fullConfig);
}

/**
 * Reset network state (clear all infections)
 */
export function resetNetworkState(network: Network): Network {
  return {
    ...network,
    nodes: network.nodes.map(node => ({
      ...node,
      state: 'susceptible',
      current_beliefs: [],
      exposure_history: [],
    })),
  };
}

/**
 * Get network statistics
 */
export function getNetworkStats(network: Network) {
  const totalNodes = network.nodes.length;
  const totalEdges = network.edges.length;
  
  const stateCount = network.nodes.reduce((acc, node) => {
    acc[node.state] = (acc[node.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const identityCount = network.nodes.reduce((acc, node) => {
    acc[node.identity_class] = (acc[node.identity_class] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalNodes,
    totalEdges,
    avgDegree: network.metadata.avg_degree,
    stateCount,
    identityCount,
    infectionRate: (stateCount['infected'] || 0) / totalNodes,
  };
}

