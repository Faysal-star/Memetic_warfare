'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, RefreshCw } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useStrategyComparison } from '@/src/hooks/useStrategyComparison';
import { ContentType } from '@/src/schemas/meme';

interface StrategyComparisonProps {
  networkSize: number;
  memeType: ContentType;
}

export default function StrategyComparison({ networkSize, memeType }: StrategyComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<'infection' | 'time' | 'winrate'>('infection');
  const { isRunning, results, runComparison } = useStrategyComparison();

  // Run comparison with actual CELF algorithms
  const handleRunComparison = async () => {
    await runComparison(networkSize, memeType, 3);
  };

  // Export results
  const exportResults = () => {
    if (!results) return;
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `strategy-comparison-${Date.now()}.json`;
    link.click();
  };

  // Prepare bar chart data
  const getBarChartData = () => {
    if (!results) return [];
    
    return results.strategies.map((s: any) => ({
      name: s.name,
      'Infection Rate': (s.avgInfection * 100).toFixed(1),
      'Win Rate': (s.winRate * 100).toFixed(0),
      'Time (sec)': (s.avgTime / 1000).toFixed(1)
    }));
  };

  // Prepare line chart data for infection progression
  const getLineChartData = () => {
    if (!results) return [];
    
    const maxLength = Math.max(...results.strategies.map((s: any) => s.history.length));
    
    return Array.from({ length: maxLength }, (_, i) => {
      const dataPoint: any = { turn: i + 1 };
      
      results.strategies.forEach((s: any) => {
        dataPoint[s.name] = s.history[i] ? (s.history[i] * 100).toFixed(1) : null;
      });
      
      return dataPoint;
    });
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Strategy Comparison</span>
            <div className="flex gap-2">
              <Button
                onClick={handleRunComparison}
                disabled={isRunning}
                size="sm"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Comparison
                  </>
                )}
              </Button>
              {results && (
                <Button
                  onClick={exportResults}
                  size="sm"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Network Size:</span> {networkSize} nodes
            </div>
            <div>
              <span className="font-semibold">Meme Type:</span> {memeType.replace('_', ' ')}
            </div>
            <div>
              <span className="font-semibold">Strategies:</span> 5 (3 baseline + 2 CELF)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Best Infection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...results.strategies.map((s: any) => s.avgInfection * 100)).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {results.strategies.sort((a: any, b: any) => b.avgInfection - a.avgInfection)[0].name}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fastest Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {(Math.min(...results.strategies.map((s: any) => s.avgTime)) / 1000).toFixed(1)}s
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {results.strategies.sort((a: any, b: any) => a.avgTime - b.avgTime)[0].name}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CELF++ Advantage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const celf = results.strategies.find((s: any) => s.name === 'CELF');
                    const celfPP = results.strategies.find((s: any) => s.name === 'CELF++');
                    if (celf && celfPP) {
                      return `${(((celf.avgTime - celfPP.avgTime) / celf.avgTime) * 100).toFixed(0)}%`;
                    }
                    return 'N/A';
                  })()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Faster than CELF
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metric Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metric View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedMetric('infection')}
                  size="sm"
                  variant={selectedMetric === 'infection' ? 'default' : 'outline'}
                >
                  Infection Rate
                </Button>
                <Button
                  onClick={() => setSelectedMetric('time')}
                  size="sm"
                  variant={selectedMetric === 'time' ? 'default' : 'outline'}
                >
                  Computation Time
                </Button>
                <Button
                  onClick={() => setSelectedMetric('winrate')}
                  size="sm"
                  variant={selectedMetric === 'winrate' ? 'default' : 'outline'}
                >
                  Win Rate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart - Performance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getBarChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMetric === 'infection' && (
                    <Bar dataKey="Infection Rate" fill="#10b981" />
                  )}
                  {selectedMetric === 'time' && (
                    <Bar dataKey="Time (sec)" fill="#3b82f6" />
                  )}
                  {selectedMetric === 'winrate' && (
                    <Bar dataKey="Win Rate" fill="#8b5cf6" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart - Infection Progression */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Infection Progression Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getLineChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="turn" label={{ value: 'Turn', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Infection Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Greedy Degree" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="High Susceptibility" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="Bridge Targeting" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="CELF" stroke="#10b981" strokeWidth={3} />
                  <Line type="monotone" dataKey="CELF++" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Statistics Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detailed Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Strategy</th>
                      <th className="text-right py-2">Avg Infection</th>
                      <th className="text-right py-2">Std Dev</th>
                      <th className="text-right py-2">Win Rate</th>
                      <th className="text-right py-2">Avg Time</th>
                      <th className="text-right py-2">Efficiency*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.strategies
                      .sort((a: any, b: any) => b.avgInfection - a.avgInfection)
                      .map((s: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 font-medium">{s.name}</td>
                          <td className="text-right">{(s.avgInfection * 100).toFixed(1)}%</td>
                          <td className="text-right">±{(s.stdInfection * 100).toFixed(1)}%</td>
                          <td className="text-right">{(s.winRate * 100).toFixed(0)}%</td>
                          <td className="text-right">{(s.avgTime / 1000).toFixed(2)}s</td>
                          <td className="text-right">
                            {(s.avgInfection / (s.avgTime / 1000) * 100).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <div className="text-xs text-muted-foreground mt-2">
                  *Efficiency = (Infection Rate / Time) × 100
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const greedy = results.strategies.find((s: any) => s.name === 'Greedy Degree');
                const celf = results.strategies.find((s: any) => s.name === 'CELF');
                const celfPP = results.strategies.find((s: any) => s.name === 'CELF++');
                
                return (
                  <>
                    {celf && greedy && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-semibold text-green-900 text-sm mb-1">
                          📈 CELF Effectiveness
                        </div>
                        <div className="text-sm text-green-800">
                          CELF achieves {(((celf.avgInfection - greedy.avgInfection) / greedy.avgInfection) * 100).toFixed(1)}% 
                          higher infection rate than baseline greedy strategy, proving the value of multi-step lookahead planning.
                        </div>
                      </div>
                    )}
                    
                    {celf && celfPP && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="font-semibold text-purple-900 text-sm mb-1">
                          ⚡ CELF++ Speedup
                        </div>
                        <div className="text-sm text-purple-800">
                          CELF++ maintains the same infection rate as CELF while being {(((celf.avgTime - celfPP.avgTime) / celf.avgTime) * 100).toFixed(0)}% 
                          faster, making it practical for real-time gameplay.
                        </div>
                      </div>
                    )}
                    
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-semibold text-blue-900 text-sm mb-1">
                        🎯 Meme Type Consideration
                      </div>
                      <div className="text-sm text-blue-800">
                        For {memeType.replace('_', ' ')} memes, CELF strategies leverage trust networks and 
                        meme attributes (virality, accuracy, complexity) to find optimal infection paths.
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
