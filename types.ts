
export enum TradeType {
  LONG = 'LONG',
  SHORT = 'SHORT',
}

export enum TradeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING',
}

export interface Trade {
  id: string;
  symbol: string; // e.g., EURUSD, BTCUSDT
  type: TradeType;
  status: TradeStatus;
  entryDate: string;
  expiryDate?: string; // Optional Expiry Date for Options
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  stopLoss?: number;
  takeProfit?: number;
  pnl?: number; // Realized Profit and Loss
  setup: string; // The strategy used
  notes: string; // Psychology or analysis notes
  tags: string[];
}

export interface DailyNote {
  date: string; // YYYY-MM-DD
  content: string;
  mood?: 'Happy' | 'Neutral' | 'Sad' | 'Frustrated' | 'Disciplined';
}

export interface DashboardStats {
  totalTrades: number;
  winRate: number;
  netPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxWinStreak: number;
  currentStreak: number;
}

export type ThemeColor = 'blue' | 'purple' | 'orange' | 'teal' | 'rose';
export type FontFamily = 'Inter' | 'Playfair Display' | 'JetBrains Mono';

export interface AppSettings {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
}

export interface User {
  name: string;
  email: string;
}
