/**
 * Game Engine for Competitive Mode
 * Manages game state, turn flow, and win conditions
 */

import { GameState, GameConfig, GameMove, GameEvent, PlayerRole, MoveType } from '../schemas/game-state';
import { Network } from '../schemas/network';
import { Meme, MemeAttributes } from '../schemas/meme';
import { Node } from '../schemas/node';
import { calculateAcceptanceProbability } from './propagation';

/**
 * Initialize a new game state
 */
export function initializeGame(network: Network, initialMeme: Meme, config: GameConfig): GameState {
  return {
    network,
    activeMemes: [initialMeme],
    infectedNodes: new Set(),
    resistantNodes: new Set(),
    currentTurn: 'attacker',
    turnNumber: 1,
    attackerBudget: config.attackerBudget,
    defenderBudget: config.defenderBudget,
    moveHistory: [],
    gameOver: false,
  };
}

/**
 * Mutate a meme to increase acceptance probability
 * Increases virality, emotional intensity, and adjusts political bias
 */
export function mutateMeme(meme: Meme, targetNode: Node): Meme {
  const mutationFactor = 0.15; // 15% change
  
  // Adjust attributes to better match target
  const newAttributes: MemeAttributes = {
    // Move political bias slightly towards target
    political_bias: meme.attributes.political_bias + 
      (targetNode.attributes.political_leaning - meme.attributes.political_bias) * 0.3,
    
    // Increase emotional appeal
    emotional_intensity: Math.min(1.0, meme.attributes.emotional_intensity + mutationFactor),
    
    // Virality increases (but accuracy may decrease)
    virality_factor: Math.min(1.0, meme.attributes.virality_factor + mutationFactor),
    
    // Simplify for broader appeal
    complexity: Math.max(0.1, meme.attributes.complexity - mutationFactor),
    
    // Accuracy may decrease slightly
    factual_accuracy: Math.max(0.05, meme.attributes.factual_accuracy - mutationFactor * 0.5),
    
    // Source credibility slightly increases (appears more legitimate)
    source_credibility: Math.min(1.0, meme.attributes.source_credibility + mutationFactor * 0.5),
  };

  return {
    id: `${meme.id}_mut_${Date.now()}`,
    content_type: meme.content_type,
    title: `${meme.title || 'Meme'} (mutated)`,
    attributes: newAttributes,
    timestamp: Date.now(),
    generation: meme.generation + 1,
    parent_id: meme.id,
  };
}

/**
 * Execute an attacker move
 */
export function executeAttackerMove(
  state: GameState,
  move: { type: MoveType; targetNodeId: string; memeId?: string }
): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const newState = { ...state };
  const targetNode = newState.network.nodes.find(n => n.id === move.targetNodeId);
  
  if (!targetNode) {
    return { newState: state, events };
  }

  if (move.type === 'infect') {
    // Try to infect a node
    const meme = newState.activeMemes.find(m => m.id === move.memeId) || newState.activeMemes[0];
    
    // Check if node has infected neighbors
    const hasInfectedNeighbor = Array.from(newState.infectedNodes).some(
      infectedId => targetNode.trust_network[infectedId] !== undefined
    );

    if (!hasInfectedNeighbor && newState.infectedNodes.size > 0) {
      events.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'move',
        player: 'attacker',
        description: `Cannot infect ${move.targetNodeId} - no infected neighbors`,
        nodeId: move.targetNodeId,
      });
      return { newState: state, events };
    }

    // Find source node (random infected neighbor or first infected if initial)
    const sourceNodeId = newState.infectedNodes.size === 0 
      ? null
      : Array.from(newState.infectedNodes).find(id => targetNode.trust_network[id] !== undefined);
    
    const sourceNode = sourceNodeId 
      ? newState.network.nodes.find(n => n.id === sourceNodeId)
      : targetNode; // Initial infection

    const trustWeight = sourceNode ? (targetNode.trust_network[sourceNode.id] || 0.5) : 0.5;
    const acceptanceProb = calculateAcceptanceProbability(
      targetNode,
      meme,
      sourceNode || targetNode,
      trustWeight
    );

    const success = Math.random() < acceptanceProb;

    if (success) {
      newState.infectedNodes.add(move.targetNodeId);
      targetNode.state = 'infected';
      targetNode.current_beliefs.push(meme.id);
      
      events.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'infection',
        player: 'attacker',
        description: `Successfully infected ${move.targetNodeId} (${(acceptanceProb * 100).toFixed(1)}% chance)`,
        nodeId: move.targetNodeId,
        memeId: meme.id,
        details: { acceptanceProb },
      });
    } else {
      events.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'move',
        player: 'attacker',
        description: `Failed to infect ${move.targetNodeId} (${(acceptanceProb * 100).toFixed(1)}% chance)`,
        nodeId: move.targetNodeId,
        details: { acceptanceProb },
      });
    }

    newState.attackerBudget--;
  } else if (move.type === 'mutate_meme') {
    // Mutate meme to increase acceptance
    const baseMeme = newState.activeMemes[0];
    const mutatedMeme = mutateMeme(baseMeme, targetNode);
    newState.activeMemes.push(mutatedMeme);
    
    events.push({
      id: `evt_${Date.now()}`,
      timestamp: Date.now(),
      type: 'mutation',
      player: 'attacker',
      description: `Mutated meme targeting ${move.targetNodeId}'s profile`,
      nodeId: move.targetNodeId,
      memeId: mutatedMeme.id,
      details: { 
        oldVirality: baseMeme.attributes.virality_factor,
        newVirality: mutatedMeme.attributes.virality_factor,
      },
    });

    newState.attackerBudget--;
  }

  return { newState, events };
}

/**
 * Execute a defender move
 */
export function executeDefenderMove(
  state: GameState,
  move: { type: MoveType; targetNodeId: string }
): { newState: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];
  const newState = { ...state };
  const targetNode = newState.network.nodes.find(n => n.id === move.targetNodeId);
  
  if (!targetNode) {
    return { newState: state, events };
  }

  if (move.type === 'factcheck') {
    // Fact-check an infected node
    const wasInfected = newState.infectedNodes.has(move.targetNodeId);
    
    if (wasInfected) {
      const reversalProb = 0.6 + (targetNode.attributes.critical_thinking * 0.3);
      const success = Math.random() < reversalProb;

      if (success) {
        newState.infectedNodes.delete(move.targetNodeId);
        newState.resistantNodes.add(move.targetNodeId);
        targetNode.state = 'resistant';
        targetNode.current_beliefs = [];
        
        events.push({
          id: `evt_${Date.now()}`,
          timestamp: Date.now(),
          type: 'resistance',
          player: 'defender',
          description: `Fact-checked ${move.targetNodeId} successfully (${(reversalProb * 100).toFixed(1)}% chance)`,
          nodeId: move.targetNodeId,
          details: { reversalProb },
        });
      } else {
        events.push({
          id: `evt_${Date.now()}`,
          timestamp: Date.now(),
          type: 'move',
          player: 'defender',
          description: `Fact-check failed on ${move.targetNodeId} (${(reversalProb * 100).toFixed(1)}% chance)`,
          nodeId: move.targetNodeId,
          details: { reversalProb },
        });
      }
    } else {
      events.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'move',
        player: 'defender',
        description: `Cannot fact-check ${move.targetNodeId} - not infected`,
        nodeId: move.targetNodeId,
      });
    }

    newState.defenderBudget--;
  } else if (move.type === 'inoculate') {
    // Inoculate a susceptible node
    if (targetNode.state === 'susceptible') {
      newState.resistantNodes.add(move.targetNodeId);
      targetNode.state = 'resistant';
      
      events.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'resistance',
        player: 'defender',
        description: `Inoculated ${move.targetNodeId} against misinformation`,
        nodeId: move.targetNodeId,
      });
    } else {
      events.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'move',
        player: 'defender',
        description: `Cannot inoculate ${move.targetNodeId} - not susceptible`,
        nodeId: move.targetNodeId,
      });
    }

    newState.defenderBudget--;
  }

  return { newState, events };
}

/**
 * Switch turns
 */
export function switchTurn(state: GameState): GameState {
  const newTurn = state.currentTurn === 'attacker' ? 'defender' : 'attacker';
  return {
    ...state,
    currentTurn: newTurn,
    turnNumber: newTurn === 'attacker' ? state.turnNumber + 1 : state.turnNumber,
  };
}

/**
 * Check win conditions
 */
export function checkWinCondition(
  state: GameState,
  config: GameConfig
): { gameOver: boolean; winner?: PlayerRole } {
  const infectionRate = state.infectedNodes.size / state.network.nodes.length;
  
  // Attacker wins if infection rate exceeds threshold
  if (infectionRate >= config.winThreshold) {
    return { gameOver: true, winner: 'attacker' };
  }
  
  // Defender wins if max turns reached and infection below threshold
  if (state.turnNumber > config.maxTurns) {
    return { gameOver: true, winner: 'defender' };
  }
  
  // Defender wins if attacker has no budget and infection is low
  if (state.attackerBudget <= 0 && infectionRate < config.winThreshold) {
    return { gameOver: true, winner: 'defender' };
  }
  
  return { gameOver: false };
}

/**
 * Get possible moves for current player
 */
export function getPossibleMoves(state: GameState): Array<{ type: MoveType; targetNodeId: string; memeId?: string }> {
  const moves: Array<{ type: MoveType; targetNodeId: string; memeId?: string }> = [];
  
  if (state.currentTurn === 'attacker' && state.attackerBudget > 0) {
    // Can infect susceptible neighbors of infected nodes
    if (state.infectedNodes.size === 0) {
      // Initial infection - can target any node
      state.network.nodes.forEach(node => {
        if (node.state === 'susceptible') {
          moves.push({ type: 'infect', targetNodeId: node.id, memeId: state.activeMemes[0].id });
        }
      });
    } else {
      // Can only infect neighbors of infected nodes
      state.network.nodes.forEach(node => {
        if (node.state === 'susceptible') {
          const hasInfectedNeighbor = Array.from(state.infectedNodes).some(
            infId => node.trust_network[infId] !== undefined
          );
          if (hasInfectedNeighbor) {
            moves.push({ type: 'infect', targetNodeId: node.id, memeId: state.activeMemes[0].id });
          }
        }
      });
    }
    
    // Can mutate meme
    moves.push({ type: 'mutate_meme', targetNodeId: 'any' });
  } else if (state.currentTurn === 'defender' && state.defenderBudget > 0) {
    // Can fact-check infected nodes
    state.network.nodes.forEach(node => {
      if (state.infectedNodes.has(node.id)) {
        moves.push({ type: 'factcheck', targetNodeId: node.id });
      }
    });
    
    // Can inoculate susceptible nodes (prioritize those near infected)
    state.network.nodes.forEach(node => {
      if (node.state === 'susceptible') {
        moves.push({ type: 'inoculate', targetNodeId: node.id });
      }
    });
  }
  
  return moves;
}

