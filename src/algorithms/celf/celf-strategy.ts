/**
 * CELF-based Strategies for Influence Maximization
 * Implements CELF and CELF++ algorithms adapted for meme propagation
 */

import { GameState, MoveType } from '../../schemas/game-state';
import { Network } from '../../schemas/network';
import { Node } from '../../schemas/node';
import { Meme } from '../../schemas/meme';
import { calculateAcceptanceProbability } from '../propagation';

interface CELFNode {
  nodeId: string;
  mg1: number;          // Marginal gain w.r.t current seed set
  prevBest: string | null;  // Previous best node
  mg2: number;          // Marginal gain w.r.t seed set + prevBest
  flag: number;         // Last iteration when mg1 was updated
}

/**
 * Estimate expected spread using Monte Carlo simulation
 * This is the influence spread function σ(S) from the papers
 */
function estimateSpread(
  network: Network,
  seedSet: Set<string>,
  meme: Meme,
  simulations: number = 1000
): number {
  let totalSpread = 0;

  for (let sim = 0; sim < simulations; sim++) {
    const infected = new Set<string>(seedSet);
    const queue = Array.from(seedSet);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = network.nodes.find(n => n.id === currentId);
      if (!currentNode) continue;

      // Try to infect neighbors
      for (const [neighborId, trustWeight] of Object.entries(currentNode.trust_network)) {
        if (infected.has(neighborId)) continue;

        const neighbor = network.nodes.find(n => n.id === neighborId);
        if (!neighbor) continue;

        const acceptanceProb = calculateAcceptanceProbability(
          neighbor,
          meme,
          currentNode,
          trustWeight
        );

        // Stochastic activation based on acceptance probability
        if (Math.random() < acceptanceProb) {
          infected.add(neighborId);
          queue.push(neighborId);
        }
      }
    }

    totalSpread += infected.size;
  }

  return totalSpread / simulations;
}

/**
 * Calculate marginal gain: σ(S ∪ {u}) - σ(S)
 * This is the key submodular function
 */
function calculateMarginalGain(
  network: Network,
  seedSet: Set<string>,
  nodeId: string,
  meme: Meme,
  simulations: number = 1000
): number {
  const spreadWithout = estimateSpread(network, seedSet, meme, simulations);
  const newSeedSet = new Set(seedSet);
  newSeedSet.add(nodeId);
  const spreadWith = estimateSpread(network, newSeedSet, meme, simulations);
  
  return spreadWith - spreadWithout;
}

/**
 * CELF Algorithm (Lazy Forward Selection)
 * Exploits submodularity to reduce computations
 */
export function celfSelection(
  network: Network,
  meme: Meme,
  budget: number,
  simulations: number = 1000
): string[] {
  const seeds: string[] = [];
  const seedSet = new Set<string>();
  
  // Priority queue implemented as sorted array
  const Q: CELFNode[] = [];

  // Initialize: compute marginal gain for each node
  console.log('CELF: Initializing marginal gains...');
  for (const node of network.nodes) {
    if (node.state === 'susceptible') {
      const mg = calculateMarginalGain(network, seedSet, node.id, meme, simulations);
      Q.push({
        nodeId: node.id,
        mg1: mg,
        prevBest: null,
        mg2: 0,
        flag: 0
      });
    }
  }

  // Sort by mg1 descending
  Q.sort((a, b) => b.mg1 - a.mg1);

  // Greedy selection with lazy evaluation
  while (seeds.length < budget && Q.length > 0) {
    let recomputations = 0;
    
    while (Q.length > 0) {
      const u = Q[0]; // Top element
      
      // If flag equals current seed set size, this is accurate
      if (u.flag === seeds.length) {
        // Pick this node
        seeds.push(u.nodeId);
        seedSet.add(u.nodeId);
        Q.shift(); // Remove from queue
        console.log(`CELF: Selected seed ${seeds.length}: ${u.nodeId} (mg: ${u.mg1.toFixed(2)})`);
        break;
      }
      
      // Recompute marginal gain (lazy evaluation)
      recomputations++;
      u.mg1 = calculateMarginalGain(network, seedSet, u.nodeId, meme, simulations);
      u.flag = seeds.length;
      
      // Re-sort (in practice, use a heap)
      Q.sort((a, b) => b.mg1 - a.mg1);
    }
    
    console.log(`CELF: Iteration ${seeds.length}, recomputations: ${recomputations}/${network.nodes.length}`);
  }

  return seeds;
}

/**
 * CELF++ Algorithm (Optimized with look-ahead)
 * Further reduces computations by tracking prev_best
 */
export function celfPlusPlusSelection(
  network: Network,
  meme: Meme,
  budget: number,
  simulations: number = 1000
): string[] {
  const seeds: string[] = [];
  const seedSet = new Set<string>();
  let lastSeed: string | null = null;
  let curBest: string | null = null;
  
  const Q: CELFNode[] = [];

  // Initialize
  console.log('CELF++: Initializing with look-ahead...');
  for (const node of network.nodes) {
    if (node.state === 'susceptible') {
      const mg1 = calculateMarginalGain(network, seedSet, node.id, meme, simulations);
      
      let mg2 = 0;
      if (curBest) {
        const tempSet = new Set(seedSet);
        tempSet.add(curBest);
        mg2 = calculateMarginalGain(network, tempSet, node.id, meme, simulations);
      }
      
      Q.push({
        nodeId: node.id,
        mg1: mg1,
        prevBest: curBest,
        mg2: mg2,
        flag: 0
      });
      
      // Update current best
      if (!curBest || mg1 > Q.find(n => n.nodeId === curBest)!.mg1) {
        curBest = node.id;
      }
    }
  }

  Q.sort((a, b) => b.mg1 - a.mg1);

  // Greedy selection
  while (seeds.length < budget && Q.length > 0) {
    let recomputations = 0;
    
    while (Q.length > 0) {
      const u = Q[0];
      
      // Already accurate
      if (u.flag === seeds.length) {
        seeds.push(u.nodeId);
        seedSet.add(u.nodeId);
        lastSeed = u.nodeId;
        Q.shift();
        console.log(`CELF++: Selected seed ${seeds.length}: ${u.nodeId} (mg: ${u.mg1.toFixed(2)})`);
        break;
      }
      
      // CELF++ optimization: use cached mg2 if prevBest was last seed
      if (u.prevBest === lastSeed) {
        u.mg1 = u.mg2;
        console.log(`CELF++: Used cached mg2 for ${u.nodeId}`);
      } else {
        // Recompute both mg1 and mg2
        recomputations++;
        u.mg1 = calculateMarginalGain(network, seedSet, u.nodeId, meme, simulations);
        
        if (curBest) {
          const tempSet = new Set(seedSet);
          tempSet.add(curBest);
          u.mg2 = calculateMarginalGain(network, tempSet, u.nodeId, meme, simulations);
        }
        u.prevBest = curBest;
      }
      
      u.flag = seeds.length;

      // Update curBest
      const curBestNode = curBest ? Q.find(n => n.nodeId === curBest) : null;
      if (!curBest || !curBestNode || u.mg1 > curBestNode.mg1) {
        curBest = u.nodeId;
      }

      Q.sort((a, b) => b.mg1 - a.mg1);
    }
    
    console.log(`CELF++: Iteration ${seeds.length}, recomputations: ${recomputations}`);
  }

  return seeds;
}

/**
 * CELF-based Attacker Strategy
 * Plans k moves ahead using CELF, then executes first move
 */
export function attackerCELF(
  state: GameState,
  lookahead: number = 5
): { type: MoveType; targetNodeId: string; memeId?: string } | null {
  // Use CELF to find optimal k nodes to target
  const optimalSeeds = celfSelection(
    state.network,
    state.activeMemes[state.activeMemes.length - 1],
    Math.min(lookahead, state.attackerBudget),
    500 // Reduced simulations for real-time performance
  );

  if (optimalSeeds.length === 0) return null;

  // Execute first node in the optimal plan
  const targetId = optimalSeeds[0];
  
  // Check if target is reachable
  const target = state.network.nodes.find(n => n.id === targetId);
  if (!target || target.state !== 'susceptible') return null;

  // Check adjacency constraint
  if (state.infectedNodes.size > 0) {
    const hasInfectedNeighbor = Array.from(state.infectedNodes).some(
      infId => target.trust_network[infId] !== undefined
    );
    if (!hasInfectedNeighbor) return null;
  }

  return {
    type: 'infect',
    targetNodeId: targetId,
    memeId: state.activeMemes[state.activeMemes.length - 1].id
  };
}

/**
 * CELF++ based Attacker Strategy
 */
export function attackerCELFPlusPlus(
  state: GameState,
  lookahead: number = 5
): { type: MoveType; targetNodeId: string; memeId?: string } | null {
  const optimalSeeds = celfPlusPlusSelection(
    state.network,
    state.activeMemes[state.activeMemes.length - 1],
    Math.min(lookahead, state.attackerBudget),
    500
  );

  if (optimalSeeds.length === 0) return null;

  const targetId = optimalSeeds[0];
  const target = state.network.nodes.find(n => n.id === targetId);
  if (!target || target.state !== 'susceptible') return null;

  if (state.infectedNodes.size > 0) {
    const hasInfectedNeighbor = Array.from(state.infectedNodes).some(
      infId => target.trust_network[infId] !== undefined
    );
    if (!hasInfectedNeighbor) return null;
  }

  return {
    type: 'infect',
    targetNodeId: targetId,
    memeId: state.activeMemes[state.activeMemes.length - 1].id
  };
}

/**
 * Meme-Type Aware CELF
 * Uses different spread estimation based on meme type
 */
export function memeTypeAwareCELF(
  network: Network,
  meme: Meme,
  budget: number
): string[] {
  // Adjust simulation count based on meme virality
  const baseSimulations = 1000;
  const viralityFactor = meme.attributes.virality_factor;
  const simulations = Math.floor(baseSimulations * (0.5 + viralityFactor));

  console.log(`Meme-aware CELF: Using ${simulations} simulations for meme type ${meme.content_type}`);
  
  return celfPlusPlusSelection(network, meme, budget, simulations);
}
