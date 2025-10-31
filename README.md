# Memetic Warfare - Information Diffusion Simulation

An AI-driven information spreading simulation that demonstrates how memes propagate through social networks using A* pathfinding visualization.

## Features

### ✅ Implemented
- **Network Generation**: Three topology types (Small-World, Scale-Free, Random)
- **Identity Classes**: 5 distinct social profiles with unique attributes
- **Meme System**: Content types with multi-dimensional attributes
- **A* Pathfinding**: Visualize optimal influence paths through networks
- **Interactive Visualization**: Clickable, hoverable nodes with real-time info
- **Propagation Engine**: Realistic information spread mechanics
- **API Routes**: RESTful endpoints for network and meme data

### 🎯 Core Components

#### Network Pipeline
- Generate networks with configurable size and topology
- 5 identity classes: Urban Professional, University Student, Rural Traditional, Suburban Family, Tech Worker
- Trust-based relationships with homophily and political alignment
- Automatic trust weight calculation

#### Meme Pipeline
- 4 content types: Political Conspiracy, Health Misinformation, Factual News, Neutral
- 6 meme attributes: political_bias, emotional_intensity, factual_accuracy, complexity, virality_factor, source_credibility
- Preset templates for quick testing
- Meme variant generation (mutations)

#### Algorithms
1. **A* Pathfinding**: Find optimal influence paths considering:
   - Trust-weighted distances
   - Belief alignment gaps
   - Critical thinking barriers
   
2. **Network Generation**:
   - Erdős-Rényi (Random)
   - Watts-Strogatz (Small-World)
   - Barabási-Albert (Scale-Free)

3. **Propagation Mechanics**:
   - Acceptance probability (trust × alignment × virality)
   - Transmission probability (social activity × virality × novelty)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Usage

### A* Visualization Mode

1. **Select Start Node**: Click any node in the graph
2. **Select End Node**: Click another node as the target
3. **Run A* Algorithm**: Click the button to find the optimal path
4. **Watch Animation**: Use playback controls to see the algorithm in action
5. **Adjust Settings**: Change network type or meme attributes

### API Endpoints

#### Network API
```bash
# Get network presets list
GET /api/network?action=list

# Generate default network
GET /api/network

# Generate from preset
GET /api/network?preset=default_small

# Generate custom network
POST /api/network
{
  "config": {
    "size": 50,
    "type": "small-world",
    "identity_distribution": { ... }
  }
}
```

#### Meme API
```bash
# Get all memes
GET /api/meme

# Get meme by ID
GET /api/meme?id=meme_001

# Get meme presets
GET /api/meme?action=presets

# Create custom meme
POST /api/meme
{
  "contentType": "political_conspiracy",
  "title": "My Custom Meme",
  "attributes": { ... }
}
```

## Project Structure

```
memetic/
├── src/
│   ├── schemas/              # TypeScript type definitions
│   │   ├── node.ts          # Node schema with identity classes
│   │   ├── meme.ts          # Meme schema with content types
│   │   └── network.ts       # Network structure
│   ├── algorithms/           # Core algorithms
│   │   ├── network-generation.ts  # Topology generation
│   │   ├── propagation.ts         # Meme spread mechanics
│   │   └── astar.ts              # A* pathfinding
│   ├── lib/                  # Pipeline functions
│   │   ├── network-pipeline.ts
│   │   └── meme-pipeline.ts
│   ├── api/
│   │   └── dummy/            # Mock data
│   │       ├── networks.json
│   │       └── memes.json
│   └── components/           # React components
│       ├── NetworkVisualizer.tsx    # Interactive graph
│       └── AStarVisualizer.tsx     # A* visualization
├── app/
│   ├── api/                  # API routes
│   │   ├── network/
│   │   └── meme/
│   └── page.tsx              # Main application
└── components/ui/            # shadcn components
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Visualization**: react-force-graph-2d
- **State Management**: Zustand (ready to use)
- **Styling**: Tailwind CSS

## Key Concepts

### Node States
- **Susceptible**: Not exposed to meme (gray)
- **Exposed**: Saw meme but didn't accept (yellow)
- **Infected**: Accepted and spreading meme (red)
- **Resistant**: Fact-checked or resistant to meme (green)

### Trust Calculation
Trust between nodes is calculated based on:
- Identity class similarity (homophily)
- Political alignment
- Random variation

### Acceptance Probability
When a node receives a meme:
```
P(accept) = BASE_RECEPTIVITY × TRUST × ALIGNMENT × VIRALITY
```

Where:
- TRUST: Relationship strength
- ALIGNMENT: Political/belief compatibility
- VIRALITY: Emotional appeal boost

## Future Enhancements

- [ ] Full propagation simulation mode
- [ ] Minimax/Alpha-Beta for competitive play
- [ ] Seed selection strategies (Greedy, CELF)
- [ ] Defender AI mechanics
- [ ] Meme mutation during spread
- [ ] Real-time metrics dashboard
- [ ] Save/load simulation states
- [ ] Export visualizations

## Development

### Adding New Features

The codebase is modular and easy to extend:

1. **New Algorithms**: Add to `src/algorithms/`
2. **New Schemas**: Add to `src/schemas/`
3. **New Components**: Add to `src/components/`
4. **New API Routes**: Add to `app/api/`

### Debugging

All algorithms are pure functions that can be tested independently:

```typescript
import { astarInfluencePath } from '@/src/algorithms/astar';
import { generateNetwork } from '@/src/algorithms/network-generation';

// Generate test network
const network = generateNetwork(config);

// Run A* with logging
const result = astarInfluencePath(network, 'node_0', 'node_10', meme);
console.log(result);
```

## Contributing

This project is structured for easy contribution:
- Modular architecture with clear separation of concerns
- TypeScript for type safety
- Comprehensive documentation in code
- See `progress.md` for development history

## License

MIT

## Acknowledgments

Based on research in:
- Information diffusion in social networks
- Influence maximization algorithms
- Trust-based propagation models
- Epidemiological models (SIR/SEIR)

Inspired by real-world information warfare dynamics and the need to understand how ideas spread through connected communities.

---

Built with ❤️ for demonstrating AI algorithms and social network dynamics.
