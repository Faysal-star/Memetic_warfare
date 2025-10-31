# Competitive Mode - Attacker vs Defender AI

## Overview

The Competitive Mode is a turn-based AI vs AI gameplay system where an **Attacker** AI tries to spread misinformation through a social network, while a **Defender** AI attempts to contain and counter the spread through fact-checking and inoculation.

---

## Game Mechanics

### Turn Structure
1. **Attacker Turn**: Infects nodes or mutates meme
2. **Defender Turn**: Fact-checks infected nodes or inoculates susceptible nodes
3. Turns alternate until win condition is met or budgets are exhausted

### Win Conditions
- **Attacker Wins**: Achieves 60% infection rate
- **Defender Wins**: 
  - Keeps infection below 60% for 20 turns
  - Attacker runs out of budget before reaching threshold

### Starting Conditions
- **Attacker Budget**: 10 moves
- **Defender Budget**: 10 moves
- **Initial State**: All nodes susceptible, no infections
- **Max Turns**: 20

---

## Attacker Actions

### 1. Infect Node
- **Target**: Susceptible node adjacent to infected node (or any node for first infection)
- **Success Probability**: Based on `calculateAcceptanceProbability()`
  - Trust relationship between nodes
  - Meme attributes (emotional intensity, virality, political bias)
  - Target attributes (critical thinking, emotional susceptibility, political leaning)
- **Effect**: Node becomes infected if successful
- **Cost**: 1 move from budget

### 2. Mutate Meme ✨
- **Purpose**: Increase acceptance probability for specific targets
- **Changes**:
  - Political Bias: Moves 30% towards target's political leaning
  - Emotional Intensity: +15% (max 1.0)
  - Virality Factor: +15% (max 1.0)
  - Complexity: -15% (simpler = more accessible)
  - Factual Accuracy: -7.5% (trade-off for virality)
  - Source Credibility: +7.5% (appears more legitimate)
- **Effect**: Creates mutated variant, subsequent infections use latest meme
- **Cost**: 1 move from budget

**Example Mutation**:
```
Original Meme:
- Political Bias: 0.8 (far right)
- Emotional Intensity: 0.6
- Virality: 0.5

Target Node:
- Political Leaning: 0.3 (center-right)

Mutated Meme:
- Political Bias: 0.65 (moved 30% towards 0.3)
- Emotional Intensity: 0.75 (+15%)
- Virality: 0.65 (+15%)
```

---

## Defender Actions

### 1. Fact-Check Node
- **Target**: Infected node
- **Success Probability**: 
  ```
  reversalProb = 0.6 + (target.critical_thinking * 0.3)
  ```
- **Effect**: If successful:
  - Node becomes resistant (immune to reinfection)
  - Removes from infected set
  - Clears current beliefs
- **Cost**: 1 move from budget

### 2. Inoculate Node
- **Target**: Susceptible node (not yet infected)
- **Success Probability**: 100% (always succeeds)
- **Effect**: Node becomes resistant (prevents future infection)
- **Strategy**: Preemptive defense, best used on high-risk nodes
- **Cost**: 1 move from budget

---

## AI Strategies

### Attacker Strategies

#### 1. Greedy Degree
- **Logic**: Target nodes with highest degree (most connections)
- **Advantage**: Maximizes potential spread, hits network hubs
- **Best For**: Dense networks, later game stages

#### 2. High Susceptibility
- **Logic**: Calculate acceptance probability for all targets, choose highest
- **Advantage**: Highest success rate, efficient use of budget
- **Best For**: Budget-constrained scenarios, early spread

#### 3. Bridge Targeting
- **Logic**: Target nodes connecting different identity communities
- **Advantage**: Cross-community spread, breaks network isolation
- **Best For**: Clustered networks, reaching new demographics

### Defender Strategies

#### 1. Reactive
- **Logic**: Calculate threat scores (# infected neighbors / degree), inoculate highest
- **Fallback**: Fact-check existing infections if no high-threat targets
- **Advantage**: Responds directly to current threat
- **Best For**: Containing active spread

#### 2. Proactive
- **Logic**: Inoculate high-degree nodes before infection
- **Fallback**: Fact-check if no susceptible nodes remain
- **Advantage**: Prevents spread by protecting key nodes
- **Best For**: Early game, hub-based networks

#### 3. Bridge Protection
- **Logic**: Inoculate nodes connecting different identity classes
- **Fallback**: Fact-check existing infections
- **Advantage**: Prevents cross-community spread
- **Best For**: Clustered networks, community isolation

---

## Probability Calculations

### Infection Success Probability
Uses the same `calculateAcceptanceProbability()` from propagation.ts:

```typescript
Components:
1. Trust Factor: trustWeight (from trust_network)
2. Political Alignment: 1 - |node.political_leaning - meme.political_bias|
3. Critical Thinking Penalty: (for low-accuracy memes)
4. Emotional Susceptibility Boost: node.emotional_susceptibility * meme.emotional_intensity
5. Virality Boost: meme.virality_factor

Final: (base * trust * alignment * (1 - crit_penalty)) * (1 + emotional + viral)
```

### Fact-Check Success Probability
```typescript
reversalProb = 0.6 + (target.critical_thinking * 0.3)
Range: 60% - 90% (higher for more critical thinkers)
```

### Inoculation Success
100% - always succeeds (preemptive measure)

---

## User Interface

### Left Panel - Game Controls
- **Game Status**: Turn number, infection rate, current player
- **Budgets**: Attacker and Defender remaining moves
- **Win Conditions**: Display thresholds
- **Controls**: Play/Pause, Step, Reset
- **Strategy Selection**: Dropdowns for both AIs
- **Game Over**: Winner announcement with final stats

### Middle Panel - Network Visualization
- **Node Colors**:
  - Gray: Susceptible
  - Red: Infected
  - Blue: Resistant
- **Real-Time Updates**: Network state changes immediately after each move
- **Interactive**: Hover to see node details

### Right Panel - Information
- **Node Info**: Details of hovered node
- **Event Log**: 
  - Chronological list (newest first)
  - Color-coded by player (red = attacker, blue = defender)
  - Shows move type, target, success/failure
  - Displays acceptance/reversal probabilities
  - Limited to 20 most recent events

---

## Event Log Examples

### Successful Infection
```
🗡️ Attacker
Successfully infected node_17 (68.3% chance)
```

### Failed Infection
```
🗡️ Attacker
Failed to infect node_23 (32.1% chance)
```

### Meme Mutation
```
🗡️ Attacker
Mutated meme targeting node_12's profile
Old Virality: 0.50 → New Virality: 0.65
```

### Successful Fact-Check
```
🛡️ Defender
Fact-checked node_8 successfully (75.4% chance)
```

### Inoculation
```
🛡️ Defender
Inoculated node_15 against misinformation
```

### Game Over
```
🏆 Defender
Game Over! defender wins!
```

---

## Strategy Matchups

### 9 Possible Combinations

| Attacker \ Defender | Reactive | Proactive | Bridge Protection |
|---------------------|----------|-----------|-------------------|
| **Greedy Degree**   | Balanced | Def Advantage | Balanced |
| **High Susceptibility** | Atk Advantage | Balanced | Atk Advantage |
| **Bridge Targeting** | Balanced | Atk Advantage | Def Advantage |

**Key Insights**:
- **High Susceptibility** excels against reactive defense (infects before defense reacts)
- **Proactive** counters Greedy Degree (protects hubs early)
- **Bridge Protection** counters Bridge Targeting (same node priorities)

---

## Technical Implementation

### Game Loop
```typescript
1. AI selects move based on strategy
2. Execute move (infect/mutate/factcheck/inoculate)
3. Calculate success probability
4. Apply state changes
5. Log event
6. Check win condition
7. Switch turn
8. Repeat
```

### State Management
- **Immutable Updates**: New state object each turn
- **Event Sourcing**: Complete audit trail of all moves
- **Real-Time UI**: React state triggers immediate re-render

### AI Decision Making
```typescript
1. Get all possible moves (getPossibleMoves)
2. Evaluate each move based on strategy
3. Select best move (highest score/probability)
4. Return move to game engine
```

---

## Usage Tips

### For Users
1. **Strategy Selection**: Try different combinations to see which performs best
2. **Auto-Play**: Use for quick demonstrations
3. **Step Mode**: Use to understand each move's logic
4. **Event Log**: Review to understand why certain moves succeeded/failed
5. **Reset**: Try same network with different strategies

### For Developers
1. **Add New Strategies**: Implement in `ai-strategies.ts`
2. **Adjust Probabilities**: Modify in `game-engine.ts`
3. **Change Win Conditions**: Update in `game-engine.ts` `checkWinCondition()`
4. **Customize Budgets**: Modify `GameConfig` in component

---

## Files Reference

### Core Game Logic
- `src/algorithms/game-engine.ts` - Game state management, move execution
- `src/algorithms/ai-strategies.ts` - AI decision-making algorithms
- `src/schemas/game-state.ts` - Type definitions for game state

### UI Components
- `src/components/CompetitiveMode.tsx` - Main game UI
- `src/components/NetworkVisualizer.tsx` - Graph rendering (shared with A*)

### Shared Logic
- `src/algorithms/propagation.ts` - Acceptance probability calculations
- `src/schemas/node.ts` - Node attributes and state
- `src/schemas/meme.ts` - Meme attributes

---

## Future Enhancements

### Potential Features
1. **Save/Replay**: Record matches for later analysis
2. **Tournament Mode**: Run multiple matches, track wins
3. **Custom Strategies**: User-defined AI logic
4. **Network Effects**: Cascading infections, social proof
5. **Advanced Mutations**: More sophisticated adaptations
6. **Defender Counters**: Defender can "boost" credibility
7. **Multi-Meme**: Multiple competing memes
8. **Partial Resistance**: Nodes can be partially convinced

### Balance Adjustments
1. **Budget Tuning**: Adjust for different network sizes
2. **Win Threshold**: Change infection % for different difficulties
3. **Mutation Effectiveness**: Tweak mutation parameter changes
4. **Fact-Check Success**: Adjust base reversal probability

---

*Document Version: 1.0*
*Created: October 31, 2025*
*Part of: Memetic Warfare Simulation*

