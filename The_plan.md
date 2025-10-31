# MEMETIC WARFARE - PROJECT PLAN & IMPLEMENTATION GUIDE
**Information Diffusion Simulation: AI vs AI**

---

## PHASE 1: BRAINSTORMING & CONCEPT VALIDATION

### 1.1 Core Game Concept Analysis

**Your Vision:**
- AI-driven information spreading simulation (not human-played)
- Meme packets with multi-dimensional attributes
- Node-based social network with identity classes
- Trust-based propagation mechanism
- Two modes: Solo spreading vs Competitive spreading/preventing

**Strengths of This Concept:**
✅ **Educational Value**: Demonstrates real-world information dynamics
✅ **Visual Appeal**: Network propagation creates compelling visualizations
✅ **Algorithmic Focus**: Pure AI demonstration (like A* pathfinding viz)
✅ **Scalable Complexity**: Can start simple, add sophistication
✅ **Relevant Topic**: Timely given misinformation concerns

**Potential Challenges:**
⚠️ **Abstraction Gap**: Users need to understand what they're watching
⚠️ **Parameter Complexity**: 7-8 meme dimensions + node attributes = high dimensional
⚠️ **Validation**: How do users know the simulation is "working correctly"?
⚠️ **Engagement**: Watching AI play requires compelling presentation

---

### 1.2 Game Concept Validation & Refinement

#### **VALIDATED CONCEPT:**

**Core Gameplay Loop:**
```
INPUT PHASE:
1. User configures network (size, identity distributions)
2. User creates/selects meme packet(s)
3. User selects simulation mode (Solo/Competitive)
4. User chooses AI strategy to test

SIMULATION PHASE:
5. AI selects starting node(s) strategically
6. Information spreads based on:
   - Node-to-node trust scores
   - Meme-to-node bias alignment
   - Network topology
7. Meme variants emerge during propagation
8. Counter-AI (if enabled) deploys fact-checks

OUTPUT PHASE:
9. Visualize spread patterns in real-time
10. Display metrics (reach, speed, efficiency)
11. Compare different strategies/parameters
```

#### **REFINED MEME MODEL:**

Instead of arbitrary 7-8 parameters, use **meaningful dimensions**:

```json
{
  "id": "meme_001",
  "content_type": "conspiracy",
  
  // Core Attributes (0-1 scale)
  "political_bias": 0.8,      // -1(left) to +1(right)
  "emotional_intensity": 0.9,  // 0(neutral) to 1(extreme)
  "factual_accuracy": 0.2,     // 0(false) to 1(true)
  "complexity": 0.3,           // 0(simple) to 1(complex)
  "virality_factor": 0.7,      // 0(boring) to 1(shareable)
  
  // Metadata
  "source_credibility": 0.5,   // 0(unknown) to 1(trusted)
  "timestamp": 0,              // Game time
  "generation": 0,             // 0=original, 1+=variant
  "parent_id": null            // For tracking mutations
}
```

**Why This Works:**
- Each dimension has clear semantic meaning
- Political bias enables polarization simulation
- Emotional intensity drives sharing behavior
- Factual accuracy enables fact-checking mechanics
- Complexity affects comprehension barriers

#### **REFINED NODE MODEL:**

```json
{
  "id": "person_042",
  "identity_class": "urban_university",
  
  // Belief Profile (matches meme dimensions)
  "political_leaning": 0.3,
  "emotional_susceptibility": 0.6,
  "critical_thinking": 0.7,     // Resistance to low-accuracy info
  "education_level": 0.8,        // Affects complexity tolerance
  "social_activity": 0.6,        // Affects sharing probability
  
  // Network Properties
  "trust_network": {             // Who they trust (and how much)
    "person_015": 0.9,
    "person_023": 0.7,
    // ...
  },
  
  // State
  "current_beliefs": [],         // What memes they've accepted
  "exposure_history": [],        // What they've seen
  "state": "susceptible"         // susceptible|exposed|infected|resistant
}
```

#### **IDENTITY CLASS SYSTEM:**

**Base Classes with Bias Profiles:**
1. **Urban Professional**
   - High critical thinking (0.7-0.9)
   - Moderate political variance
   - High social activity

2. **University Student**
   - High education (0.7-0.9)
   - High emotional susceptibility (0.6-0.8)
   - Very high social activity

3. **Rural Traditional**
   - Moderate-low critical thinking (0.4-0.6)
   - Conservative political bias (0.6-0.9)
   - Lower social activity

4. **Suburban Family**
   - Moderate on all dimensions
   - High trust in local network
   - Balanced profile

5. **Tech Worker**
   - Very high critical thinking (0.8-1.0)
   - Low emotional susceptibility
   - High complexity tolerance

**Implementation Strategy:**
- Each class has a **base profile template**
- Individual instances add **Gaussian noise** (±0.1-0.2) to each attribute
- This creates variety while maintaining class characteristics

---

### 1.3 Propagation Mechanics Validation

#### **ACCEPTANCE PROBABILITY MODEL:**

When node N receives meme M from trusted neighbor T:

```
P(accept) = BASE_RECEPTIVITY × TRUST_FACTOR × ALIGNMENT_SCORE × VIRALITY_BOOST

Where:
BASE_RECEPTIVITY = 0.3 (baseline willingness to accept)

TRUST_FACTOR = trust_network[T] 
              // 0.0 to 1.0 based on relationship

ALIGNMENT_SCORE = 1 - |N.political_leaning - M.political_bias| 
                × (1 - N.critical_thinking × (1 - M.factual_accuracy))
                × complexity_match_factor
              // How well meme matches node beliefs

VIRALITY_BOOST = 1 + (M.virality_factor × N.emotional_susceptibility)
              // Emotional/viral content spreads easier

FINAL: P(accept) = clamp(calculated_value, 0.05, 0.95)
```

**Why This Works:**
- Trust amplifies acceptance (realistic social proof)
- Alignment prevents bizarre acceptances (echo chamber effect)
- Critical thinking filters low-accuracy content (education matters)
- Virality creates "irrational" spread (emotional bypass)
- Clamped to prevent certainties (uncertainty always exists)

#### **TRANSMISSION PROBABILITY MODEL:**

Once a node accepts a meme, will they share it?

```
P(transmit) = N.social_activity 
            × M.virality_factor 
            × (1 + M.emotional_intensity × 0.5)
            × NOVELTY_FACTOR

Where:
NOVELTY_FACTOR = max(0.3, 1 - (days_since_infected / 7))
                // People stop sharing old news
```

---

### 1.4 Game Modes Validation

#### **MODE 1: SOLO DIFFUSION**
**Objective:** Maximize information reach in minimum time

**User Interactions:**
1. Design meme attributes
2. Configure network topology
3. Select AI strategy:
   - Random starting point
   - Highest-degree node (hub targeting)
   - Highest-centrality (bridge targeting)
   - CELF algorithm (optimal greedy)

**Success Metrics:**
- Final infection percentage
- Time to 50% saturation
- Number of distinct communities reached

**Educational Value:**
- Shows why targeting matters
- Demonstrates network effects
- Reveals echo chamber formation

#### **MODE 2: COMPETITIVE DIFFUSION**
**Objective:** Attacker spreads misinformation vs Defender fact-checks

**Mechanics:**
- **Attacker AI:** Deploys low-accuracy, high-virality memes
- **Defender AI:** Deploys high-accuracy counter-memes
- **Turn-based OR simultaneous** (user choice)
- **Resource constraints:** Limited interventions per turn

**Defender Strategies:**
1. **Reactive:** Fact-check infected nodes
2. **Proactive:** Inoculate high-risk nodes
3. **Bridge Protection:** Secure inter-community connectors
4. **Source Targeting:** Discredit the attacker's credibility

**Win Conditions:**
- Attacker: Achieve >60% network infection
- Defender: Keep infection <40% after N rounds
- OR: Most influence after time limit

**Why This Works:**
- Creates narrative tension (good vs evil)
- Demonstrates real-world information warfare
- Shows why early response matters
- Reveals defensive strategy effectiveness

---

### 1.5 Identified Issues & Solutions

#### **Issue 1: Too Many Parameters**
**Problem:** 7-8 meme dimensions + node attributes = overwhelming
**Solution:** 
- Use 5 core dimensions (validated above)
- Provide presets ("Political Conspiracy", "Health Misinformation")
- Visual encoding (color=political, size=virality, etc.)

#### **Issue 2: Unclear Victory Conditions**
**Problem:** What makes a "good" result?
**Solution:**
- Clear percentage thresholds
- Visual progress bars
- Comparison to baseline strategies
- Historical best scores

#### **Issue 3: Simulation Validation**
**Problem:** How do users know it's realistic?
**Solution:**
- Reference real-world case studies (e.g., 2016 election memes)
- Show emergent behaviors (echo chambers, super spreaders)
- Validate against literature (cite Kempe et al. metrics)
- Include "sanity check" scenarios with predictable outcomes

#### **Issue 4: Watching AI is Boring**
**Problem:** Users might lose interest watching algorithms
**Solution:**
- **Speed controls** (1x, 5x, 10x, instant)
- **Pause and inspect** any moment
- **Step-by-step mode** for learning
- **Narrative captions** explaining AI decisions
- **Statistics dashboard** showing real-time metrics
- **Event log** highlighting key moments

---

## PHASE 2: PROJECT ARCHITECTURE

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  • Configuration Panel (network, memes, AI strategy)         │
│  • Visualization Canvas (network graph + animations)         │
│  • Control Panel (play/pause/reset/speed)                    │
│  • Metrics Dashboard (real-time statistics)                  │
│  • Event Log (AI decisions narrative)                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   SIMULATION ENGINE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  • Network Manager (graph structure, topology)               │
│  • State Manager (node states, meme tracking)                │
│  • Propagation Engine (acceptance/transmission logic)        │
│  • Time Controller (game loop, timesteps)                    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        AI AGENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  • Spreader AI (influence maximization algorithms)           │
│  • Defender AI (fact-checking strategies)                    │
│  • Strategy Library (CELF, Greedy, Heuristics, A*)           │
│  • Decision Explainer (why AI chose action X)                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                        DATA LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  • Network Topology Data (nodes, edges, trust weights)       │
│  • Meme Library (templates, variants, history)               │
│  • Simulation History (replay capability)                    │
│  • Preset Configurations (example scenarios)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## PHASE 4: IMPLEMENTATION GUIDELINES

### 4.1 Demo Core Algorithm Pseudocode

#### **Network Generation Algorithm**

```
FUNCTION generateNetwork(size, identityDistribution, networkType):
    nodes = []
    
    // Step 1: Create nodes with identity classes
    FOR each identityClass, proportion IN identityDistribution:
        count = size × proportion
        FOR i = 1 TO count:
            node = createNode(identityClass)
            node.attributes = identityClass.baseProfile + randomNoise()
            nodes.append(node)
    
    // Step 2: Generate edges based on network type
    IF networkType == "small-world":
        edges = generateSmallWorld(nodes, k=6, p=0.1)
    ELSE IF networkType == "scale-free":
        edges = generatePreferentialAttachment(nodes, m=3)
    ELSE:
        edges = generateRandom(nodes, avgDegree=5)
    
    // Step 3: Calculate trust weights
    FOR each edge (A, B):
        baseTrust = 0.5
        
        IF A.identityClass == B.identityClass:
            baseTrust += 0.2  // Homophily bonus
        
        politicalDistance = |A.political_leaning - B.political_leaning|
        alignmentBonus = (1 - politicalDistance) × 0.3
        baseTrust += alignmentBonus
        
        edge.trustWeight = clamp(baseTrust, 0.1, 0.95)
    
    RETURN Network(nodes, edges)
```

#### **Propagation Step Algorithm**

```
FUNCTION simulationStep(network, currentlyInfected, activeMemes):
    newInfections = []
    
    // Process each infected node
    FOR each infectedNode IN currentlyInfected:
        meme = infectedNode.currentMeme
        
        // Try to transmit to neighbors
        FOR each neighbor IN infectedNode.neighbors:
            IF neighbor.state != "susceptible":
                CONTINUE  // Already infected or resistant
            
            // Calculate transmission probability
            pTransmit = calculateTransmissionProbability(
                infectedNode, meme
            )
            
            IF random() < pTransmit:
                // Meme reaches neighbor
                neighbor.state = "exposed"
                neighbor.exposedTo.append(meme)
                
                // Calculate acceptance probability
                pAccept = calculateAcceptanceProbability(
                    neighbor, meme, infectedNode, trustWeight
                )
                
                IF random() < pAccept:
                    // Neighbor accepts meme
                    acceptedMeme = possiblyMutate(meme)
                    neighbor.infect(acceptedMeme)
                    newInfections.append(neighbor)
                    
                    // Log event
                    logEvent(f"Node {neighbor.id} infected by {infectedNode.id}")
    
    // Update state
    currentlyInfected.extend(newInfections)
    
    RETURN newInfections
```

#### **Acceptance Probability Calculation**

```
FUNCTION calculateAcceptanceProbability(node, meme, source, trustWeight):
    baseReceptivity = 0.3
    
    // Trust factor
    trustFactor = trustWeight  // 0 to 1
    
    // Political alignment
    politicalDistance = |node.political_leaning - meme.political_bias|
    politicalAlignment = 1 - politicalDistance  // 0 to 1
    
    // Critical thinking filter (for low-accuracy memes)
    IF meme.factual_accuracy < 0.5:
        criticalThinkingPenalty = node.critical_thinking × (1 - meme.factual_accuracy)
    ELSE:
        criticalThinkingPenalty = 0
    
    alignmentScore = politicalAlignment × (1 - criticalThinkingPenalty)
    
    // Virality boost
    viralityBoost = 1 + (meme.virality_factor × node.emotional_susceptibility)
    
    // Combine factors
    probability = baseReceptivity × trustFactor × alignmentScore × viralityBoost
    
    RETURN clamp(probability, 0.05, 0.95)
```

#### **AI Seed Selection (Greedy Degree)**

```
FUNCTION selectSeedGreedyDegree(network, budget):
    selectedSeeds = []
    
    FOR i = 1 TO budget:
        bestNode = null
        bestDegree = -1
        
        FOR each node IN network.nodes:
            IF node IN selectedSeeds:
                CONTINUE
            
            IF node.degree > bestDegree:
                bestNode = node
                bestDegree = node.degree
        
        selectedSeeds.append(bestNode)
        logDecision(f"Selected {bestNode.id} (degree={bestDegree})")
    
    RETURN selectedSeeds
```

#### **Defender AI (Reactive Strategy)**

```
FUNCTION defenderReactive(network, budget):
    // Find all infected nodes
    infectedNodes = network.getInfectedNodes()
    
    // Calculate threat score for each neighbor
    threatScores = []
    FOR each node IN network.nodes:
        IF node.state == "susceptible":
            threatScore = 0
            FOR each neighbor IN node.neighbors:
                IF neighbor IN infectedNodes:
                    threatScore += 1 / node.degree  // Normalized
            
            threatScores.append((node, threatScore))
    
    // Sort by threat (highest first)
    threatScores.sort(reverse=True)
    
    // Deploy fact-checks to highest-threat nodes
    targets = threatScores[:budget]
    FOR each (node, score) IN targets:
        deployFactCheck(node)
        logDecision(f"Fact-checking {node.id} (threat={score:.2f})")
    
    RETURN targets
```

---

### 4.2 Data Flow & State Management

#### **State Structure (Zustand)**

```javascript
// simulationStore.js structure (conceptual)
{
  // Configuration
  config: {
    networkSize: 50,
    identityDistribution: { urban: 0.4, rural: 0.3, student: 0.3 },
    networkType: "small-world",
    simulationMode: "solo"  // or "competitive"
  },
  
  // Network data
  network: {
    nodes: [...],  // Array of Node objects
    edges: [...],  // Array of {source, target, trust} objects
  },
  
  // Simulation state
  simulation: {
    state: "IDLE",  // IDLE | RUNNING | PAUSED | FINISHED
    currentStep: 0,
    timeElapsed: 0,
    speed: 1  // Multiplier
  },
  
  // Active memes
  memes: [
    { id: "meme_001", ...attributes, infectedNodes: [...] }
  ],
  
  // AI state
  ai: {
    attackerStrategy: "greedyDegree",
    defenderStrategy: "reactive",
    attackerBudget: 3,
    defenderBudget: 3
  },
  
  // Metrics
  metrics: {
    totalInfected: 0,
    infectionTimeline: [[0, 0], [1, 3], [2, 8], ...],
    communityPenetration: {...}
  },
  
  // Event log
  events: [
    { time: 0, type: "SEED_SELECTED", data: {...} },
    { time: 1, type: "NODE_INFECTED", data: {...} },
    ...
  ]
}
```

#### **Key State Update Patterns**

```javascript
// Pattern 1: Start simulation
startSimulation: () => {
  set(state => ({
    simulation: {
      ...state.simulation,
      state: "RUNNING",
      currentStep: 0
    }
  }))
  // Kick off game loop
}

// Pattern 2: Update after simulation step
updateAfterStep: (newInfections, events) => {
  set(state => ({
    simulation: {
      ...state.simulation,
      currentStep: state.simulation.currentStep + 1
    },
    metrics: {
      ...state.metrics,
      totalInfected: state.metrics.totalInfected + newInfections.length,
      infectionTimeline: [
        ...state.metrics.infectionTimeline,
        [state.simulation.currentStep, state.metrics.totalInfected + newInfections.length]
      ]
    },
    events: [...state.events, ...events]
  }))
}

// Pattern 3: Reset simulation
resetSimulation: () => {
  set(state => ({
    simulation: { state: "IDLE", currentStep: 0, timeElapsed: 0 },
    memes: [],
    metrics: { totalInfected: 0, infectionTimeline: [[0, 0]] },
    events: []
    // Keep network and config
  }))
}
```

---

### 4.3 Visualization Guidelines

#### **Node Visual Encoding**

```
State Encoding (Color):
- Susceptible: Gray (#9CA3AF)
- Exposed: Yellow (#FBBF24) - saw meme but hasn't accepted
- Infected: Red (#EF4444) - accepted and spreading
- Resistant/Fact-checked: Green (#10B981)

Size Encoding:
- Base size: 5px
- Scale by social_activity: size = 5 + (social_activity × 5)
  // Active users are larger
  
Border Encoding:
- No border: Normal node
- Thick border: Recently infected (last 3 steps)
- Dashed border: Selected by AI as seed

Label:
- Show ID on hover
- Show detailed stats in tooltip
```

#### **Edge Visual Encoding**

```
Thickness Encoding:
- Proportional to trust weight
- thickness = 1 + (trustWeight × 3)

Color Encoding:
- Gray: No recent transmission
- Orange (animated): Active transmission path
- Pulse effect when meme travels

Particle Animation:
- When meme transmits from A to B:
  - Spawn colored particle at A
  - Animate along edge to B over 500ms
  - Particle color matches meme type
  - Explosion effect on arrival
```

#### **Animation Timing**

```
Simulation Speed Settings:
- 0.5x: 2000ms per step (slow-mo for learning)
- 1x: 1000ms per step (normal)
- 2x: 500ms per step
- 5x: 200ms per step
- 10x: 100ms per step
- Instant: No animation, show final result

Transition Durations:
- Node color change: 300ms ease-in-out
- Particle travel: 500ms linear
- Layout adjustment: 1000ms ease-in-out
```

---


#### **Manual Testing Checklist**

```
[ ] Can generate networks of various sizes (20, 50, 100)
[ ] Identity distribution matches sliders
[ ] Network looks visually distinct (small-world vs random)
[ ] Can design custom meme with all attributes
[ ] Preset memes load correctly
[ ] Clicking node infects it
[ ] Simulation spreads information believably
[ ] Pause/resume works correctly
[ ] Speed controls change animation speed
[ ] Metrics update in real-time
[ ] Event log shows AI decisions
[ ] Can compare different strategies side-by-side
[ ] Defender AI actually reduces spread
[ ] No crashes after 5 minutes continuous run
```

---

### 4.5 Validation & Realism Checks

#### **Sanity Check Scenarios**

```
Scenario 1: "Echo Chamber"
Setup:
- 20 nodes, all Urban Progressive (political_leaning = -0.8)
- Deploy left-wing political meme (bias = -0.9)
Expected: >90% infection rate
Validates: Homophily drives spread

Scenario 2: "Bridge Blocker"
Setup:
- Two communities (10 urban + 10 rural)
- Single bridge node connecting them
- Infect urban side, defender fact-checks bridge
Expected: Urban side infected, rural side protected
Validates: Defender strategy effectiveness

Scenario 3: "Low Quality Filter"
Setup:
- All nodes high critical_thinking (0.8+)
- Deploy low factual_accuracy meme (0.2)
Expected: <30% infection rate
Validates: Critical thinking filters misinformation

Scenario 4: "Viral Emotion"
Setup:
- Deploy meme: high emotional_intensity (0.9) + high virality (0.8)
- Compare to neutral meme (emotion=0.2, virality=0.3)
Expected: Viral meme spreads 2-3x faster
Validates: Emotional content spreads faster
```

#### **Comparison to Literature**

```
Benchmark Against Published Results:
1. Greedy algorithm should achieve ~63% of optimal
   - Run optimal (exhaustive) on 20-node network
   - Run greedy on same network
   - Verify ratio ≈ 0.63

2. High-degree targeting should beat random by 40-60%
   - Run 100 simulations with random seeds
   - Run 100 simulations with degree-based seeds
   - Average ratio should be 1.4-1.6

3. Early defender intervention more effective
   - Defender intervenes at step 2 vs step 10
   - Early intervention should reduce spread by 2x+
```

---

## APPENDIX A: Parameter Reference Guide

### Identity Class Base Profiles

```
Urban Professional:
  political_leaning: -0.2 to 0.2 (moderate)
  critical_thinking: 0.7 to 0.9 (high)
  emotional_susceptibility: 0.3 to 0.5 (low-moderate)
  education_level: 0.7 to 0.9 (high)
  social_activity: 0.6 to 0.8 (high)

University Student:
  political_leaning: -0.4 to 0.4 (varied)
  critical_thinking: 0.6 to 0.8 (moderate-high)
  emotional_susceptibility: 0.6 to 0.8 (high)
  education_level: 0.6 to 0.9 (moderate-high)
  social_activity: 0.7 to 0.9 (very high)

Rural Traditional:
  political_leaning: 0.4 to 0.8 (conservative)
  critical_thinking: 0.4 to 0.6 (moderate)
  emotional_susceptibility: 0.5 to 0.7 (moderate-high)
  education_level: 0.3 to 0.6 (low-moderate)
  social_activity: 0.3 to 0.5 (low-moderate)

Suburban Family:
  political_leaning: -0.1 to 0.3 (moderate)
  critical_thinking: 0.5 to 0.7 (moderate)
  emotional_susceptibility: 0.4 to 0.6 (moderate)
  education_level: 0.5 to 0.7 (moderate)
  social_activity: 0.4 to 0.6 (moderate)

Tech Worker:
  political_leaning: -0.5 to 0.1 (liberal-moderate)
  critical_thinking: 0.8 to 1.0 (very high)
  emotional_susceptibility: 0.2 to 0.4 (low)
  education_level: 0.8 to 1.0 (very high)
  social_activity: 0.5 to 0.7 (moderate-high)
```

### Meme Presets

```
Political Conspiracy:
  political_bias: 0.8 (right-wing)
  emotional_intensity: 0.9 (very high)
  factual_accuracy: 0.2 (very low)
  complexity: 0.3 (simple narrative)
  virality_factor: 0.8 (highly shareable)

Health Misinformation:
  political_bias: 0.0 (non-partisan)
  emotional_intensity: 0.7 (fear-based)
  factual_accuracy: 0.3 (misleading)
  complexity: 0.4 (somewhat technical)
  virality_factor: 0.6 (moderately viral)

Factual News:
  political_bias: 0.0 (neutral)
  emotional_intensity: 0.3 (calm)
  factual_accuracy: 0.9 (high accuracy)
  complexity: 0.6 (moderate detail)
  virality_factor: 0.3 (less shareable)
```

---

## APPENDIX B: Common Pitfalls & Solutions

**Pitfall 1: Simulation Always Saturates**
- **Symptom:** Every simulation reaches 90%+ infection
- **Cause:** Acceptance probabilities too high
- **Solution:** Reduce BASE_RECEPTIVITY from 0.3 to 0.15
- **Solution:** Increase critical_thinking impact

**Pitfall 2: Nothing Spreads**
- **Symptom:** Infection stops after 2-3 nodes
- **Cause:** Acceptance probabilities too low or trust too low
- **Solution:** Check trust weight generation (should be 0.3-0.8 range)
- **Solution:** Increase BASE_RECEPTIVITY

**Pitfall 3: AI Strategies Perform Identically**
- **Symptom:** Random and Greedy have same outcomes
- **Cause:** Network topology or seed budget
- **Solution:** Use scale-free networks (highlight importance of hubs)
- **Solution:** Increase seed budget (differences more apparent with k=5 vs k=1)

**Pitfall 4: Visualization Becomes Unreadable**
- **Symptom:** Too many overlapping nodes
- **Cause:** Force layout not converging
- **Solution:** Adjust force parameters (charge, link distance)
- **Solution:** Implement clustering/community layout
- **Solution:** Add zoom and pan controls

**Pitfall 5: Defender Always Loses**
- **Symptom:** Defender can't stop attacker regardless of strategy
- **Cause:** Fact-checking effectiveness too low
- **Solution:** Increase fact-check acceptance probability
- **Solution:** Add "inoculation" effect (nearby nodes become resistant)
- **Solution:** Give defender 1.5x budget of attacker

---
