/**
 * Meme Propagation Algorithm
 * Handles information spread through the network
 */

import { Node } from '../schemas/node';
import { Meme } from '../schemas/meme';
import { Network } from '../schemas/network';

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate acceptance probability for a node receiving a meme
 */
export function calculateAcceptanceProbability(
  node: Node,
  meme: Meme,
  sourceNode: Node,
  trustWeight: number
): number {
  const BASE_RECEPTIVITY = 0.3;

  // Trust factor
  const trustFactor = trustWeight;

  // Political alignment
  const politicalDistance = Math.abs(
    node.attributes.political_leaning - meme.attributes.political_bias
  );
  const politicalAlignment = 1 - politicalDistance;

  // Critical thinking filter for low-accuracy memes
  let criticalThinkingPenalty = 0;
  if (meme.attributes.factual_accuracy < 0.5) {
    criticalThinkingPenalty = 
      node.attributes.critical_thinking * (1 - meme.attributes.factual_accuracy);
  }

  const alignmentScore = politicalAlignment * (1 - criticalThinkingPenalty);

  // Virality boost (emotional content spreads easier)
  const viralityBoost = 
    1 + (meme.attributes.virality_factor * node.attributes.emotional_susceptibility);

  // Combine all factors
  const probability = 
    BASE_RECEPTIVITY * trustFactor * alignmentScore * viralityBoost;

  return clamp(probability, 0.05, 0.95);
}

/**
 * Calculate transmission probability (will infected node share the meme?)
 */
export function calculateTransmissionProbability(
  node: Node,
  meme: Meme,
  daysSinceInfected: number = 0
): number {
  // Novelty factor (people stop sharing old news)
  const noveltyFactor = Math.max(0.3, 1 - (daysSinceInfected / 7));

  const probability = 
    node.attributes.social_activity *
    meme.attributes.virality_factor *
    (1 + meme.attributes.emotional_intensity * 0.5) *
    noveltyFactor;

  return clamp(probability, 0.0, 1.0);
}

/**
 * Simulate one propagation step
 */
export interface PropagationStepResult {
  newInfections: Node[];
  transmissions: Array<{ from: string; to: string; accepted: boolean }>;
}

export function simulatePropagationStep(
  network: Network,
  currentlyInfected: Node[],
  meme: Meme,
  currentStep: number = 0
): PropagationStepResult {
  const newInfections: Node[] = [];
  const transmissions: Array<{ from: string; to: string; accepted: boolean }> = [];

  for (const infectedNode of currentlyInfected) {
    // Calculate transmission probability
    const pTransmit = calculateTransmissionProbability(infectedNode, meme, currentStep);

    if (Math.random() < pTransmit) {
      // Try to transmit to neighbors
      const neighbors = network.nodes.filter(
        n => infectedNode.trust_network[n.id] !== undefined
      );

      for (const neighbor of neighbors) {
        // Skip if already infected or resistant
        if (neighbor.state !== 'susceptible') {
          continue;
        }

        const trustWeight = infectedNode.trust_network[neighbor.id];

        // Mark as exposed
        if (!neighbor.exposure_history.includes(meme.id)) {
          neighbor.state = 'exposed';
          neighbor.exposure_history.push(meme.id);
        }

        // Calculate acceptance probability
        const pAccept = calculateAcceptanceProbability(
          neighbor,
          meme,
          infectedNode,
          trustWeight
        );

        const accepted = Math.random() < pAccept;
        transmissions.push({
          from: infectedNode.id,
          to: neighbor.id,
          accepted,
        });

        if (accepted) {
          // Neighbor accepts meme
          neighbor.state = 'infected';
          neighbor.current_beliefs.push(meme.id);
          newInfections.push(neighbor);
        }
      }
    }
  }

  return { newInfections, transmissions };
}

/**
 * Get neighbors of a node
 */
export function getNeighbors(network: Network, nodeId: string): Node[] {
  const node = network.nodes.find(n => n.id === nodeId);
  if (!node) return [];

  return network.nodes.filter(n => node.trust_network[n.id] !== undefined);
}

