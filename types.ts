

export enum GameType {
  NONE = 'NONE',
  CRASH = 'CRASH',
  PLINKO = 'PLINKO',
  MINES = 'MINES',
  DICE = 'DICE',
  LIMBO = 'LIMBO',
  WHEEL = 'WHEEL',
  HILO = 'HILO',
  COINFLIP = 'COINFLIP',
  TOWER = 'TOWER',
  SLOTS = 'SLOTS',
  KENO = 'KENO',
  ROULETTE = 'ROULETTE',
  BLACKJACK = 'BLACKJACK',
  LOOT = 'LOOT',
  SICBO = 'SICBO',
  THIMBLES = 'THIMBLES',
  CANDYSMASH = 'CANDYSMASH',
  STAIRCASE = 'STAIRCASE'
}

export interface UserState {
  balance: number;
  username: string;
}

export interface ChatMessage {
  id: string;
  user: string;
  message: string;
  isSystem?: boolean;
  isAi?: boolean;
  timestamp: number;
}

export interface BetResult {
  wager: number;
  payout: number;
  multiplier: number;
  won: boolean;
}

export interface BetHistoryItem {
  id: string;
  game: GameType;
  wager: number;
  payout: number;
  timestamp: number;
}