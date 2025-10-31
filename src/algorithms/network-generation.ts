/**
 * Network Generation Algorithm
 * Generates social networks with various topologies and trust relationships
 */

import { Node, IdentityClass, IDENTITY_PROFILES, NodeAttributes } from '../schemas/node';
import { Edge, Network, NetworkConfig, NetworkType } from '../schemas/network';

/**
 * Generate a random value within a range
 */
function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Add Gaussian noise to a value
 */
function addNoise(value: number, noiseLevel: number = 0.1): number {
  const noise = (Math.random() - 0.5) * 2 * noiseLevel;
  return Math.max(0, Math.min(1, value + noise));
}

/**
 * Create a node with attributes based on identity class
 */
function createNode(id: string, identityClass: IdentityClass): Node {
  const profile = IDENTITY_PROFILES[identityClass];
  
  const attributes: NodeAttributes = {
    political_leaning: randomInRange(...profile.political_leaning),
    critical_thinking: randomInRange(...profile.critical_thinking),
    emotional_susceptibility: randomInRange(...profile.emotional_susceptibility),
    education_level: randomInRange(...profile.education_level),
    social_activity: randomInRange(...profile.social_activity),
  };

  return {
    id,
    identity_class: identityClass,
    attributes,
    trust_network: {},
    current_beliefs: [],
    exposure_history: [],
    state: 'susceptible',
  };
}

/**
 * Generate nodes based on identity distribution
 */
function generateNodes(size: number, distribution: Record<string, number>): Node[] {
  const nodes: Node[] = [];
  let nodeIndex = 0;

  for (const [identityClass, proportion] of Object.entries(distribution)) {
    const count = Math.floor(size * proportion);
    for (let i = 0; i < count; i++) {
      nodes.push(createNode(`node_${nodeIndex}`, identityClass as IdentityClass));
      nodeIndex++;
    }
  }

  // Fill remaining nodes with random identity classes
  while (nodes.length < size) {
    const identityClasses = Object.keys(distribution) as IdentityClass[];
    const randomClass = identityClasses[Math.floor(Math.random() * identityClasses.length)];
    nodes.push(createNode(`node_${nodeIndex}`, randomClass));
    nodeIndex++;
  }

  return nodes;
}

/**
 * Calculate trust weight between two nodes
 */
function calculateTrustWeight(nodeA: Node, nodeB: Node): number {
  let baseTrust = 0.5;

  // Homophily bonus (same identity class)
  if (nodeA.identity_class === nodeB.identity_class) {
    baseTrust += 0.2;
  }

  // Political alignment bonus
  const politicalDistance = Math.abs(
    nodeA.attributes.political_leaning - nodeB.attributes.political_leaning
  );
  const alignmentBonus = (1 - politicalDistance) * 0.3;
  baseTrust += alignmentBonus;

  // Add some noise
  baseTrust = addNoise(baseTrust, 0.15);

  return Math.max(0.1, Math.min(0.95, baseTrust));
}

/**
 * Generate random network (Erdős-Rényi)
 */
function generateRandomEdges(nodes: Node[], avgDegree: number = 5): Edge[] {
  const edges: Edge[] = [];
  const n = nodes.length;
  const p = avgDegree / (n - 1); // Connection probability

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < p) {
        const trust = calculateTrustWeight(nodes[i], nodes[j]);
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          trust_weight: trust,
        });

        // Update trust networks
        nodes[i].trust_network[nodes[j].id] = trust;
        nodes[j].trust_network[nodes[i].id] = trust;
      }
    }
  }

  return edges;
}

/**
 * Generate small-world network (Watts-Strogatz)
 */
function generateSmallWorldEdges(nodes: Node[], k: number = 6, p: number = 0.1): Edge[] {
  const edges: Edge[] = [];
  const n = nodes.length;

  // Create ring lattice
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const neighbor = (i + j) % n;
      const trust = calculateTrustWeight(nodes[i], nodes[neighbor]);
      
      edges.push({
        source: nodes[i].id,
        target: nodes[neighbor].id,
        trust_weight: trust,
      });

      nodes[i].trust_network[nodes[neighbor].id] = trust;
      nodes[neighbor].trust_network[nodes[i].id] = trust;
    }
  }

  // Rewire edges with probability p
  const edgesToRewire = [...edges];
  for (const edge of edgesToRewire) {
    if (Math.random() < p) {
      const sourceNode = nodes.find(n => n.id === edge.source)!;
      let newTargetIndex = Math.floor(Math.random() * n);
      
      // Avoid self-loops and duplicate edges
      while (
        newTargetIndex === nodes.findIndex(n => n.id === edge.source) ||
        sourceNode.trust_network[nodes[newTargetIndex].id] !== undefined
      ) {
        newTargetIndex = Math.floor(Math.random() * n);
      }

      const newTarget = nodes[newTargetIndex];
      const trust = calculateTrustWeight(sourceNode, newTarget);

      edge.target = newTarget.id;
      edge.trust_weight = trust;

      sourceNode.trust_network[newTarget.id] = trust;
      newTarget.trust_network[sourceNode.id] = trust;
    }
  }

  return edges;
}

/**
 * Generate scale-free network (Barabási-Albert)
 */
function generateScaleFreeEdges(nodes: Node[], m: number = 3): Edge[] {
  const edges: Edge[] = [];
  
  // Start with a small complete graph
  const m0 = Math.min(m + 1, nodes.length);
  for (let i = 0; i < m0; i++) {
    for (let j = i + 1; j < m0; j++) {
      const trust = calculateTrustWeight(nodes[i], nodes[j]);
      edges.push({
        source: nodes[i].id,
        target: nodes[j].id,
        trust_weight: trust,
      });

      nodes[i].trust_network[nodes[j].id] = trust;
      nodes[j].trust_network[nodes[i].id] = trust;
    }
  }

  // Add remaining nodes with preferential attachment
  for (let i = m0; i < nodes.length; i++) {
    const newNode = nodes[i];
    const degrees = nodes.map(n => Object.keys(n.trust_network).length);
    const totalDegree = degrees.reduce((a, b) => a + b, 0);

    const connected = new Set<number>();
    
    // Connect to m existing nodes
    while (connected.size < Math.min(m, i)) {
      let randomValue = Math.random() * totalDegree;
      let targetIndex = 0;

      for (let j = 0; j < i; j++) {
        randomValue -= degrees[j];
        if (randomValue <= 0) {
          targetIndex = j;
          break;
        }
      }

      if (!connected.has(targetIndex)) {
        connected.add(targetIndex);
        const targetNode = nodes[targetIndex];
        const trust = calculateTrustWeight(newNode, targetNode);

        edges.push({
          source: newNode.id,
          target: targetNode.id,
          trust_weight: trust,
        });

        newNode.trust_network[targetNode.id] = trust;
        targetNode.trust_network[newNode.id] = trust;
      }
    }
  }

  return edges;
}

/**
 * Main network generation function
 */
export function generateNetwork(config: NetworkConfig): Network {
  const nodes = generateNodes(config.size, config.identity_distribution);
  
  let edges: Edge[];
  switch (config.type) {
    case 'small-world':
      edges = generateSmallWorldEdges(nodes, 6, 0.1);
      break;
    case 'scale-free':
      edges = generateScaleFreeEdges(nodes, 3);
      break;
    case 'random':
    default:
      edges = generateRandomEdges(nodes, config.avg_degree || 5);
      break;
  }

  const avgDegree = (edges.length * 2) / nodes.length;

  return {
    nodes,
    edges,
    metadata: {
      type: config.type,
      size: config.size,
      avg_degree: avgDegree,
      created_at: new Date().toISOString(),
    },
  };
}

