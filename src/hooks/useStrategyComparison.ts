/**
 * Hook for running strategy comparison benchmarks
 */

import { useState, useCallback } from 'react';
import { Network } from '@/src/schemas/network';
import { Meme, ContentType } from '@/src/schemas/meme';
import {
  compareStrategies,
  calculateAggregateStats,
  BenchmarkConfig,
  AggregateStats
} from '@/src/algorithms/celf/strategy-comparison';

export interface ComparisonResult {
  strategies: Array<{
    name: string;
    avgInfection: number;
    stdInfection: number;
    avgTime: number;
    winRate: number;
    history: number[];
  }>;
}

export function useStrategyComparison() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ComparisonResult | null>(null);

  const runComparison = useCallback(async (
    networkSize: number,
    memeType: ContentType,
    numTrials: number = 3
  ) => {
    // Default to 'political_conspiracy' for 'neutral' type
    const effectiveMemeType = memeType === 'neutral' ? 'political_conspiracy' : memeType;
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    // Run in a setTimeout to allow UI to update
    setTimeout(async () => {
      try {
        const config: BenchmarkConfig = {
          networkSize,
          networkType: 'small-world',
          memeType: effectiveMemeType as 'political_conspiracy' | 'health_misinformation' | 'factual_news',
          attackerBudget: Math.floor(networkSize * 0.2),
          defenderBudget: Math.floor(networkSize * 0.15),
          maxTurns: 30,
          numTrials,
        };

        // Run comparison
        const rawResults = compareStrategies(config);
        const aggregateStats = calculateAggregateStats(rawResults);

        // Convert to format expected by UI
        const formattedResults: ComparisonResult = {
          strategies: aggregateStats.map(stat => ({
            name: formatStrategyName(stat.strategyName),
            avgInfection: stat.avgInfectionRate,
            stdInfection: stat.stdInfectionRate,
            avgTime: stat.avgComputationTime,
            winRate: stat.winRate,
            history: generateMockHistory(stat.avgInfectionRate), // Generate progression
          })),
        };

        setResults(formattedResults);
        setProgress(100);
      } catch (error) {
        console.error('Error running comparison:', error);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  }, []);

  return {
    isRunning,
    progress,
    results,
    runComparison,
  };
}

// Helper to format strategy names for display
function formatStrategyName(name: string): string {
  const nameMap: Record<string, string> = {
    'greedy_degree': 'Greedy Degree',
    'high_susceptibility': 'High Susceptibility',
    'bridge_targeting': 'Bridge Targeting',
    'celf': 'CELF',
    'celf_plusplus': 'CELF++',
  };
  return nameMap[name] || name;
}

// Generate infection progression history based on final rate
function generateMockHistory(finalRate: number): number[] {
  const steps = 5;
  const history: number[] = [];

  for (let i = 0; i <= steps; i++) {
    // Exponential growth curve
    const progress = i / steps;
    const value = finalRate * (1 - Math.exp(-3 * progress));
    history.push(value);
  }

  return history;
}
