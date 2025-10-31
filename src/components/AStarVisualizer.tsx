'use client';

import React, { useState, useEffect } from 'react';
import { Network } from '../schemas/network';
import { Node } from '../schemas/node';
import { Meme } from '../schemas/meme';
import { astarInfluencePath, AStarFrame, AStarMode } from '../algorithms/astar';
import NetworkVisualizer, { NodeInfoPanel } from './NetworkVisualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, SkipForward, Target, Network as NetworkIcon, MessageSquare } from 'lucide-react';

interface AStarVisualizerProps {
  network: Network;
  meme: Meme;
}

type SelectionMode = 'start' | 'end' | 'none';

export default function AStarVisualizer({ network, meme }: AStarVisualizerProps) {
  const [startNode, setStartNode] = useState<string | null>(null);
  const [endNode, setEndNode] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('start');
  const [frames, setFrames] = useState<AStarFrame[]>([]);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [result, setResult] = useState<{
    success: boolean;
    path: string[];
    cost: number;
    mode: AStarMode;
    pathExplanations?: string[];
  } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [mode, setMode] = useState<AStarMode>('meme_trust');
  const [colorByIdentity, setColorByIdentity] = useState(false);
  const [showPathBreakdown, setShowPathBreakdown] = useState(false);

  // Auto-play frames
  useEffect(() => {
    if (!isPlaying || currentFrame >= frames.length - 1) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentFrame(prev => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentFrame, frames.length, speed]);

  const handleNodeClick = (node: Node) => {
    if (selectionMode === 'start') {
      setStartNode(node.id);
      setSelectionMode('end');
      setResult(null);
      setFrames([]);
      setCurrentFrame(0);
    } else if (selectionMode === 'end') {
      if (node.id !== startNode) {
        setEndNode(node.id);
        setSelectionMode('none');
      }
    }
  };

  const handleNodeHover = (node: Node | null) => {
    setHoveredNode(node);
  };

  const runAStar = () => {
    if (!startNode || !endNode) return;

    const astarResult = astarInfluencePath(network, startNode, endNode, meme, mode);
    
    setFrames(astarResult.frames);
    setCurrentFrame(0);
    setResult({
      success: astarResult.success,
      path: astarResult.path,
      cost: astarResult.cost,
      mode: astarResult.mode,
      pathExplanations: astarResult.pathExplanations,
    });
  };

  const reset = () => {
    setStartNode(null);
    setEndNode(null);
    setSelectionMode('start');
    setFrames([]);
    setCurrentFrame(0);
    setResult(null);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (currentFrame >= frames.length - 1) {
      setCurrentFrame(0);
    }
    setIsPlaying(!isPlaying);
  };

  const stepForward = () => {
    if (currentFrame < frames.length - 1) {
      setCurrentFrame(prev => prev + 1);
    }
  };

  // Get highlighted nodes and edges for current frame
  const getHighlightedElements = () => {
    if (frames.length === 0) {
      const highlighted = new Set<string>();
      if (startNode) highlighted.add(startNode);
      if (endNode) highlighted.add(endNode);
      return { nodes: highlighted, edges: [] };
    }

    const frame = frames[currentFrame];
    const highlighted = new Set<string>([
      ...frame.openSet,
      ...frame.closedSet,
      frame.currentNode,
    ]);

    if (startNode) highlighted.add(startNode);
    if (endNode) highlighted.add(endNode);

    // Highlight path edges
    const edges = [];
    for (let i = 0; i < frame.path.length - 1; i++) {
      edges.push({
        source: frame.path[i],
        target: frame.path[i + 1],
      });
    }

    return { nodes: highlighted, edges };
  };

  const { nodes: highlightedNodes, edges: highlightedEdges } = getHighlightedElements();

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left Panel - Controls */}
      <div className="col-span-3 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              A* Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          {/* Selection Status */}
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold mb-1">Start Node</div>
              <div className="text-sm font-mono">
                {startNode || 'Not selected'}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold mb-1">End Node</div>
              <div className="text-sm font-mono">
                {endNode || 'Not selected'}
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <div className="text-xs font-semibold mb-2">Algorithm Mode</div>
            <div className="space-y-2">
              <button
                onClick={() => setMode('social_trust')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  mode === 'social_trust'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <NetworkIcon className="w-4 h-4" />
                  <span className="font-semibold text-sm">Social Trust</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pure network pathfinding based only on node-to-node trust
                </p>
              </button>
              
              <button
                onClick={() => setMode('meme_trust')}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  mode === 'meme_trust'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-semibold text-sm">Meme Trust</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Considers meme acceptance based on all attributes
                </p>
              </button>
            </div>
          </div>

          {/* Selection Mode Indicator */}
          {selectionMode !== 'none' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              {selectionMode === 'start' && '👆 Click a node to set as START'}
              {selectionMode === 'end' && '👆 Click a node to set as END'}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={runAStar}
              disabled={!startNode || !endNode}
              className="w-full"
            >
              Run A* Algorithm
            </Button>
            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

        </CardContent>
      </Card>

      {/* Playback Controls */}
      {frames.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Playback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Button onClick={togglePlay} size="sm" variant="outline" className="flex-1">
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Play
                  </>
                )}
              </Button>
              <Button
                onClick={stepForward}
                size="sm"
                variant="outline"
                disabled={currentFrame >= frames.length - 1}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-sm text-center font-mono bg-gray-50 py-2 rounded">
              Frame {currentFrame + 1} / {frames.length}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Speed (ms)</label>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={100}
                max={1000}
                step={100}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {speed}ms/frame
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-semibold text-green-800 mb-1">
                    ✓ Path Found!
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-mono capitalize">
                        {result.mode.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Cost:</span>
                      <span className="font-mono">{result.cost.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Path Length:</span>
                      <span className="font-mono">{result.path.length} nodes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Explored:</span>
                      <span className="font-mono">{result.exploredCount} nodes</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs bg-gray-50 p-2 rounded">
                  <div className="font-semibold mb-1">Path:</div>
                  <div className="font-mono text-xs break-all">
                    {result.path.join(' → ')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                ✗ No path found
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Frame Info */}
      {frames.length > 0 && frames[currentFrame] && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Algorithm State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="font-semibold">Current:</span>
              <span className="font-mono">{frames[currentFrame].currentNode}</span>
            </div>
            <div className="flex justify-between p-2 bg-blue-50 rounded">
              <span className="font-semibold">Explored:</span>
              <span className="font-mono">{frames[currentFrame].closedSet.length}</span>
            </div>
            <div className="flex justify-between p-2 bg-yellow-50 rounded">
              <span className="font-semibold">Frontier:</span>
              <span className="font-mono">{frames[currentFrame].openSet.length}</span>
            </div>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs border-l-2 border-blue-500">
              {frames[currentFrame].message}
            </div>
          </CardContent>
        </Card>
      )}
    </div>

    {/* Middle Panel - Network Visualization */}
    <div className="col-span-6 h-full">
      <NetworkVisualizer
        network={network}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        highlightedNodes={highlightedNodes}
        highlightedEdges={highlightedEdges}
        colorByIdentity={colorByIdentity}
      />
    </div>

    {/* Right Panel - Info */}
    <div className="col-span-3 space-y-4 overflow-y-auto">
      {/* View Toggle */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">View Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Color Mode Toggle */}
          <div>
            <div className="text-xs font-semibold mb-2">Node Colors</div>
            <div className="flex gap-2">
              <button
                onClick={() => setColorByIdentity(false)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                  !colorByIdentity
                    ? 'border-blue-500 bg-blue-50 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                By State
              </button>
              <button
                onClick={() => setColorByIdentity(true)}
                className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                  colorByIdentity
                    ? 'border-blue-500 bg-blue-50 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                By Identity
              </button>
            </div>
          </div>

          {/* Path Breakdown Toggle */}
          {result?.pathExplanations && result.pathExplanations.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-2">Information Display</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPathBreakdown(false)}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                    !showPathBreakdown
                      ? 'border-blue-500 bg-blue-50 font-semibold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Node Info
                </button>
                <button
                  onClick={() => setShowPathBreakdown(true)}
                  className={`flex-1 px-3 py-2 text-xs rounded-lg border-2 transition-all ${
                    showPathBreakdown
                      ? 'border-blue-500 bg-blue-50 font-semibold'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Path Costs
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditional Display: Node Info or Path Breakdown */}
      {showPathBreakdown && result?.pathExplanations ? (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm">Path Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {result.pathExplanations.map((exp, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded border">
                <pre className="whitespace-pre-wrap font-mono text-[10px] text-gray-700">
                  {exp}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <NodeInfoPanel node={hoveredNode} />

          {selectionMode !== 'none' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                {selectionMode === 'start' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-semibold text-blue-900 mb-1">Step 1</div>
                    <div className="text-blue-800">Click any node to set as START point</div>
                  </div>
                )}
                {selectionMode === 'end' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="font-semibold text-green-900 mb-1">Step 2</div>
                    <div className="text-green-800">Click another node to set as END target</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  </div>
  );
}

