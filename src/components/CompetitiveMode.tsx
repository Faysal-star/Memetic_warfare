'use client';

import React, { useState, useEffect } from 'react';
import { Network } from '../schemas/network';
import { Meme } from '../schemas/meme';
import { GameState, GameConfig, GameEvent } from '../schemas/game-state';
import { initializeGame, executeAttackerMove, executeDefenderMove, switchTurn, checkWinCondition, getPossibleMoves } from '../algorithms/game-engine';
import { AttackerStrategy, DefenderStrategy, getAIMove } from '../algorithms/ai-strategies';
import NetworkVisualizer, { NodeInfoPanel } from './NetworkVisualizer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Sword, Shield, Trophy, AlertTriangle } from 'lucide-react';

interface CompetitiveModeProps {
  network: Network;
  meme: Meme;
}

export default function CompetitiveMode({ network, meme }: CompetitiveModeProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameConfig] = useState<GameConfig>({
    networkSize: network.nodes.length,
    attackerBudget: 10,
    defenderBudget: 10,
    maxTurns: 20,
    winThreshold: 0.6,
  });
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [attackerStrategy, setAttackerStrategy] = useState<AttackerStrategy>('greedy_degree');
  const [defenderStrategy, setDefenderStrategy] = useState<DefenderStrategy>('reactive');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [lastMoveNodeId, setLastMoveNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!gameState) {
      const initialState = initializeGame(network, meme, gameConfig);
      setGameState(initialState);
    }
  }, [network, meme, gameConfig, gameState]);

  // Auto-play game
  useEffect(() => {
    if (!isPlaying || !gameState || gameState.gameOver) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      executeTurn();
    }, speed);

    return () => clearTimeout(timer);
  }, [isPlaying, gameState, speed]);

  const executeTurn = () => {
    if (!gameState || gameState.gameOver) return;

    const aiMove = getAIMove(gameState, attackerStrategy, defenderStrategy);
    
    if (!aiMove) {
      // No valid moves, switch turn
      const newState = switchTurn(gameState);
      setGameState(newState);
      return;
    }

    // Highlight the node being targeted
    setLastMoveNodeId(aiMove.targetNodeId);
    
    // Clear highlight after a short delay
    setTimeout(() => {
      setLastMoveNodeId(null);
    }, 1500);

    let newState: GameState;
    let newEvents: GameEvent[];

    if (gameState.currentTurn === 'attacker') {
      const result = executeAttackerMove(gameState, aiMove);
      newState = result.newState;
      newEvents = result.events;
    } else {
      const result = executeDefenderMove(gameState, aiMove);
      newState = result.newState;
      newEvents = result.events;
    }

    // Check win condition
    const winCheck = checkWinCondition(newState, gameConfig);
    if (winCheck.gameOver) {
      newState.gameOver = true;
      newState.winner = winCheck.winner;
      newEvents.push({
        id: `evt_${Date.now()}`,
        timestamp: Date.now(),
        type: 'game_end',
        player: winCheck.winner!,
        description: `Game Over! ${winCheck.winner} wins!`,
      });
      setIsPlaying(false);
    }

    // Switch turn
    newState = switchTurn(newState);
    
    setGameState(newState);
    setEvents(prev => [...prev, ...newEvents]);
  };

  const resetGame = () => {
    const initialState = initializeGame(network, meme, gameConfig);
    setGameState(initialState);
    setEvents([]);
    setIsPlaying(false);
  };

  if (!gameState) return <div>Loading...</div>;

  const infectionRate = gameState.infectedNodes.size / network.nodes.length;

  return (
    <div className="grid grid-cols-12 gap-3 h-full">
      {/* Left Panel - Game Controls */}
      <div className="col-span-2 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Competitive Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Game Status */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold mb-2">Game Status</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Turn:</span>
                  <span className="font-mono">{gameState.turnNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Infection Rate:</span>
                  <span className="font-mono">{(infectionRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Current Player:</span>
                  <span className={`font-semibold capitalize flex items-center gap-1 ${
                    gameState.currentTurn === 'attacker' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {gameState.currentTurn === 'attacker' ? (
                      <><Sword className="w-3 h-3" /> Attacker</>
                    ) : (
                      <><Shield className="w-3 h-3" /> Defender</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Budgets */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <div className="text-xs font-semibold text-red-900 flex items-center gap-1">
                  <Sword className="w-3 h-3" />
                  Attacker
                </div>
                <div className="text-sm font-mono text-red-700">
                  {gameState.attackerBudget} moves
                </div>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Defender
                </div>
                <div className="text-sm font-mono text-blue-700">
                  {gameState.defenderBudget} moves
                </div>
              </div>
            </div>

            {/* Win Condition */}
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <div className="font-semibold text-yellow-900 mb-1">Win Conditions:</div>
              <div className="text-yellow-800">
                Attacker: {(gameConfig.winThreshold * 100).toFixed(0)}% infection<br/>
                Defender: Keep below threshold
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={gameState.gameOver}
                  className="flex-1"
                  size="sm"
                >
                  {isPlaying ? (
                    <><Pause className="w-4 h-4 mr-1" /> Pause</>
                  ) : (
                    <><Play className="w-4 h-4 mr-1" /> Play</>
                  )}
                </Button>
                <Button onClick={executeTurn} disabled={gameState.gameOver || isPlaying} variant="outline" size="sm">
                  Step
                </Button>
              </div>
              <Button onClick={resetGame} variant="outline" size="sm" className="w-full">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Game Over */}
            {gameState.gameOver && (
              <div className={`p-3 rounded-lg border-2 ${
                gameState.winner === 'attacker'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-blue-50 border-blue-300'
              }`}>
                <div className="font-semibold text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {gameState.winner === 'attacker' ? 'Attacker' : 'Defender'} Wins!
                </div>
                <div className="text-xs mt-1">
                  Final Infection: {(infectionRate * 100).toFixed(1)}%
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Strategy Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">AI Strategies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs font-semibold mb-2 text-red-900">Attacker</div>
              <select
                value={attackerStrategy}
                onChange={(e) => setAttackerStrategy(e.target.value as AttackerStrategy)}
                className="w-full p-2 text-xs border rounded"
              >
                <option value="greedy_degree">Greedy Degree</option>
                <option value="high_susceptibility">High Susceptibility</option>
                <option value="bridge_targeting">Bridge Targeting</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold mb-2 text-blue-900">Defender</div>
              <select
                value={defenderStrategy}
                onChange={(e) => setDefenderStrategy(e.target.value as DefenderStrategy)}
                className="w-full p-2 text-xs border rounded"
              >
                <option value="reactive">Reactive</option>
                <option value="proactive">Proactive</option>
                <option value="bridge_protection">Bridge Protection</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Panel - Network Visualization */}
      <div className="col-span-6 h-full">
        <NetworkVisualizer
          network={gameState.network}
          onNodeHover={(node: any) => setHoveredNode(node)}
          highlightedNodes={new Set([
            ...Array.from(gameState.infectedNodes),
            ...Array.from(gameState.resistantNodes),
            ...(lastMoveNodeId ? [lastMoveNodeId] : []),
          ])}
          highlightedEdges={[]}
          competitiveMode={{
            infectedNodes: gameState.infectedNodes,
            resistantNodes: gameState.resistantNodes,
            lastMoveNodeId,
            currentPlayer: gameState.currentTurn,
          }}
        />
      </div>

      {/* Right Panel - Node Info */}
      <div className="col-span-2 overflow-y-auto">
        <NodeInfoPanel node={hoveredNode} />
      </div>

      {/* Far Right Panel - Event Log */}
      <div className="col-span-2 overflow-y-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Event Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {events.slice().reverse().slice(0, 20).map((event, idx) => (
              <div
                key={event.id}
                className={`p-2 rounded text-xs border ${
                  event.player === 'attacker'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="font-semibold flex items-center gap-1 mb-1">
                  {event.player === 'attacker' ? (
                    <Sword className="w-3 h-3" />
                  ) : (
                    <Shield className="w-3 h-3" />
                  )}
                  <span className="capitalize">{event.player}</span>
                  {event.type === 'game_end' && <Trophy className="w-3 h-3 ml-auto" />}
                </div>
                <div className="text-xs">{event.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

