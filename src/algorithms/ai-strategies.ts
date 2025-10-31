/**
 * AI Strategies for Competitive Mode
 * Attacker and Defender AI implementations
 */

import { GameState, MoveType } from '../schemas/game-state';
import { Network } from '../schemas/network';
import { Node } from '../schemas/node';
import { Meme } from '../schemas/meme';
import { calculateAcceptanceProbability } from './propagation';

export type AttackerStrategy = 'greedy_degree' | 'high_susceptibility' | 'bridge_targeting';
export type DefenderStrategy = 'reactive' | 'proactive' | 'bridge_protection';

/**
 * ATTACKER STRATEGIES
 */

/**
 * Greedy Degree: Target nodes with highest degree (hubs)
 */
export function attackerGreedyDegree(state: GameState): { type: MoveType; targetNodeId: string; memeId?: string } | null {
  const susceptibleNodes = state.network.nodes.filter(node => {
    if (node.state !== 'susceptible') return false;
    
    // If no infections yet, can target anyone
    if (state.infectedNodes.size === 0) return true;
    
    // Otherwise must have infected neighbor
    return Array.from(state.infectedNodes).some(
      infId => node.trust_network[infId] !== undefined
    );
  });

  if (susceptibleNodes.length === 0) return null;

  // Sort by degree (number of connections)
  susceptibleNodes.sort((a, b) => 
    Object.keys(b.trust_network).length - Object.keys(a.trust_network).length
  );

  return {
    type: 'infect',
    targetNodeId: susceptibleNodes[0].id,
    memeId: state.activeMemes[state.activeMemes.length - 1].id, // Use latest meme (potentially mutated)
  };
}

/**
 * High Susceptibility: Target most emotionally susceptible nodes
 */
export function attackerHighSusceptibility(state: GameState): { type: MoveType; targetNodeId: string; memeId?: string } | null {
  const meme = state.activeMemes[state.activeMemes.length - 1];
  const susceptibleNodes = state.network.nodes.filter(node => {
    if (node.state !== 'susceptible') return false;
    if (state.infectedNodes.size === 0) return true;
    return Array.from(state.infectedNodes).some(
      infId => node.trust_network[infId] !== undefined
    );
  });

  if (susceptibleNodes.length === 0) return null;

  // Calculate acceptance score for each node
  const scores = susceptibleNodes.map(node => {
    // Find best infected neighbor (if any)
    const infectedNeighbors = Array.from(state.infectedNodes)
      .filter(infId => node.trust_network[infId] !== undefined);
    
    if (infectedNeighbors.length === 0 && state.infectedNodes.size > 0) {
      return { node, score: 0 };
    }

    const sourceNode = infectedNeighbors.length > 0
      ? state.network.nodes.find(n => n.id === infectedNeighbors[0])!
      : node;
    
    const trustWeight = infectedNeighbors.length > 0 
      ? node.trust_network[infectedNeighbors[0]]
      : 0.5;

    const acceptanceProb = calculateAcceptanceProbability(node, meme, sourceNode, trustWeight);
    
    return { node, score: acceptanceProb };
  });

  scores.sort((a, b) => b.score - a.score);

  return {
    type: 'infect',
    targetNodeId: scores[0].node.id,
    memeId: meme.id,
  };
}

/**
 * Bridge Targeting: Target nodes with high betweenness (connect communities)
 */
export function attackerBridgeTargeting(state: GameState): { type: MoveType; targetNodeId: string; memeId?: string } | null {
  const susceptibleNodes = state.network.nodes.filter(node => {
    if (node.state !== 'susceptible') return false;
    if (state.infectedNodes.size === 0) return true;
    return Array.from(state.infectedNodes).some(
      infId => node.trust_network[infId] !== undefined
    );
  });

  if (susceptibleNodes.length === 0) return null;

  // Simple betweenness: nodes connecting different identity classes
  const scores = susceptibleNodes.map(node => {
    const neighborIdentities = new Set(
      Object.keys(node.trust_network)
        .map(nId => state.network.nodes.find(n => n.id === nId)?.identity_class)
        .filter(Boolean)
    );
    return { node, score: neighborIdentities.size };
  });

  scores.sort((a, b) => b.score - a.score);

  return {
    type: 'infect',
    targetNodeId: scores[0].node.id,
    memeId: state.activeMemes[state.activeMemes.length - 1].id,
  };
}

/**
 * DEFENDER STRATEGIES
 */

/**
 * Reactive: Fact-check highest threat nodes (most infected neighbors)
 */
export function defenderReactive(state: GameState): { type: MoveType; targetNodeId: string } | null {
  const infectedNodes = Array.from(state.infectedNodes);
  
  if (infectedNodes.length === 0) {
    // Inoculate high-degree nodes preemptively
    const nodes = [...state.network.nodes]
      .filter(n => n.state === 'susceptible')
      .sort((a, b) => Object.keys(b.trust_network).length - Object.keys(a.trust_network).length);
    
    return nodes.length > 0 ? { type: 'inoculate', targetNodeId: nodes[0].id } : null;
  }

  // Calculate threat scores for susceptible nodes
  const threatScores = state.network.nodes
    .filter(node => node.state === 'susceptible')
    .map(node => {
      const infectedNeighborCount = Object.keys(node.trust_network)
        .filter(nId => state.infectedNodes.has(nId))
        .length;
      
      const degree = Object.keys(node.trust_network).length;
      const threatScore = degree > 0 ? infectedNeighborCount / degree : 0;
      
      return { node, score: threatScore };
    });

  threatScores.sort((a, b) => b.score - a.score);

  if (threatScores.length > 0 && threatScores[0].score > 0) {
    return { type: 'inoculate', targetNodeId: threatScores[0].node.id };
  }

  // Otherwise fact-check an infected node
  return infectedNodes.length > 0 
    ? { type: 'factcheck', targetNodeId: infectedNodes[0] }
    : null;
}

/**
 * Proactive: Inoculate high-risk nodes before they get infected
 */
export function defenderProactive(state: GameState): { type: MoveType; targetNodeId: string } | null {
  // Prioritize inoculation over fact-checking
  const susceptibleNodes = state.network.nodes.filter(n => n.state === 'susceptible');
  
  if (susceptibleNodes.length > 0) {
    // Target high-degree nodes
    susceptibleNodes.sort((a, b) => 
      Object.keys(b.trust_network).length - Object.keys(a.trust_network).length
    );
    
    return { type: 'inoculate', targetNodeId: susceptibleNodes[0].id };
  }

  // Fall back to fact-checking
  const infectedNodes = Array.from(state.infectedNodes);
  return infectedNodes.length > 0 
    ? { type: 'factcheck', targetNodeId: infectedNodes[0] }
    : null;
}

/**
 * Bridge Protection: Protect nodes that connect communities
 */
export function defenderBridgeProtection(state: GameState): { type: MoveType; targetNodeId: string } | null {
  const susceptibleNodes = state.network.nodes.filter(n => n.state === 'susceptible');
  
  if (susceptibleNodes.length > 0) {
    // Find nodes connecting different identity classes
    const scores = susceptibleNodes.map(node => {
      const neighborIdentities = new Set(
        Object.keys(node.trust_network)
          .map(nId => state.network.nodes.find(n => n.id === nId)?.identity_class)
          .filter(Boolean)
      );
      return { node, score: neighborIdentities.size };
    });

    scores.sort((a, b) => b.score - a.score);
    
    return { type: 'inoculate', targetNodeId: scores[0].node.id };
  }

  // Fall back to fact-checking
  const infectedNodes = Array.from(state.infectedNodes);
  return infectedNodes.length > 0 
    ? { type: 'factcheck', targetNodeId: infectedNodes[0] }
    : null;
}

/**
 * Get AI move based on strategy
 */
export function getAIMove(
  state: GameState,
  attackerStrategy: AttackerStrategy,
  defenderStrategy: DefenderStrategy
): { type: MoveType; targetNodeId: string; memeId?: string } | null {
  if (state.currentTurn === 'attacker') {
    switch (attackerStrategy) {
      case 'greedy_degree':
        return attackerGreedyDegree(state);
      case 'high_susceptibility':
        return attackerHighSusceptibility(state);
      case 'bridge_targeting':
        return attackerBridgeTargeting(state);
      default:
        return attackerGreedyDegree(state);
    }
  } else {
    switch (defenderStrategy) {
      case 'reactive':
        return defenderReactive(state);
      case 'proactive':
        return defenderProactive(state);
      case 'bridge_protection':
        return defenderBridgeProtection(state);
      default:
        return defenderReactive(state);
    }
  }
}

