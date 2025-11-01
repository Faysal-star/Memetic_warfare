# ALGORITHM INTEGRATION GUIDE
## Adding AI Algorithm Visualization to Memetic Warfare

---

## OVERVIEW: Three Algorithm Integration Modes

Your simulation can showcase **THREE distinct AI algorithm categories**:

1. **INFORMED SEARCH MODE**: A* and Greedy Best-First Search for targeted influence
2. **ADVERSARIAL SEARCH MODE**: Minimax and Alpha-Beta Pruning for competitive play
3. **LOGIC-BASED MODE**: First-Order Logic for belief reasoning and fact-checking

Each mode demonstrates different AI concepts while maintaining the core information diffusion theme.
---

## MODE 1: INFORMED SEARCH - TARGETED INFLUENCE PATHFINDING

### Concept: "Convince a Specific Person"

**Problem Statement:**
Given:
- Start node S (where you plant the information)
- Target node T (person you want to influence)
- Social network with trust relationships

Find: The optimal path through the network to influence T using A* or Greedy Best-First Search

**Why This Works:**
Instead of spreading to everyone, the AI finds the most effective "influence path" - like routing information through trusted intermediaries to reach a skeptical target.

---

### Algorithm 1: A* for Influence Path

#### State Space Definition

```
State: {
  current_node: Node,
  influenced_nodes: Set<Node>,
  path_taken: [Node],
  cumulative_cost: float,
  target_belief_shift: float
}

Goal Test:
  return current_node == target_node 
         AND target_node.has_accepted_meme

Cost Function:
  g(n) = cumulative_influence_cost
       = sum of (1 - acceptance_probability) for each hop
       // Lower acceptance prob = higher cost to convince
  
  h(n) = heuristic_distance_to_target(n, target)
       = trust_path_distance + belief_alignment_distance
  
  f(n) = g(n) + h(n)
```

#### Heuristic Design (Critical for A*)

```python
FUNCTION heuristic_distance_to_target(current, target, network):
    """
    Admissible heuristic: never overestimates actual cost
    """
    
    # Component 1: Trust-weighted network distance
    # Use Dijkstra to find shortest trust-weighted path
    trust_distance = shortest_trust_path(current, target, network)
    
    # Component 2: Belief alignment gap
    # How far apart are their beliefs?
    belief_gap = |current.political_leaning - target.political_leaning|
    belief_cost = belief_gap * 2.0  # Scale factor
    
    # Component 3: Critical thinking barrier
    # How hard is target to convince?
    resistance_cost = target.critical_thinking * 0.5
    
    # Combined heuristic (must be admissible!)
    h = trust_distance + belief_cost + resistance_cost
    
    RETURN h
```

#### A* Implementation Pseudocode

```python
FUNCTION astar_influence_path(network, start_node, target_node, meme):
    """
    Find optimal influence path from start to target
    """
    
    # Priority queue: (f_score, node, path, influenced_set)
    open_set = PriorityQueue()
    open_set.push((0, start_node, [start_node], {start_node}))
    
    # Track best known cost to each node
    g_scores = {start_node: 0}
    
    # For visualization
    explored_nodes = []
    
    WHILE open_set is not empty:
        f_score, current, path, influenced = open_set.pop()
        
        # Visualization: Mark node as explored
        explored_nodes.append(current)
        visualize_exploration(current, f_score)
        
        # Goal test
        IF current == target_node:
            # Simulate final acceptance
            acceptance_prob = calculate_acceptance(target_node, meme, path[-2])
            IF random() < acceptance_prob:
                RETURN {
                    'success': True,
                    'path': path,
                    'cost': g_scores[current],
                    'explored_count': len(explored_nodes)
                }
        
        # Expand neighbors
        FOR each neighbor IN current.neighbors:
            IF neighbor IN influenced:
                CONTINUE  # Already influenced
            
            # Calculate cost to reach neighbor
            acceptance_prob = calculate_acceptance(neighbor, meme, current)
            step_cost = 1 - acceptance_prob  # Higher prob = lower cost
            
            tentative_g = g_scores[current] + step_cost
            
            # Check if this path is better
            IF neighbor NOT IN g_scores OR tentative_g < g_scores[neighbor]:
                g_scores[neighbor] = tentative_g
                h_score = heuristic_distance_to_target(neighbor, target_node, network)
                f_score = tentative_g + h_score
                
                new_path = path + [neighbor]
                new_influenced = influenced.union({neighbor})
                
                open_set.push((f_score, neighbor, new_path, new_influenced))
                
                # Visualization: Show frontier expansion
                visualize_frontier_node(neighbor, f_score, tentative_g, h_score)
    
    RETURN {'success': False, 'reason': 'No path found'}
```

#### Visualization Components for A*

```
Visual Elements:

1. Node Colors:
   - Gray: Unexplored
   - Yellow: In frontier (open set)
   - Blue: Currently exploring
   - Orange: Explored (closed set)
   - Green: Part of final path
   - Red: Start node
   - Purple: Target node

2. Edge Highlighting:
   - Thin gray: Not explored
   - Thick yellow: Being considered
   - Thick green: Part of final path

3. Information Display (per node):
   - g(n): Cost so far
   - h(n): Heuristic estimate
   - f(n): Total score
   - Acceptance probability

4. Animation:
   - Step-by-step: Show each node expansion
   - Highlight frontier updates
   - Show backtracking when finding better paths
   - Final path animation with success/failure

5. Side Panel:
   - Priority queue contents
   - Current best path
   - Nodes explored count
   - Algorithm progress
```
---

## MODE 2: ADVERSARIAL SEARCH - MINIMAX & ALPHA-BETA PRUNING

### Concept: "Two-Player Information Warfare Game"

**Game Structure:**
- **Maximizer (Attacker)**: Spreads misinformation, wants high infection rate
- **Minimizer (Defender)**: Deploys fact-checks, wants low infection rate
- Turn-based: Players alternate moves
- Perfect information: Both players see full network state

**Game Tree:**
```
                    [Current State: 20% infected]
                    /            |            \
              [Move A1]      [Move A2]      [Move A3]
           Attacker infects  Infects       Infects
              Node 5         Node 12       Node 18
                /    \         /    \        /    \
          [Defender   [Defender    [Defender
           blocks     inoculates   blocks
           Node 8]     Node 15]    Node 20]
              |           |            |
         [30% inf]   [25% inf]    [28% inf]
        (evaluation)  (evaluation)  (evaluation)
```

---

### Algorithm 3: Minimax for Competitive Play

#### Game State Definition

```python
CLASS GameState:
    network: Network
    infected_nodes: Set<Node>
    resistant_nodes: Set<Node>  # Fact-checked
    current_turn: "ATTACKER" or "DEFENDER"
    attacker_budget: int  # Remaining moves
    defender_budget: int
    depth: int  # How deep in game tree
    
    FUNCTION get_possible_moves(self):
        IF self.current_turn == "ATTACKER":
            # Can infect any susceptible neighbor of infected nodes
            moves = []
            FOR each infected_node IN self.infected_nodes:
                FOR each neighbor IN infected_node.neighbors:
                    IF neighbor is susceptible:
                        moves.append(("INFECT", neighbor))
            RETURN moves
        
        ELSE:  # DEFENDER
            # Can fact-check any infected or exposed node
            moves = []
            FOR each node IN self.network.nodes:
                IF node.state IN ["infected", "exposed"]:
                    moves.append(("FACTCHECK", node))
            # Can also inoculate susceptible high-risk nodes
            FOR each node IN high_risk_susceptible_nodes():
                moves.append(("INOCULATE", node))
            RETURN moves
    
    FUNCTION apply_move(self, move):
        # Returns new GameState after applying move
        new_state = self.clone()
        
        IF move[0] == "INFECT":
            node = move[1]
            success_prob = calculate_acceptance(node, meme, ...)
            IF random() < success_prob:
                new_state.infected_nodes.add(node)
        
        ELIF move[0] == "FACTCHECK":
            node = move[1]
            # Fact-check may reverse belief
            reversal_prob = calculate_factcheck_effectiveness(node)
            IF random() < reversal_prob:
                new_state.infected_nodes.remove(node)
                new_state.resistant_nodes.add(node)
        
        ELIF move[0] == "INOCULATE":
            node = move[1]
            new_state.resistant_nodes.add(node)
        
        new_state.current_turn = "DEFENDER" IF self.current_turn == "ATTACKER" ELSE "ATTACKER"
        RETURN new_state
```

#### Evaluation Function (Critical!)

```python
FUNCTION evaluate_game_state(state):
    """
    Positive values favor attacker
    Negative values favor defender
    """
    
    # Component 1: Infection percentage
    infection_rate = len(state.infected_nodes) / len(state.network.nodes)
    infection_score = infection_rate * 100  # 0 to 100
    
    # Component 2: Strategic node control
    strategic_score = 0
    FOR each node IN state.infected_nodes:
        IF node.betweenness_centrality > 0.1:  # Bridge node
            strategic_score += 20
        IF node.degree > average_degree:  # Hub node
            strategic_score += 10
    
    # Component 3: Defender resistance
    resistance_score = len(state.resistant_nodes) * -5
    
    # Component 4: Network reach potential
    # How many susceptible neighbors do infected nodes have?
    potential_reach = 0
    FOR each infected IN state.infected_nodes:
        FOR each neighbor IN infected.neighbors:
            IF neighbor is susceptible:
                potential_reach += 1
    reach_score = potential_reach * 2
    
    # Combined evaluation (attacker perspective)
    total = infection_score + strategic_score + resistance_score + reach_score
    
    RETURN total
```

#### Minimax Implementation

```python
FUNCTION minimax(state, depth, maximizing_player):
    """
    Returns: (best_score, best_move)
    """
    
    # Visualization: Track node being evaluated
    visualize_tree_node(state, depth, "EVALUATING")
    
    # Base case: Terminal node or depth limit
    IF depth == 0 OR game_is_over(state):
        score = evaluate_game_state(state)
        visualize_tree_node(state, depth, f"LEAF: {score}")
        RETURN (score, None)
    
    IF maximizing_player:  # ATTACKER's turn
        max_eval = -infinity
        best_move = None
        
        FOR each move IN state.get_possible_moves():
            # Apply move and get new state
            new_state = state.apply_move(move)
            
            # Recursive call for opponent's response
            eval, _ = minimax(new_state, depth - 1, False)
            
            # Visualization: Show score propagation
            visualize_tree_edge(state, new_state, eval, "MAX")
            
            IF eval > max_eval:
                max_eval = eval
                best_move = move
        
        visualize_tree_node(state, depth, f"MAX: {max_eval}")
        RETURN (max_eval, best_move)
    
    ELSE:  # DEFENDER's turn (minimizing)
        min_eval = infinity
        best_move = None
        
        FOR each move IN state.get_possible_moves():
            new_state = state.apply_move(move)
            eval, _ = minimax(new_state, depth - 1, True)
            
            visualize_tree_edge(state, new_state, eval, "MIN")
            
            IF eval < min_eval:
                min_eval = eval
                best_move = move
        
        visualize_tree_node(state, depth, f"MIN: {min_eval}")
        RETURN (min_eval, best_move)


# Usage:
current_state = get_current_game_state()
score, best_move = minimax(current_state, depth=4, maximizing_player=True)
print(f"Best move: {best_move} with expected score: {score}")
```

---

### Algorithm 4: Alpha-Beta Pruning Optimization

#### Alpha-Beta Enhancement

```python
FUNCTION alphabeta(state, depth, alpha, beta, maximizing_player):
    """
    Same as minimax but prunes branches that won't affect final decision
    
    alpha: Best value maximizer can guarantee (initially -∞)
    beta: Best value minimizer can guarantee (initially +∞)
    """
    
    visualize_tree_node(state, depth, f"α={alpha}, β={beta}")
    
    # Base case
    IF depth == 0 OR game_is_over(state):
        score = evaluate_game_state(state)
        RETURN (score, None)
    
    IF maximizing_player:
        max_eval = -infinity
        best_move = None
        
        FOR each move IN state.get_possible_moves():
            new_state = state.apply_move(move)
            eval, _ = alphabeta(new_state, depth - 1, alpha, beta, False)
            
            IF eval > max_eval:
                max_eval = eval
                best_move = move
            
            alpha = max(alpha, eval)
            
            # PRUNING: Beta cutoff
            IF beta <= alpha:
                visualize_pruning(state, "BETA CUTOFF - Pruned remaining branches")
                BREAK  # Prune remaining siblings
        
        RETURN (max_eval, best_move)
    
    ELSE:
        min_eval = infinity
        best_move = None
        
        FOR each move IN state.get_possible_moves():
            new_state = state.apply_move(move)
            eval, _ = alphabeta(new_state, depth - 1, alpha, beta, True)
            
            IF eval < min_eval:
                min_eval = eval
                best_move = move
            
            beta = min(beta, eval)
            
            # PRUNING: Alpha cutoff
            IF beta <= alpha:
                visualize_pruning(state, "ALPHA CUTOFF - Pruned remaining branches")
                BREAK
        
        RETURN (min_eval, best_move)


# Comparison metrics
minimax_nodes_evaluated = count_minimax_nodes(state, depth=4)
alphabeta_nodes_evaluated = count_alphabeta_nodes(state, depth=4)
pruning_efficiency = 1 - (alphabeta_nodes_evaluated / minimax_nodes_evaluated)
print(f"Pruning efficiency: {pruning_efficiency * 100:.1f}%")
```

#### Game Tree Visualization

```
VISUALIZATION COMPONENTS:

1. Tree Layout (Horizontal or Vertical):
   
   Current State (Root)
   ├── Move A1 [α=-∞, β=+∞]
   │   ├── Opponent M1 [α=-∞, β=+∞]
   │   │   ├── My M1 → eval: 45
   │   │   └── My M2 → eval: 52
   │   │   Result: 45 (minimizer chooses)
   │   └── Opponent M2 [α=-∞, β=45]
   │       ├── My M1 → eval: 38
   │       └── My M2 → PRUNED (β cutoff!)
   │       Result: 38
   │   Result: 38
   ├── Move A2 [α=38, β=+∞]
   │   └── ...
   
2. Node Visualization:
   - Color: Green (maximizer), Red (minimizer), Gray (pruned)
   - Shape: Square (max), Circle (min), X (pruned)
   - Label: Move description + evaluation score
   - Alpha/Beta values displayed

3. Animation Sequence:
   - Step 1: Expand node
   - Step 2: Show children
   - Step 3: Evaluate recursively
   - Step 4: Backpropagate values
   - Step 5: Show pruning when it occurs

4. Statistics Panel:
   - Total nodes in tree: 1024
   - Nodes evaluated by Minimax: 1024
   - Nodes evaluated by Alpha-Beta: 378
   - Nodes pruned: 646 (63%)
   - Time saved: 1.2s → 0.4s
   - Best move: Infect Node 12 (score: 38)

5. Interactive Controls:
   - [Play] - Auto-step through algorithm
   - [Step] - Manual step-by-step
   - [Depth: 4 ▼] - Change search depth
   - [Show Pruning] - Highlight pruned branches
   - [Compare] - Side-by-side Minimax vs Alpha-Beta
```

---

### User Interface for Adversarial Search Mode

```
┌──────────────────────────────────────────────────────────┐
│  MODE: Adversarial Search - Game Tree Visualization      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Game Setup:                                               │
│  - Attacker Budget: [3 moves ▼]                           │
│  - Defender Budget: [3 moves ▼]                           │
│  - Search Depth: [4 ▼]                                    │
│  - Algorithm: [ Alpha-Beta Pruning ▼ ]                    │
│    • Minimax (No pruning)                                 │
│    • Alpha-Beta Pruning                                   │
│    • Compare Both                                         │
│                                                            │
├────────────────────┬─────────────────────────────────────┤
│                    │                                       │
│  GAME STATE        │  GAME TREE VISUALIZATION             │
│  (Network View)    │                                       │
│                    │      [Root: 20% infected]            │
│  Current State:    │     /        |          \            │
│  • Infected: 20%   │  [Move A] [Move B] [Move C]          │
│  • Turn: Attacker  │    /  \      /  \       /  \         │
│  • Depth: 0        │  [D1][D2] [D1][D2]  [D1][D2]         │
│                    │   45  52   38  PRUNE  41  39         │
│  Network shows:    │                                       │
│  - Infected (red)  │  Selected: Move B (score: 38)        │
│  - Resistant (grn) │                                       │
│  - Susceptible(gry)│  Stats:                               │
│                    │  • Nodes evaluated: 378               │
│                    │  • Nodes pruned: 646 (63%)           │
│                    │  • Time: 0.4s                        │
│                    │                                       │
│  [Execute Move]    │  [Step] [Play] [Reset]               │
│                    │                                       │
└────────────────────┴─────────────────────────────────────┘

DECISION EXPLANATION:
> Attacker analyzing position...
> Evaluated Move A (Infect Node 12): Expected outcome 45
> Evaluated Move B (Infect Node 18): Expected outcome 38
> Alpha cutoff at Node B.2 - pruned 4 branches
> Selected Move B: Infect Node 18
> Reasoning: Controls bridge between communities, defender
  has limited options to respond effectively
```

---

## MODE 3: LOGIC-BASED REASONING - FIRST-ORDER LOGIC

### Concept: "Belief Systems and Logical Fact-Checking"

**Use Cases:**
1. **Belief Contradiction Detection**: "Person believes X, but X contradicts Y"
2. **Inference Rules**: "If person believes A and A→B, then person should believe B"
3. **Fact-Checking Logic**: "Claim C is proven false by evidence E"
4. **Trust Propagation**: "If person A trusts B, and B believes X, then A should consider X"

---

### Knowledge Base Structure

```prolog
% Facts about people (nodes)
person(alice).
person(bob).
person(charlie).

% Identity and attributes
identity(alice, urban_professional).
identity(bob, rural_traditional).
critical_thinking(alice, high).
critical_thinking(bob, low).

% Trust relationships
trusts(alice, bob, 0.7).
trusts(bob, charlie, 0.9).

% Current beliefs
believes(alice, climate_change_real).
believes(bob, vaccines_dangerous).
believes(charlie, flat_earth).

% Meme claims
claim(meme_001, climate_change_hoax).
claim(meme_002, vaccines_safe).
claim(meme_003, earth_is_round).

% Evidence and facts
evidence(scientific_consensus, supports, climate_change_real).
evidence(medical_studies, supports, vaccines_safe).
evidence(satellite_images, supports, earth_is_round).

% Contradictions
contradicts(climate_change_real, climate_change_hoax).
contradicts(vaccines_safe, vaccines_dangerous).
contradicts(earth_is_round, flat_earth).

% Inference rules
implies(vaccines_safe, should_vaccinate_children).
implies(climate_change_real, need_carbon_reduction).
```

---

### Algorithm 5: First-Order Logic Inference Engine

#### Contradiction Detection

```python
FUNCTION detect_contradictions(person, new_meme_claim):
    """
    Check if accepting new meme would contradict existing beliefs
    """
    
    contradictions = []
    
    # Query knowledge base for existing beliefs
    existing_beliefs = query_kb(f"believes({person}, X)")
    
    # Check each existing belief against new claim
    FOR each belief IN existing_beliefs:
        # Check direct contradiction
        IF query_kb(f"contradicts({belief}, {new_meme_claim})"):
            contradictions.append({
                'type': 'DIRECT',
                'existing': belief,
                'new': new_meme_claim,
                'severity': 'HIGH'
            })
        
        # Check implied contradiction
        # If believing X implies Y, and new claim contradicts Y
        implied_beliefs = query_kb(f"implies({belief}, Y)")
        FOR each implied IN implied_beliefs:
            IF query_kb(f"contradicts({implied}, {new_meme_claim})"):
                contradictions.append({
                    'type': 'IMPLIED',
                    'existing': belief,
                    'implied': implied,
                    'new': new_meme_claim,
                    'severity': 'MEDIUM'
                })
    
    RETURN contradictions


# Example usage
contradictions = detect_contradictions('bob', 'vaccines_safe')
# Returns: [{'type': 'DIRECT', 'existing': 'vaccines_dangerous', 
#            'new': 'vaccines_safe', 'severity': 'HIGH'}]

# Adjust acceptance probability based on contradictions
IF contradictions:
    IF person.critical_thinking == HIGH:
        # High critical thinking → reject contradictory claims
        acceptance_probability *= 0.1
    ELSE:
        # Low critical thinking → cognitive dissonance, might ignore
        acceptance_probability *= 0.5
```

#### Logical Inference and Belief Propagation

```python
FUNCTION infer_new_beliefs(person):
    """
    Use inference rules to derive new beliefs from existing ones
    """
    
    new_beliefs = []
    existing_beliefs = query_kb(f"believes({person}, X)")
    
    # Rule 1: Modus Ponens (A and A→B implies B)
    FOR each belief IN existing_beliefs:
        implications = query_kb(f"implies({belief}, Y)")
        FOR each implied IN implications:
            IF NOT query_kb(f"believes({person}, {implied})"):
                # Person should logically believe this too
                confidence = calculate_inference_confidence(person, belief, implied)
                new_beliefs.append({
                    'belief': implied,
                    'rule': 'MODUS_PONENS',
                    'source': belief,
                    'confidence': confidence
                })
                
                # Visualization
                visualize_inference_chain(person, belief, implied, "→")
    
    # Rule 2: Trust-based belief transfer
    trusted_people = query_kb(f"trusts({person}, X, T) AND T > 0.7")
    FOR each trusted_person IN trusted_people:
        their_beliefs = query_kb(f"believes({trusted_person}, Y)")
        FOR each their_belief IN their_beliefs:
            IF NOT query_kb(f"believes({person}, {their_belief})"):
                trust_level = query_kb(f"trusts({person}, {trusted_person}, T)")[0]['T']
                new_beliefs.append({
                    'belief': their_belief,
                    'rule': 'TRUST_TRANSFER',
                    'source': trusted_person,
                    'confidence': trust_level
                })
    
    # Rule 3: Evidence-based reasoning
    FOR each belief IN existing_beliefs:
        supporting_evidence = query_kb(f"evidence(E, supports, {belief})")
        contradicting_evidence = query_kb(f"evidence(E, contradicts, {belief})")
        
        # Update belief strength based on evidence
        belief_strength = len(supporting_evidence) - len(contradicting_evidence)
        IF belief_strength < -2 AND person.critical_thinking == HIGH:
            # Strong evidence against, high critical thinking → revise belief
            new_beliefs.append({
                'belief': f"NOT({belief})",
                'rule': 'EVIDENCE_BASED_REVISION',
                'evidence': contradicting_evidence,
                'confidence': 0.8
            })
    
    RETURN new_beliefs
```

#### Fact-Checking with Logical Proofs

```python
FUNCTION fact_check_with_logic(claim, knowledge_base):
    """
    Use formal logic to verify or refute a claim
    """
    
    result = {
        'claim': claim,
        'verdict': None,  # TRUE, FALSE, UNVERIFIABLE
        'proof_chain': [],
        'evidence': [],
        'confidence': 0.0
    }
    
    # Step 1: Check direct evidence
    supporting = query_kb(f"evidence(E, supports, {claim})")
    contradicting = query_kb(f"evidence(E, contradicts, {claim})")
    
    result['evidence'] = {
        'supporting': supporting,
        'contradicting': contradicting
    }
    
    # Step 2: Build logical proof
    IF supporting AND NOT contradicting:
        result['verdict'] = 'TRUE'
        result['proof_chain'] = [
            f"Evidence {supporting[0]} supports {claim}",
            f"No contradicting evidence found",
            f"Therefore, {claim} is TRUE"
        ]
        result['confidence'] = 0.9
    
    ELIF contradicting AND NOT supporting:
        result['verdict'] = 'FALSE'
        result['proof_chain'] = [
            f"Evidence {contradicting[0]} contradicts {claim}",
            f"No supporting evidence found",
            f"Therefore, {claim} is FALSE"
        ]
        result['confidence'] = 0.9
    
    ELSE:
        # Step 3: Try logical derivation
        # Can we prove or disprove using inference rules?
        proof = attempt_logical_proof(claim, knowledge_base)
        IF proof:
            result['verdict'] = proof['conclusion']
            result['proof_chain'] = proof['steps']
            result['confidence'] = proof['confidence']
        ELSE:
            result['verdict'] = 'UNVERIFIABLE'
            result['confidence'] = 0.0
    
    # Visualization
    visualize_proof_tree(result)
    
    RETURN result


FUNCTION attempt_logical_proof(goal, kb, max_depth=5):
    """
    Backward chaining to prove or disprove goal
    """
    
    # Base case: goal is a known fact
    IF query_kb(f"fact({goal})"):
        RETURN {'conclusion': 'TRUE', 'steps': [f"{goal} is a known fact"]}
    
    # Check if goal contradicts known facts
    known_facts = query_kb("fact(X)")
    FOR each fact IN known_facts:
        IF query_kb(f"contradicts({goal}, {fact})"):
            RETURN {
                'conclusion': 'FALSE',
                'steps': [f"{goal} contradicts known fact {fact}"]
            }
    
    # Try to prove using inference rules
    rules = query_kb(f"implies(X, {goal})")
    FOR each rule IN rules:
        antecedent = rule['X']
        # Recursively try to prove antecedent
        sub_proof = attempt_logical_proof(antecedent, kb, max_depth - 1)
        IF sub_proof AND sub_proof['conclusion'] == 'TRUE':
            RETURN {
                'conclusion': 'TRUE',
                'steps': sub_proof['steps'] + [f"Since {antecedent} is true, {goal} is true"]
            }
    
    # Cannot prove or disprove
    RETURN None
```

---

### Logic Visualization Components

```
VISUALIZATION TYPES:

1. Belief Network Graph:
   - Nodes: Beliefs
   - Edges: Logical relationships
     • Solid arrow: Implies
     • Dashed arrow: Contradicts
     • Dotted arrow: Supports (evidence)
   - Colors:
     • Green: Proven true
     • Red: Proven false
     • Yellow: Uncertain
     • Gray: Not yet evaluated

2. Proof Tree Visualization:
   
   Goal: Prove "vaccines_safe"
   │
   ├─ Check evidence
   │  └─ medical_studies supports vaccines_safe ✓
   │
   ├─ Check contradictions
   │  └─ No direct contradictions found ✓
   │
   └─ Logical inference
      └─ scientific_consensus implies trust_medical_studies
         └─ trust_medical_studies implies vaccines_safe
            └─ Therefore: vaccines_safe is TRUE (confidence: 0.85)

3. Inference Chain Animation:
   Step 1: Person believes "A"
   Step 2: Rule states "A → B"
   Step 3: Therefore, person infers "B"
   Step 4: B contradicts existing belief "C"
   Step 5: Cognitive dissonance detected!

4. Fact-Check Report Display:
   
   ╔══════════════════════════════════════════╗
   ║ FACT-CHECK REPORT                        ║
   ╠══════════════════════════════════════════╣
   ║ Claim: "Vaccines cause autism"           ║
   ║ Verdict: FALSE                           ║
   ║ Confidence: 95%                          ║
   ╠══════════════════════════════════════════╣
   ║ Evidence:                                ║
   ║ ✓ CDC Study (2018): No link found       ║
   ║ ✓ WHO Report: Debunked                  ║
   ║ ✗ Retracted Wakefield study (1998)      ║
   ╠══════════════════════════════════════════╣
   ║ Logical Proof:                           ║
   ║ 1. Multiple peer-reviewed studies       ║
   ║    show no correlation                   ║
   ║ 2. Original claim based on retracted    ║
   ║    fraudulent research                   ║
   ║ 3. Therefore: Claim is FALSE             ║
   ╚══════════════════════════════════════════╝
```

---

### User Interface for Logic-Based Mode

```
┌─────────────────────────────────────────────────────────┐
│  MODE: Logic-Based Reasoning                            │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Knowledge Base Management:                              │
│  [Add Fact] [Add Rule] [Add Evidence] [View KB]         │
│                                                           │
├────────────────────┬────────────────────────────────────┤
│                    │                                      │
│  NETWORK VIEW      │  LOGICAL INFERENCE                  │
│                    │                                      │
│  (Belief network)  │  Selected Person: Alice              │
│                    │                                      │
│  Alice (Urban Pro) │  Current Beliefs:                   │
│  • climate_change  │  • climate_change_real              │
│  • vaccines_safe   │  • vaccines_safe                    │
│                    │                                      │
│  Receiving meme:   │  New Claim: climate_change_hoax     │
│  "Climate hoax"    │                                      │
│                    │  Contradiction Check:                │
│                    │  ⚠ CONFLICT DETECTED                │
│                    │  • Existing: climate_change_real    │
│                    │  • New: climate_change_hoax         │
│                    │  • Severity: HIGH                   │
│                    │                                      │
│                    │  Critical Thinking: HIGH             │
│                    │  → Rejection likely (90%)           │
│                    │                                      │
│                    │  Evidence:                           │
│                    │  ✓ scientific_consensus supports    │
│                    │    climate_change_real              │
│                    │                                      │
│  [Simulate Logic]  │  [Show Proof] [Run Inference]       │
│                    │                                      │
└────────────────────┴────────────────────────────────────┘

INFERENCE LOG:
> Evaluating meme acceptance for Alice...
> Checking existing beliefs...
> Found belief: climate_change_real
> Detecting contradictions...
> CONTRADICTION: climate_change_hoax contradicts climate_change_real
> Alice has HIGH critical thinking
> Querying evidence for climate_change_real...
> Found supporting evidence: scientific_consensus
> Calculating acceptance probability...
> Base: 0.3 → Contradiction penalty: 0.1x → Evidence bonus: 1.2x
> Final probability: 0.036 (3.6%)
> Result: REJECTED
```

---

## INTEGRATION STRATEGY: Combining All Three Modes

### Unified Architecture

```
┌──────────────────────────────────────────────────────────┐
│              MEMETIC WARFARE - MAIN MENU                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Select Algorithm Demonstration Mode:                     │
│                                                            │
│  [1] Informed Search Mode                                 │
│      • A* Pathfinding                                     │
│                                                           │
│      Goal: Find optimal influence path to target          │
│                                                            │
│  [2] Adversarial Search Mode                              │
│      • Minimax                                            │
│      • Alpha-Beta Pruning                                 │
│      Goal: Two-player competitive strategy                │
│                                                            │
│  [3] Logic-Based Mode                                     │
│      • First-Order Logic                                  │
│      • Belief Inference                                   │
│      Goal: Logical reasoning about beliefs                │
│                                                            │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## TECHNICAL IMPLEMENTATION NOTES

### Data Structure Recommendations

```javascript
// For A* / Greedy Best-First
class PriorityQueue {
    // Use binary heap for O(log n) insertion
    // Store tuples: (priority, node, path, cost)
}

class AStarVisualizer {
    openSet: Set<Node>      // Yellow nodes
    closedSet: Set<Node>    // Orange nodes
    gScores: Map<Node, number>
    fScores: Map<Node, number>
    animationFrames: Array<VisualizationState>
}

// For Minimax / Alpha-Beta
class GameTreeNode {
    state: GameState
    children: Array<GameTreeNode>
    value: number
    alpha: number
    beta: number
    isPruned: boolean
    bestMove: Move
}

class GameTreeVisualizer {
    renderTreeLayout()      // D3.js tree layout
    animateNodeExpansion()
    highlightPruning()
}

// For First-Order Logic
class KnowledgeBase {
    facts: Set<Predicate>
    rules: Set<Rule>
    evidence: Map<Claim, Evidence>
    
    query(pattern: string): Array<Binding>
    infer(person: Person): Array<Belief>
    detectContradictions(person, claim): Array<Contradiction>
}

class LogicVisualizer {
    renderBeliefNetwork()   // Graph of beliefs
    renderProofTree()       // Tree of inference steps
    animateInferenceChain()
}
```

### Performance Considerations

```
A* :
- Priority queue: Use binary heap (not naive array)
- Heuristic calculation: Precompute when possible
- Path reconstruction: Store parent pointers
- Max nodes: 100 (A* can handle this in <100ms)

Minimax / Alpha-Beta:
- Move ordering: Evaluate best moves first (better pruning)
- Depth limit: Start with 3-4, increase if fast enough
- Iterative deepening: For time-constrained search
- Transposition table: Cache evaluated positions (advanced)

First-Order Logic:
- Query optimization: Index predicates
- Proof search: Limit depth to prevent infinite loops
- Evidence lookup: Hash map for O(1) access
- Rule chaining: Max 5 inference steps
```

