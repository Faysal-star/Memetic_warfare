# A* Algorithm Modes Documentation

## Overview

The A* pathfinding algorithm supports **two distinct modes** for finding optimal influence paths through the social network. Each mode uses different cost functions and heuristics to model different aspects of information diffusion.

---

## Mode 1: Social Trust (`social_trust`)

**Purpose**: Pure social network pathfinding based only on node-to-node trust relationships.

### When to Use
- Finding the most trusted path between two people
- Social influence without message content
- Pure network topology analysis
- Understanding social connection strength

### Cost Function

The cost to move from node A to node B considers:

1. **Base Trust** (inverse relationship)
   ```
   baseCost = 1 - trustWeight
   ```
   Higher trust = lower cost

2. **Identity Similarity** (homophily)
   ```
   identitySimilarity = 0.8 if same identity_class, else 1.0
   ```
   People trust similar people more

3. **Political Alignment**
   ```
   politicalDistance = |nodeA.political_leaning - nodeB.political_leaning|
   politicalFactor = 1 + (politicalDistance × 0.3)
   ```
   Political differences increase cost

4. **Social Activity**
   ```
   activityFactor = 1 - (targetNode.social_activity × 0.2)
   ```
   More active people are easier to reach

**Total Cost**:
```
cost = baseCost × identitySimilarity × politicalFactor × activityFactor
```

### Heuristic Function

Estimates remaining cost to target:

1. **Identity Distance**: 0.5 if different identity classes
2. **Political Distance**: `|current.political - target.political| × 0.5`
3. **Connection Bonus**: Uses direct trust if connected
4. **Activity Cost**: `(1 - target.social_activity) × 0.3`

---

## Mode 2: Meme Trust (`meme_trust`)

**Purpose**: Pathfinding that considers the likelihood of meme acceptance based on all node and meme attributes.

### When to Use
- Finding the path where a specific message will be most accepted
- Testing misinformation vs factual information spread
- Analyzing echo chambers and filter bubbles
- Understanding content-based influence

### Cost Function

The cost considers **full meme acceptance probability**:

1. **Trust Factor**
   ```
   trustFactor = trustWeight (0 to 1)
   ```

2. **Political/Ideological Alignment**
   ```
   politicalDistance = |node.political_leaning - meme.political_bias|
   politicalAlignment = 1 - politicalDistance
   ```
   Message aligns with person's political views

3. **Critical Thinking Filter**
   ```
   if meme.factual_accuracy < 0.5:
       penalty = node.critical_thinking × (1 - meme.factual_accuracy)
   ```
   Smart people reject false information

4. **Education vs Complexity**
   ```
   complexityPenalty = |meme.complexity - node.education_level| × 0.3
   ```
   Message complexity must match education level

5. **Source Credibility**
   ```
   credibilityFactor = 0.7 + (meme.source_credibility × 0.3)
   ```
   Trusted sources improve acceptance

6. **Emotional/Viral Appeal**
   ```
   viralityBoost = 1 + (meme.virality × node.emotional_susceptibility)
   ```
   Emotional people accept viral content more

**Acceptance Probability**:
```
P(accept) = BASE_RECEPTIVITY × trustFactor × alignmentScore × 
            viralityBoost × credibilityFactor
```

**Cost** (inverse of probability):
```
cost = 1 - P(accept)
```

Lower acceptance probability = higher cost to convince

### Heuristic Function

Estimates remaining cost considering meme attributes:

1. **Alignment Cost**: `|target.political - meme.political_bias| × 1.5`
2. **Critical Barrier**: `target.critical_thinking × 0.8` (for false memes)
3. **Complexity Mismatch**: `|meme.complexity - target.education| × 0.4`
4. **Emotional Resistance**: `(1 - target.emotional) × (1 - meme.virality) × 0.3`
5. **Social Distance**: Based on trust network

---

## Comparison Example

### Scenario: 
Influencing a **High Critical Thinking, Left-Leaning Tech Worker**

**Meme A**: Low-accuracy right-wing conspiracy (factual_accuracy=0.2, political_bias=0.8)

**Meme B**: High-accuracy neutral news (factual_accuracy=0.9, political_bias=0.0)

### Social Trust Mode Results:
- **Path**: Same for both memes
- **Cost**: Based only on trust network
- **Result**: Finds shortest social path regardless of message

### Meme Trust Mode Results:

**Meme A (False, Right-Wing)**:
- High critical thinking blocks false info
- Political misalignment (left person, right meme)
- **High cost** (~0.9), unlikely acceptance
- May not find path at all

**Meme B (True, Neutral)**:
- High accuracy passes critical thinking
- No political conflict
- **Low cost** (~0.2), likely acceptance
- Finds efficient path

---

## Implementation Details

### File Structure
```
src/algorithms/
├── astar.ts           # Main A* algorithm
├── astar-modes.ts     # Mode-specific cost & heuristic functions
└── propagation.ts     # Shared propagation utilities
```

### Usage

```typescript
import { astarInfluencePath } from '@/src/algorithms/astar';

// Mode 1: Social Trust
const socialPath = astarInfluencePath(
  network, 
  startId, 
  targetId, 
  meme, 
  'social_trust'
);

// Mode 2: Meme Trust (default)
const memePath = astarInfluencePath(
  network, 
  startId, 
  targetId, 
  meme, 
  'meme_trust'
);
```

### Result Object

```typescript
{
  success: boolean;
  path: string[];              // Node IDs in order
  cost: number;                // Total path cost
  mode: 'social_trust' | 'meme_trust';
  exploredCount: number;       // Nodes explored
  frames: AStarFrame[];        // For visualization
  pathExplanations?: string[]; // Cost breakdown per step
}
```

---

## Path Cost Breakdown

When `meme_trust` mode is used, detailed explanations are provided:

```
node_5 → node_12:
Meme Trust Path:
- Trust Weight: 0.75
- Political Alignment: 0.85
- Critical Thinking: 0.80
- Factual Accuracy: 0.20
- Emotional Appeal: 0.45
→ Acceptance Probability: 0.234
→ Cost: 0.766
```

This helps understand why certain paths are chosen and how different factors contribute to the cost.

---

## Realistic Modeling

### Key Features

1. **Multi-Dimensional Trust**
   - Not just binary "trust/don't trust"
   - Considers multiple relationship factors
   - Homophily and political alignment

2. **Content Awareness**
   - Meme attributes matter in `meme_trust` mode
   - False information faces barriers
   - Emotional content has advantages

3. **Individual Differences**
   - Critical thinking filters misinformation
   - Education affects complex message understanding
   - Emotional susceptibility varies

4. **Realistic Thresholds**
   - Acceptance probability clamped to [0.05, 0.95]
   - No absolute certainties
   - Reflects real-world uncertainty

---

## Validation

The model is validated against real-world phenomena:

✅ **Echo Chambers**: Similar people accept aligned messages (low cost)
✅ **Filter Bubbles**: Misaligned messages face barriers (high cost)
✅ **Critical Thinking**: Educated people resist false info
✅ **Viral Content**: Emotional messages spread easier
✅ **Trust Networks**: Strong relationships facilitate spread

---

## Future Enhancements

Possible extensions:

- **Temporal decay**: Trust changes over time
- **Message fatigue**: Repeated exposure effects
- **Network effects**: Peer influence (multiple sources)
- **Fact-checking**: Resistance after verification
- **Meme variants**: Mutations during propagation

---

*This model provides a realistic, research-backed simulation of information diffusion in social networks.*

