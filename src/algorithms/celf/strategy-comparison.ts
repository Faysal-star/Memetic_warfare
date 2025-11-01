/**
 * Strategy Comparison Tool
 * Benchmarks different attacker strategies including CELF/CELF++
 */

import { GameState, GameConfig } from '../../schemas/game-state';
import { Network } from '../../schemas/network';
import { Meme } from '../../schemas/meme';
import { generateNetwork } from '../../algorithms/network-generation';
import { createMeme } from '../../lib/meme-pipeline';
import { initializeGame, executeAttackerMove, switchTurn, checkWinCondition } from '../../algorithms/game-engine';
import { 
  attackerGreedyDegree, 
  attackerHighSusceptibility, 
  attackerBridgeTargeting,
  defenderReactive 
} from '../../algorithms/ai-strategies';
import { attackerCELF, attackerCELFPlusPlus } from './celf-strategy';

export interface StrategyResult {
  strategyName: string;
  finalInfectionRate: number;
  turnsToWin: number | null;
  totalTurnsPlayed: number;
  computationTimeMs: number;
  winner: 'attacker' | 'defender' | 'tie';
  peakInfectionRate: number;
  avgInfectionGrowth: number;
  nodesSelected: string[];
}

export interface BenchmarkConfig {
  networkSize: number;
  networkType: 'small-world' | 'scale-free' | 'random';
  memeType: 'political_conspiracy' | 'health_misinformation' | 'factual_news';
  attackerBudget: number;
  defenderBudget: number;
  maxTurns: number;
  numTrials: number;
}

/**
 * Run a single game with given strategy
 */
function runSingleGame(
  network: Network,
  meme: Meme,
  config: GameConfig,
  attackerStrategy: 'greedy_degree' | 'high_susceptibility' | 'bridge_targeting' | 'celf' | 'celf_plusplus'
): StrategyResult {
  let state = initializeGame(network, meme, config);
  const nodesSelected: string[] = [];
  const infectionHistory: number[] = [];
  
  const startTime = Date.now();
  
  while (!state.gameOver && state.turnNumber <= config.maxTurns) {
    let move;
    
    if (state.currentTurn === 'attacker') {
      // Select move based on strategy
      switch (attackerStrategy) {
        case 'greedy_degree':
          move = attackerGreedyDegree(state);
          break;
        case 'high_susceptibility':
          move = attackerHighSusceptibility(state);
          break;
        case 'bridge_targeting':
          move = attackerBridgeTargeting(state);
          break;
        case 'celf':
          move = attackerCELF(state, 5);
          break;
        case 'celf_plusplus':
          move = attackerCELFPlusPlus(state, 5);
          break;
      }
      
      if (move) {
        nodesSelected.push(move.targetNodeId);
        const { newState } = executeAttackerMove(state, move);
        state = newState;
      }
    } else {
      // Defender always uses reactive strategy for fair comparison
      move = defenderReactive(state);
      if (move) {
        const { newState } = executeAttackerMove(state, move);
        state = newState;
      }
    }
    
    // Track infection rate
    infectionHistory.push(state.infectedNodes.size / network.nodes.length);
    
    // Switch turn
    state = switchTurn(state);
    
    // Check win condition
    const winCheck = checkWinCondition(state, config);
    if (winCheck.gameOver) {
      state.gameOver = true;
      state.winner = winCheck.winner;
      break;
    }
  }
  
  const endTime = Date.now();
  const computationTimeMs = endTime - startTime;
  
  // Calculate metrics
  const finalInfectionRate = state.infectedNodes.size / network.nodes.length;
  const peakInfectionRate = Math.max(...infectionHistory);
  const avgInfectionGrowth = infectionHistory.length > 1 
    ? (infectionHistory[infectionHistory.length - 1] - infectionHistory[0]) / infectionHistory.length
    : 0;
  
  const turnsToWin = state.winner === 'attacker' ? state.turnNumber : null;
  
  return {
    strategyName: attackerStrategy,
    finalInfectionRate,
    turnsToWin,
    totalTurnsPlayed: state.turnNumber,
    computationTimeMs,
    winner: state.winner || 'tie',
    peakInfectionRate,
    avgInfectionGrowth,
    nodesSelected
  };
}

/**
 * Compare all strategies with multiple trials
 */
export function compareStrategies(config: BenchmarkConfig): Map<string, StrategyResult[]> {
  const strategies = [
    'greedy_degree',
    'high_susceptibility', 
    'bridge_targeting',
    'celf',
    'celf_plusplus'
  ] as const;
  
  const results = new Map<string, StrategyResult[]>();
  
  for (const strategy of strategies) {
    console.log(`\n=== Testing ${strategy} ===`);
    const strategyResults: StrategyResult[] = [];
    
    for (let trial = 0; trial < config.numTrials; trial++) {
      console.log(`  Trial ${trial + 1}/${config.numTrials}...`);
      
      // Generate fresh network and meme for each trial
      const network = generateNetwork({
        size: config.networkSize,
        type: config.networkType,
        identity_distribution: {
          urban_professional: 0.25,
          university_student: 0.20,
          rural_traditional: 0.20,
          suburban_family: 0.20,
          tech_worker: 0.15,
        }
      });
      
      const meme = createMeme(config.memeType, `Test Meme ${trial}`);
      
      const gameConfig: GameConfig = {
        networkSize: config.networkSize,
        attackerBudget: config.attackerBudget,
        defenderBudget: config.defenderBudget,
        maxTurns: config.maxTurns,
        winThreshold: 0.5
      };
      
      const result = runSingleGame(network, meme, gameConfig, strategy);
      strategyResults.push(result);
      
      console.log(`    Infection: ${(result.finalInfectionRate * 100).toFixed(1)}%, Time: ${result.computationTimeMs}ms`);
    }
    
    results.set(strategy, strategyResults);
  }
  
  return results;
}

/**
 * Calculate aggregate statistics
 */
export interface AggregateStats {
  strategyName: string;
  avgInfectionRate: number;
  stdInfectionRate: number;
  avgComputationTime: number;
  winRate: number;
  avgTurnsToWin: number;
  avgPeakInfection: number;
}

export function calculateAggregateStats(results: Map<string, StrategyResult[]>): AggregateStats[] {
  const aggregates: AggregateStats[] = [];
  
  for (const [strategy, trials] of results.entries()) {
    const infectionRates = trials.map(t => t.finalInfectionRate);
    const computationTimes = trials.map(t => t.computationTimeMs);
    const wins = trials.filter(t => t.winner === 'attacker').length;
    const turnsToWin = trials.filter(t => t.turnsToWin !== null).map(t => t.turnsToWin!);
    const peakInfections = trials.map(t => t.peakInfectionRate);
    
    const avgInfection = infectionRates.reduce((a, b) => a + b, 0) / trials.length;
    const variance = infectionRates.reduce((sum, val) => sum + Math.pow(val - avgInfection, 2), 0) / trials.length;
    const stdInfection = Math.sqrt(variance);
    
    aggregates.push({
      strategyName: strategy,
      avgInfectionRate: avgInfection,
      stdInfectionRate: stdInfection,
      avgComputationTime: computationTimes.reduce((a, b) => a + b, 0) / trials.length,
      winRate: wins / trials.length,
      avgTurnsToWin: turnsToWin.length > 0 
        ? turnsToWin.reduce((a, b) => a + b, 0) / turnsToWin.length 
        : Infinity,
      avgPeakInfection: peakInfections.reduce((a, b) => a + b, 0) / trials.length
    });
  }
  
  return aggregates;
}

/**
 * Pretty print comparison table
 */
export function printComparisonTable(stats: AggregateStats[]): void {
  console.log('\n=== STRATEGY COMPARISON RESULTS ===\n');
  console.log('Strategy'.padEnd(25) + 
              'Avg Infection'.padEnd(15) + 
              'Win Rate'.padEnd(12) + 
              'Avg Time (ms)'.padEnd(15) + 
              'Peak Infection');
  console.log('-'.repeat(80));
  
  // Sort by average infection rate descending
  const sorted = [...stats].sort((a, b) => b.avgInfectionRate - a.avgInfectionRate);
  
  for (const stat of sorted) {
    const infectionStr = `${(stat.avgInfectionRate * 100).toFixed(1)}% ± ${(stat.stdInfectionRate * 100).toFixed(1)}%`;
    const winRateStr = `${(stat.winRate * 100).toFixed(0)}%`;
    const timeStr = stat.avgComputationTime.toFixed(0);
    const peakStr = `${(stat.avgPeakInfection * 100).toFixed(1)}%`;
    
    console.log(
      stat.strategyName.padEnd(25) +
      infectionStr.padEnd(15) +
      winRateStr.padEnd(12) +
      timeStr.padEnd(15) +
      peakStr
    );
  }
  
  console.log('-'.repeat(80));
  
  // Highlight best performer
  const bestInfection = sorted[0];
  const fastestTime = [...stats].sort((a, b) => a.avgComputationTime - b.avgComputationTime)[0];
  
  console.log(`\n✓ Best Infection Rate: ${bestInfection.strategyName} (${(bestInfection.avgInfectionRate * 100).toFixed(1)}%)`);
  console.log(`✓ Fastest Execution: ${fastestTime.strategyName} (${fastestTime.avgComputationTime.toFixed(0)}ms)`);
  
  // Calculate CELF efficiency gain
  const naiveGreedy = stats.find(s => s.strategyName === 'greedy_degree');
  const celf = stats.find(s => s.strategyName === 'celf');
  const celfPP = stats.find(s => s.strategyName === 'celf_plusplus');
  
  if (naiveGreedy && celf) {
    const infectionGain = ((celf.avgInfectionRate - naiveGreedy.avgInfectionRate) / naiveGreedy.avgInfectionRate) * 100;
    console.log(`\n📊 CELF Improvement over Greedy: ${infectionGain > 0 ? '+' : ''}${infectionGain.toFixed(1)}% infection rate`);
  }
  
  if (celf && celfPP) {
    const speedup = ((celf.avgComputationTime - celfPP.avgComputationTime) / celf.avgComputationTime) * 100;
    console.log(`📊 CELF++ Speedup over CELF: ${speedup.toFixed(1)}% faster`);
  }
}

/**
 * Export results to JSON (returns data for browser download)
 */
export function exportResults(
  results: Map<string, StrategyResult[]>,
  stats: AggregateStats[]
): any {
  const exportData = {
    timestamp: new Date().toISOString(),
    aggregateStats: stats,
    detailedResults: Array.from(results.entries()).map(([strategy, trials]) => ({
      strategy,
      trials
    }))
  };

  return exportData;
}

/**
 * Main benchmark function
 */
export async function runBenchmark(config: BenchmarkConfig): Promise<void> {
  console.log('='.repeat(80));
  console.log('MEME PROPAGATION STRATEGY BENCHMARK');
  console.log('='.repeat(80));
  console.log(`Network: ${config.networkSize} nodes (${config.networkType})`);
  console.log(`Meme Type: ${config.memeType}`);
  console.log(`Budget: Attacker=${config.attackerBudget}, Defender=${config.defenderBudget}`);
  console.log(`Trials: ${config.numTrials} per strategy`);
  console.log('='.repeat(80));
  
  const results = compareStrategies(config);
  const stats = calculateAggregateStats(results);

  printComparisonTable(stats);

  // Return export data
  const exportData = exportResults(results, stats);
  console.log(`\n✓ Results ready for export`);
}

// Example usage (Node.js only - commented out for browser compatibility)
// if (typeof require !== 'undefined' && require.main === module) {
//   const config: BenchmarkConfig = {
//     networkSize: 100,
//     networkType: 'small-world',
//     memeType: 'political_conspiracy',
//     attackerBudget: 20,
//     defenderBudget: 15,
//     maxTurns: 30,
//     numTrials: 5
//   };
//
//   runBenchmark(config).catch(console.error);
// }
