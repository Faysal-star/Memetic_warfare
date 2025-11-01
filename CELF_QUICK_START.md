# CELF++ Quick Start Guide

## Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000` (or 3001 if 3000 is in use).

### 2. Navigate to CELF++ Tabs

You'll see **4 tabs** at the top:
1. **CELF++ Propagation** ⚡ (NEW - Featured)
2. **Strategy Comparison** 📊 (NEW - Featured)
3. **A* Pathfinding** 🎯 (Existing)
4. **Competitive Mode** ⚔️ (Existing)

---

## Tab 1: CELF++ Propagation ⚡

### What It Does
Shows real-time meme propagation using CELF++ algorithm to select optimal seed nodes.

### Step-by-Step

1. **Choose Algorithm**
   - Click **CELF** for standard algorithm
   - Click **CELF++** for optimized version (recommended)

2. **Set Budget**
   - Adjust the number input (1-10)
   - This is how many seed nodes the algorithm will select

3. **Compute Seeds**
   - Click **"Compute Seeds"** button
   - Wait 1-3 seconds for algorithm to run
   - Selected seeds will be shown in purple on the network

4. **Run Simulation**
   - Click **"Run Simulation"** for automatic playback
   - OR click **"Step"** to advance manually
   - Watch the infection spread through the network

5. **Observe Results**
   - **Network Graph**: Visual representation with color-coded nodes
   - **Stats Panel**: See current infection count and rate
   - **Timeline**: Track each step of the propagation

6. **Export (Optional)**
   - Click **"Export"** to download simulation data as JSON

### Color Legend
- 🟣 **Purple**: Seed nodes (starting points)
- 🟠 **Orange**: New infections (just infected this step)
- 🔴 **Red**: Infected nodes (previously infected)
- ⚪ **Gray**: Susceptible nodes (not yet infected)

---

## Tab 2: Strategy Comparison 📊

### What It Does
Compares 5 different seed selection strategies to show CELF++ advantages.

### Step-by-Step

1. **Configure Network (Top Bar)**
   - Click **Network** tab
   - Choose network type: Small-World / Scale-Free / Random
   - Note the network size and structure

2. **Configure Meme (Top Bar)**
   - Click **Meme** tab
   - Choose meme type: Political / Health / Factual
   - This affects how the meme spreads

3. **Run Comparison**
   - Click **"Run Comparison"** button in the Strategy Comparison tab
   - Wait 10-30 seconds (this runs actual simulations!)
   - Progress indicator will show

4. **Analyze Results**

   **Metric Cards (Top)**:
   - 🟢 **Best Infection Rate**: Highest spread achieved
   - 🔵 **Fastest Strategy**: Quickest computation
   - 🟣 **CELF++ Advantage**: How much faster than CELF

   **Charts**:
   - **Performance Comparison**: Bar chart showing metrics
   - **Infection Progression**: Line chart showing growth over time
   - **Statistics Table**: Detailed numbers with standard deviation

   **Key Insights**:
   - 📈 CELF effectiveness vs. baseline
   - ⚡ CELF++ speedup analysis
   - 🎯 Meme-type considerations

5. **Switch Metrics**
   - Click **Infection Rate** / **Computation Time** / **Win Rate**
   - Bar chart updates to show selected metric

6. **Export Results**
   - Click **"Export"** to download benchmark data

### Strategies Compared

1. **Greedy Degree**: Select highest-degree nodes
2. **High Susceptibility**: Target most susceptible individuals
3. **Bridge Targeting**: Focus on network bridges
4. **CELF**: Submodular optimization with lazy evaluation
5. **CELF++**: Optimized CELF with look-ahead caching

---

## Understanding the Results

### Why CELF/CELF++ Outperforms

**Better Seed Selection**:
- Uses influence spread estimation (not just degree)
- Accounts for network structure
- Considers diminishing returns (submodularity)
- Plans multiple steps ahead

**Example Results** (typical):
```
Strategy              Infection    Time      Win Rate
---------------------------------------------------
CELF++                58.0%       2.8s      80%
CELF                  58.0%       5.2s      80%
High Susceptibility   52.0%       1.8s      70%
Bridge Targeting      48.0%       1.5s      65%
Greedy Degree         45.0%       1.2s      60%
```

**Key Insight**: CELF++ achieves same quality as CELF but ~46% faster!

---

## Configuration Tips

### For Faster Computation
- Use smaller networks (20-30 nodes)
- Reduce budget (3-5 seeds)
- Fewer trials in comparison (1-2 instead of 3)

### For More Accuracy
- Larger networks (50-100 nodes)
- More trials (5-10)
- Higher budget (allows more strategy variation)

### For Best Visualization
- Medium networks (30-50 nodes)
- Moderate budget (5 seeds)
- Step-through mode (manual control)

---

## Common Questions

### Q: Why does "Compute Seeds" take time?
**A**: CELF++ runs Monte Carlo simulations (100-1000) to estimate influence spread for each potential seed. This is computationally intensive but ensures optimal selection.

### Q: Why do results vary between runs?
**A**: The propagation is stochastic (probabilistic). Each run simulates random activation based on acceptance probabilities. Run multiple trials for statistical significance.

### Q: What's the difference between CELF and CELF++?
**A**:
- **CELF**: Original lazy evaluation algorithm
- **CELF++**: Adds look-ahead optimization and caches marginal gains
- **Result**: Same quality, much faster (~40-60% speedup)

### Q: Which meme type spreads fastest?
**A**:
- **Political Conspiracy**: High virality, low accuracy → spreads fast
- **Health Misinformation**: Medium virality → moderate spread
- **Factual News**: Low virality, high accuracy → spreads slowly

Critical thinkers resist low-accuracy memes!

### Q: Can I use this for my research?
**A**: Yes! Export the data and cite the original CELF/CELF++ papers:
- Leskovec et al. (2007) - CELF
- Goyal et al. (2011) - CELF++

---

## Troubleshooting

### Page Not Loading
- Check if dev server is running: `npm run dev`
- Try `http://localhost:3001` if 3000 is in use
- Clear browser cache and reload

### Slow Performance
- **Normal**: First computation always slower (cold start)
- **Solution**: Use smaller networks or reduce simulations
- **Future**: Will add web workers for background computation

### Build Errors
- Run: `npm install` to ensure dependencies
- Run: `npm run build` to check for errors
- All TypeScript errors should be fixed

### UI Not Responding
- Computation is synchronous (blocks UI temporarily)
- This is expected during "Compute Seeds" and "Run Comparison"
- Future improvement: Add loading indicators

---

## Next Steps

1. **Experiment with Different Networks**
   - Try scale-free vs. small-world
   - See how structure affects spread

2. **Compare Meme Types**
   - Run same network with different memes
   - Observe how trust and attributes matter

3. **Find Optimal Budget**
   - Test different budgets (1, 3, 5, 10)
   - Find diminishing returns point

4. **Challenge A***
   - Compare CELF++ to A* pathfinding
   - See global optimization vs. path-based

5. **Competitive Analysis**
   - Use Competitive Mode to see adversarial scenarios
   - Understand defender countermeasures

---

## Summary

You now have:
✅ Real-time CELF++ propagation visualization
✅ Comprehensive strategy comparison
✅ Export capabilities for research
✅ Multiple network and meme configurations
✅ Understanding of submodular optimization

**Have fun exploring the power of influence maximization!** 🚀

---

## Support

If you encounter issues:
1. Check `CELF_INTEGRATION_SUMMARY.md` for technical details
2. Review the integration guide in `Algorithm_Integration.md`
3. Check console for error messages
4. Verify all dependencies are installed

**Enjoy your CELF++ powered meme propagation simulator!** 🎉
