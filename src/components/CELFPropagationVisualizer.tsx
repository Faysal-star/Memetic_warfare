'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Download, Zap, Target, Info } from 'lucide-react';
import { Network } from '@/src/schemas/network';
import { Meme } from '@/src/schemas/meme';
import { IdentityClass } from '@/src/schemas/node';
import { celfPlusPlusSelection, celfSelection } from '@/src/algorithms/celf/celf-strategy';
import { calculateAcceptanceProbability } from '@/src/algorithms/propagation';

interface CELFPropagationVisualizerProps {
  network: Network;
  meme: Meme;
}

interface SimulationStep {
  step: number;
  infected: Set<string>;
  newInfections: string[];
  totalInfected: number;
  infectionRate: number;
}

// Identity colors
const IDENTITY_COLORS: Record<IdentityClass, { fill: string; stroke: string }> = {
  urban_professional: { fill: '#3b82f6', stroke: '#1d4ed8' },      // Blue
  university_student: { fill: '#10b981', stroke: '#059669' },      // Green
  rural_traditional: { fill: '#f59e0b', stroke: '#d97706' },       // Amber
  suburban_family: { fill: '#ec4899', stroke: '#db2777' },         // Pink
  tech_worker: { fill: '#8b5cf6', stroke: '#7c3aed' },             // Purple
};

export default function CELFPropagationVisualizer({
  network,
  meme,
}: CELFPropagationVisualizerProps) {
  const [algorithm, setAlgorithm] = useState<'celf' | 'celf++'>('celf++');
  const [budget, setBudget] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [simulationHistory, setSimulationHistory] = useState<SimulationStep[]>([]);
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>([]);
  const [isComputing, setIsComputing] = useState(false);

  // Reset simulation when network or meme changes
  useEffect(() => {
    resetSimulation();
  }, [network, meme]);

  const resetSimulation = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setSimulationHistory([]);
    setSelectedSeeds([]);
  };

  // Compute optimal seeds using CELF or CELF++
  const computeSeeds = () => {
    setIsComputing(true);
    setSelectedSeeds([]);
    setSimulationHistory([]);

    setTimeout(() => {
      try {
        console.log(`Computing seeds using ${algorithm} with budget ${budget}...`);
        let seeds: string[];

        if (algorithm === 'celf++') {
          seeds = celfPlusPlusSelection(network, meme, budget, 100);
        } else {
          seeds = celfSelection(network, meme, budget, 100);
        }

        console.log(`Selected seeds:`, seeds);
        setSelectedSeeds(seeds);
      } catch (error) {
        console.error('Error computing seeds:', error);
        alert(`Error computing seeds: ${error}`);
      } finally {
        setIsComputing(false);
      }
    }, 100);
  };

  // Run one step of the propagation simulation
  const runSimulationStep = () => {
    if (selectedSeeds.length === 0) return;

    let infected: Set<string>;
    let newInfections: string[] = [];

    if (simulationHistory.length === 0) {
      infected = new Set(selectedSeeds);
      newInfections = selectedSeeds;
    } else {
      const prevStep = simulationHistory[simulationHistory.length - 1];
      infected = new Set(prevStep.infected);
      newInfections = [];

      const nodesToSpreadFrom = prevStep.newInfections.length > 0
        ? prevStep.newInfections
        : Array.from(infected);

      for (const nodeId of nodesToSpreadFrom) {
        const node = network.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        for (const [neighborId, trustWeight] of Object.entries(node.trust_network)) {
          if (infected.has(neighborId)) continue;

          const neighbor = network.nodes.find(n => n.id === neighborId);
          if (!neighbor) continue;

          const acceptanceProb = calculateAcceptanceProbability(
            neighbor,
            meme,
            node,
            trustWeight
          );

          if (Math.random() < acceptanceProb) {
            infected.add(neighborId);
            newInfections.push(neighborId);
          }
        }
      }
    }

    const newStep: SimulationStep = {
      step: simulationHistory.length,
      infected,
      newInfections,
      totalInfected: infected.size,
      infectionRate: infected.size / network.nodes.length,
    };

    setSimulationHistory([...simulationHistory, newStep]);
    setCurrentStep(simulationHistory.length);
  };

  // Auto-run simulation
  useEffect(() => {
    if (!isRunning || selectedSeeds.length === 0) return;

    const interval = setInterval(() => {
      if (simulationHistory.length === 0 || simulationHistory[simulationHistory.length - 1].newInfections.length > 0) {
        runSimulationStep();
      } else {
        setIsRunning(false);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isRunning, simulationHistory, selectedSeeds]);

  // Current infection state for visualization
  const currentInfected = useMemo(() => {
    if (simulationHistory.length === 0) return new Set<string>();
    return simulationHistory[currentStep]?.infected || simulationHistory[simulationHistory.length - 1].infected;
  }, [simulationHistory, currentStep]);

  const currentNewInfections = useMemo(() => {
    if (simulationHistory.length === 0) return [];
    return simulationHistory[currentStep]?.newInfections || [];
  }, [simulationHistory, currentStep]);

  // Export results
  const exportResults = () => {
    const data = {
      algorithm,
      budget,
      selectedSeeds,
      simulationHistory: simulationHistory.map(s => ({
        step: s.step,
        totalInfected: s.totalInfected,
        infectionRate: s.infectionRate,
        newInfections: s.newInfections.length,
      })),
      finalInfectionRate: simulationHistory.length > 0
        ? simulationHistory[simulationHistory.length - 1].infectionRate
        : 0,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `celf-simulation-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left Panel - Controls (3/12 = 25%) */}
      <div className="col-span-3 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4" />
              CELF++ Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Algorithm Selection */}
            <div>
              <div className="text-xs font-semibold mb-2">Algorithm</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAlgorithm('celf')}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                    algorithm === 'celf'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Target className="w-3 h-3" />
                    <span className="font-semibold">CELF</span>
                  </div>
                </button>
                <button
                  onClick={() => setAlgorithm('celf++')}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                    algorithm === 'celf++'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span className="font-semibold">CELF++</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Budget Slider */}
            <div>
              <div className="text-xs font-semibold mb-2">Seed Budget: {budget}</div>
              <input
                type="range"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                min="1"
                max="10"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            {/* Compute Button */}
            <Button
              onClick={computeSeeds}
              disabled={isComputing || isRunning}
              className="w-full"
            >
              {isComputing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Computing...
                </>
              ) : (
                'Compute Seeds'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Simulation Controls */}
        {selectedSeeds.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => {
                  if (simulationHistory.length === 0) {
                    runSimulationStep();
                  }
                  setIsRunning(!isRunning);
                }}
                className="w-full"
                size="sm"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </>
                )}
              </Button>

              <Button
                onClick={runSimulationStep}
                disabled={isRunning}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Step Forward
              </Button>

              <Button
                onClick={resetSimulation}
                disabled={isRunning}
                size="sm"
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>

              {simulationHistory.length > 0 && (
                <Button
                  onClick={exportResults}
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {selectedSeeds.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-purple-50 rounded">
                <span className="font-semibold">Seeds:</span>
                <span className="font-mono">{selectedSeeds.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span className="font-semibold">Steps:</span>
                <span className="font-mono">{simulationHistory.length}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="font-semibold">Infected:</span>
                <span className="font-mono">
                  {simulationHistory.length > 0
                    ? simulationHistory[simulationHistory.length - 1].totalInfected
                    : 0}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="font-semibold">Rate:</span>
                <span className="font-mono">
                  {simulationHistory.length > 0
                    ? `${(simulationHistory[simulationHistory.length - 1].infectionRate * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Middle Panel - Network Visualization (6/12 = 50%) */}
      <div className="col-span-6 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Network Propagation</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-2">
            <div className="w-full h-full flex items-center justify-center">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="xMidYMid meet"
                className="border rounded bg-gradient-to-br from-gray-50 to-gray-100"
              >
                {/* Draw edges */}
                {network.edges.map((edge, idx) => {
                  const source = network.nodes.find(n => n.id === edge.source);
                  const target = network.nodes.find(n => n.id === edge.target);
                  if (!source || !target) return null;

                  const sourceAngle = (network.nodes.indexOf(source) / network.nodes.length) * 2 * Math.PI;
                  const targetAngle = (network.nodes.indexOf(target) / network.nodes.length) * 2 * Math.PI;
                  const radius = 450;
                  const cx = 500, cy = 500;

                  const x1 = cx + radius * Math.cos(sourceAngle);
                  const y1 = cy + radius * Math.sin(sourceAngle);
                  const x2 = cx + radius * Math.cos(targetAngle);
                  const y2 = cy + radius * Math.sin(targetAngle);

                  return (
                    <line
                      key={`edge-${idx}`}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#4b5563"
                      strokeWidth="2.5"
                      opacity="0.3"
                    />
                  );
                })}

                {/* Draw nodes */}
                {network.nodes.map((node, idx) => {
                  const angle = (idx / network.nodes.length) * 2 * Math.PI;
                  const radius = 450;
                  const cx = 500, cy = 500;
                  const x = cx + radius * Math.cos(angle);
                  const y = cy + radius * Math.sin(angle);

                  const isInfected = currentInfected.has(node.id);
                  const isNewInfection = currentNewInfections.includes(node.id);
                  const isSeed = selectedSeeds.includes(node.id);

                  const identityColor = IDENTITY_COLORS[node.identity_class];
                  let fill = identityColor.fill;
                  let stroke = identityColor.stroke;
                  let strokeWidth = 2;
                  let nodeRadius = 15;

                  if (isSeed) {
                    stroke = '#7c3aed';
                    strokeWidth = 5;
                    nodeRadius = 18;
                  }

                  if (isNewInfection) {
                    fill = '#f59e0b';
                    stroke = '#d97706';
                    strokeWidth = 4;
                    nodeRadius = 17;
                  } else if (isInfected && !isSeed) {
                    fill = '#ef4444';
                    stroke = '#dc2626';
                    strokeWidth = 4;
                    nodeRadius = 16;
                  }

                  return (
                    <g key={`node-${node.id}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={nodeRadius}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                      />
                      {isSeed && (
                        <circle
                          cx={x}
                          cy={y}
                          r={nodeRadius + 8}
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="3"
                          opacity="0.6"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Info & Timeline (3/12 = 25%) */}
      <div className="col-span-3 space-y-4 overflow-y-auto">
        {/* Identity Legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Identity Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(IDENTITY_COLORS).map(([identity, colors]) => (
              <div key={identity} className="flex items-center gap-2 text-xs">
                <div
                  className="w-4 h-4 rounded-full border-2"
                  style={{
                    backgroundColor: colors.fill,
                    borderColor: colors.stroke,
                  }}
                ></div>
                <span className="capitalize">{identity.replace('_', ' ')}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status Legend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Infection Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-purple-600 border-2 border-purple-800"></div>
                <div className="absolute inset-0 rounded-full border-2 border-purple-400 scale-150 opacity-50"></div>
              </div>
              <span>Seed Nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-orange-700"></div>
              <span>New Infections</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-red-700"></div>
              <span>Infected</span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        {selectedSeeds.length > 0 && (
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {simulationHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Run simulation to see timeline
                </div>
              ) : (
                simulationHistory.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                      currentStep === idx
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentStep(idx)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold">Step {step.step}</span>
                      <span className="text-blue-600 font-mono">
                        {(step.infectionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      +{step.newInfections.length} new • {step.totalInfected} total
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Info */}
        {!selectedSeeds.length && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>1. Select CELF or CELF++ algorithm</p>
              <p>2. Set seed budget (1-10 nodes)</p>
              <p>3. Click "Compute Seeds" to find optimal starting nodes</p>
              <p>4. Run simulation to watch infection spread</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
