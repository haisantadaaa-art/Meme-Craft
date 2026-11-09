/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CropType = 'wheat' | 'corn' | 'carrot' | 'strawberry';

export interface CropInfo {
  id: CropType;
  name: string;
  growTimeSeconds: number;
  expReward: number;
  coinReward: number;
  harvestAmount: number;
  cost: number;
  unlockLevel: number;
  color: string;
  badgeBg: string;
}

export const CROP_CONFIG: Record<CropType, CropInfo> = {
  wheat: {
    id: 'wheat',
    name: 'Lúa Vàng',
    growTimeSeconds: 10,
    expReward: 5,
    coinReward: 8,
    harvestAmount: 2,
    cost: 2,
    unlockLevel: 1,
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  corn: {
    id: 'corn',
    name: 'Bắp Ngô',
    growTimeSeconds: 25,
    expReward: 12,
    coinReward: 18,
    harvestAmount: 2,
    cost: 5,
    unlockLevel: 2,
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  },
  carrot: {
    id: 'carrot',
    name: 'Cà Rốt',
    growTimeSeconds: 45,
    expReward: 20,
    coinReward: 32,
    harvestAmount: 2,
    cost: 8,
    unlockLevel: 3,
    color: 'text-orange-400',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Dâu Tây',
    growTimeSeconds: 70,
    expReward: 35,
    coinReward: 55,
    harvestAmount: 2,
    cost: 15,
    unlockLevel: 4,
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

export interface FarmPlot {
  id: number;
  crop: CropType | null;
  plantedAt: number | null; // timestamp in ms
  readyAt: number | null;   // timestamp in ms
}

export interface FarmOrderRequirement {
  crop: CropType;
  count: number;
}

export interface FarmOrder {
  id: string;
  customerName: string;
  customerTitle: string;
  customerAvatar: string;
  requirements: FarmOrderRequirement[];
  rewardCoins: number;
  rewardExp: number;
}

export interface FarmState {
  userId: string;
  userName: string;
  level: number;
  exp: number;
  expToNext: number;
  coins: number;
  gems: number;
  fertilizers: number; // Tăng tốc chín tức thì
  barn: Record<CropType, number>;
  barnCapacity: number;
  plots: FarmPlot[];
  orders: FarmOrder[];
  stats: {
    totalHarvested: number;
    ordersCompleted: number;
    miniGamesWon: number;
  };
  lastSaved: number;
}

// Mini-game Room Types
export type ArcadeGameType = 'CARO' | 'WORD_CHAIN';

export interface RoomPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
}

export interface CaroGameState {
  board: Array<'X' | 'O' | null>; // 100 items (10x10)
  currentTurn: 'X' | 'O';
  winner: 'X' | 'O' | 'DRAW' | null;
  lastMove: number | null;
  winningLine?: number[];
}

export interface WordChainItem {
  word: string;
  playerId: string;
  playerName: string;
  timestamp: number;
  roastComment?: string;
}

export interface WordChainGameState {
  chain: WordChainItem[];
  currentTurnPlayerId: string;
  turnDeadline: number;
  winnerId: string | null;
  loserId: string | null;
  lastRefereeComment: string;
}

export interface ArcadeRoomData {
  roomCode: string;
  gameType: ArcadeGameType | string;
  status: 'waiting' | 'playing' | 'ended';
  host: RoomPlayer;
  guest: RoomPlayer | null;
  board?: any;
  currentTurn?: 'X' | 'O';
  winner?: 'X' | 'O' | 'DRAW' | null;
  caroState?: CaroGameState;
  wordChainState?: WordChainGameState;
  createdAt: number;
}
