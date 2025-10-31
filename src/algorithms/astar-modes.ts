/**
 * A* Algorithm Modes
 * Two distinct pathfinding modes for different trust scenarios
 */

import { Node } from '../schemas/node';
import { Meme } from '../schemas/meme';
import { Network } from '../schemas/network';

export type AStarMode = 'social_trust' | 'meme_trust';

/**
 * MODE 1: Pure Social Trust
 * Cost based only on node-to-node trust relationships
 * Ignores meme attributes - pure social network pathfinding
 */
export function calculateSocialTrustCost(
  sourceNode: Node,
  targetNode: Node,
  trustWeight: number
): number {
  // Base cost is inverse of trust (higher trust = lower cost)
  const baseCost = 1 - trustWeight;

  // Homophily bonus - similar people trust each other more
  const identitySimilarity = sourceNode.identity_class === targetNode.identity_class ? 0.8 : 1.0;
  
  // Political alignment factor (affects trust even without meme)
  const politicalDistance = Math.abs(
    sourceNode.attributes.political_leaning - targetNode.attributes.political_leaning
  );
  const politicalFactor = 1 + (politicalDistance * 0.3);

  // Social activity of target (more active = easier to reach)
  const activityFactor = 1 - (targetNode.attributes.social_activity * 0.2);

  const totalCost = baseCost * identitySimilarity * politicalFactor * activityFactor;
  
  return Math.max(0.05, Math.min(2.0, totalCost));
}

/**
 * MODE 2: Meme Trust
 * Cost based on likelihood of meme acceptance
 * Considers all node attributes + meme attributes + trust
 */
export function calculateMemeTrustCost(
  node: Node,
  meme: Meme,
  sourceNode: Node,
  trustWeight: number
): number {
  const BASE_RECEPTIVITY = 0.3;

  // 1. Trust factor (social connection strength)
  const trustFactor = trustWeight;

  // 2. Political/Ideological alignment with meme
  const politicalDistance = Math.abs(
    node.attributes.political_leaning - meme.attributes.political_bias
  );
  const politicalAlignment = 1 - politicalDistance;

  // 3. Critical thinking filter for low-accuracy memes
  let criticalThinkingPenalty = 0;
  if (meme.attributes.factual_accuracy < 0.5) {
    criticalThinkingPenalty = 
      node.attributes.critical_thinking * (1 - meme.attributes.factual_accuracy);
  }

  // 4. Education level affects complex meme understanding
  const complexityPenalty = Math.abs(
    meme.attributes.complexity - node.attributes.education_level
  ) * 0.3;

  // 5. Source credibility matters
  const credibilityFactor = 0.7 + (meme.attributes.source_credibility * 0.3);

  // Combine factors for alignment score
  const alignmentScore = politicalAlignment * (1 - criticalThinkingPenalty) * (1 - complexityPenalty);

  // 6. Virality/emotional appeal
  const viralityBoost = 
    1 + (meme.attributes.virality_factor * node.attributes.emotional_susceptibility);

  // Calculate acceptance probability
  const acceptanceProbability = 
    BASE_RECEPTIVITY * 
    trustFactor * 
    alignmentScore * 
    viralityBoost * 
    credibilityFactor;

  const clampedProb = Math.max(0.05, Math.min(0.95, acceptanceProbability));

  // Cost is inverse of acceptance probability
  // Higher probability = lower cost to convince
  const cost = 1 - clampedProb;

  return cost;
}

/**
 * Heuristic for MODE 1: Social Trust
 * Estimates remaining cost based on social network structure only
 */
export function socialTrustHeuristic(
  currentNode: Node,
  targetNode: Node,
  network: Network
): number {
  // Component 1: Social distance (identity class difference)
  const identityDistance = currentNode.identity_class === targetNode.identity_class ? 0 : 0.5;

  // Component 2: Political distance
  const politicalDistance = Math.abs(
    currentNode.attributes.political_leaning - targetNode.attributes.political_leaning
  );
  const politicalCost = politicalDistance * 0.5;

  // Component 3: Direct connection bonus
  const directTrust = currentNode.trust_network[targetNode.id];
  const connectionCost = directTrust !== undefined ? (1 - directTrust) * 0.5 : 1.0;

  // Component 4: Social activity (easier to reach active people)
  const activityCost = (1 - targetNode.attributes.social_activity) * 0.3;

  return identityDistance + politicalCost + connectionCost + activityCost;
}

/**
 * Heuristic for MODE 2: Meme Trust
 * Estimates remaining cost considering meme acceptance factors
 */
export function memeTrustHeuristic(
  currentNode: Node,
  targetNode: Node,
  meme: Meme,
  network: Network
): number {
  // Component 1: Political/ideological alignment with meme
  const targetMemeAlignment = Math.abs(
    targetNode.attributes.political_leaning - meme.attributes.political_bias
  );
  const alignmentCost = targetMemeAlignment * 1.5;

  // Component 2: Critical thinking barrier for false memes
  let criticalBarrier = 0;
  if (meme.attributes.factual_accuracy < 0.5) {
    criticalBarrier = targetNode.attributes.critical_thinking * 0.8;
  }

  // Component 3: Education vs complexity mismatch
  const complexityMismatch = Math.abs(
    meme.attributes.complexity - targetNode.attributes.education_level
  ) * 0.4;

  // Component 4: Emotional resistance
  const emotionalResistance = 
    (1 - targetNode.attributes.emotional_susceptibility) * 
    (1 - meme.attributes.virality_factor) * 0.3;

  // Component 5: Social network distance
  const directTrust = currentNode.trust_network[targetNode.id];
  const socialCost = directTrust !== undefined ? (1 - directTrust) * 0.3 : 0.8;

  return alignmentCost + criticalBarrier + complexityMismatch + emotionalResistance + socialCost;
}

/**
 * Get cost function based on mode
 */
export function getCostFunction(mode: AStarMode) {
  return mode === 'social_trust' ? calculateSocialTrustCost : calculateMemeTrustCost;
}

/**
 * Get heuristic function based on mode
 */
export function getHeuristicFunction(mode: AStarMode) {
  return mode === 'social_trust' ? socialTrustHeuristic : memeTrustHeuristic;
}

/**
 * Explain the path cost for debugging/visualization
 */
export function explainPathCost(
  sourceNode: Node,
  targetNode: Node,
  meme: Meme,
  trustWeight: number,
  mode: AStarMode
): string {
  if (mode === 'social_trust') {
    const cost = calculateSocialTrustCost(sourceNode, targetNode, trustWeight);
    return `Social Trust Path:
- Base Trust: ${trustWeight.toFixed(2)}
- Identity Match: ${sourceNode.identity_class === targetNode.identity_class ? 'Yes' : 'No'}
- Political Distance: ${Math.abs(sourceNode.attributes.political_leaning - targetNode.attributes.political_leaning).toFixed(2)}
- Target Activity: ${targetNode.attributes.social_activity.toFixed(2)}
→ Cost: ${cost.toFixed(3)}`;
  } else {
    const cost = calculateMemeTrustCost(targetNode, meme, sourceNode, trustWeight);
    const acceptProb = 1 - cost;
    return `Meme Trust Path:
- Trust Weight: ${trustWeight.toFixed(2)}
- Political Alignment: ${(1 - Math.abs(targetNode.attributes.political_leaning - meme.attributes.political_bias)).toFixed(2)}
- Critical Thinking: ${targetNode.attributes.critical_thinking.toFixed(2)}
- Factual Accuracy: ${meme.attributes.factual_accuracy.toFixed(2)}
- Emotional Appeal: ${(meme.attributes.virality_factor * targetNode.attributes.emotional_susceptibility).toFixed(2)}
→ Acceptance Probability: ${acceptProb.toFixed(3)}
→ Cost: ${cost.toFixed(3)}`;
  }
}

