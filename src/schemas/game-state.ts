/**
 * Game State Schema for Competitive Mode
 * Attacker AI vs Defender AI
 */

import { Network } from './network';
import { Meme } from './meme';
import { Node } from './node';

export type PlayerRole = 'attacker' | 'defender';
export type MoveType = 'infect' | 'factcheck' | 'inoculate' | 'mutate_meme';

export interface GameMove {
  type: MoveType;
  playerId: PlayerRole;
  targetNodeId: string;
  memeId?: string;
  timestamp: number;
  success: boolean;
  description: string;
}

export interface GameState {
  network: Network;
  activeMemes: Meme[];
  infectedNodes: Set<string>;
  resistantNodes: Set<string>;
  currentTurn: PlayerRole;
  turnNumber: number;
  attackerBudget: number;
  defenderBudget: number;
  moveHistory: GameMove[];
  gameOver: boolean;
  winner?: PlayerRole;
}

export interface GameConfig {
  networkSize: number;
  attackerBudget: number;
  defenderBudget: number;
  maxTurns: number;
  winThreshold: number; // infection percentage for attacker to win
}

export interface GameEvent {
  id: string;
  timestamp: number;
  type: 'move' | 'mutation' | 'infection' | 'resistance' | 'turn_change' | 'game_end';
  player: PlayerRole;
  description: string;
  nodeId?: string;
  memeId?: string;
  details?: any;
}

