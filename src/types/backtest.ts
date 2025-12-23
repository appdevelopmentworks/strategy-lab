/**
 * Backtest Types
 */

import type { Signal, StrategyParams, Trade } from './strategy'

/** Backtest performance metrics */
export interface BacktestMetrics {
  /** Win rate (%) */
  winRate: number
  /** Total number of trades */
  totalTrades: number
  /** Number of winning trades */
  winningTrades: number
  /** Number of losing trades */
  losingTrades: number
  /** Average win (%) */
  avgWin: number
  /** Average loss (%) */
  avgLoss: number
  /** Total return (%) */
  totalReturn: number
  /** Profit factor (gross profit / gross loss) */
  profitFactor: number
  /** Maximum drawdown (%) */
  maxDrawdown: number
  /** Sharpe ratio (annualized) */
  sharpeRatio: number
  /** Maximum consecutive wins */
  maxConsecutiveWins: number
  /** Maximum consecutive losses */
  maxConsecutiveLosses: number
  /** Average holding period (days) */
  avgHoldingPeriod: number
  /** Gross profit */
  grossProfit: number
  /** Gross loss */
  grossLoss: number
}

/** Backtest result for a single strategy */
export interface BacktestResult {
  strategyId: string
  strategyName: string
  strategyNameJa: string
  category: string
  ticker: string
  period: string
  parameters: StrategyParams
  metrics: BacktestMetrics
  signals: Signal[]
  trades: Trade[]
  equity: EquityPoint[]
}

/** Equity curve data point */
export interface EquityPoint {
  date: Date
  equity: number
  drawdown: number
}

/** Optimization target */
export type OptimizationTarget = 'winRate' | 'totalReturn' | 'profitFactor' | 'sharpeRatio'

/** Optimization result */
export interface OptimizationResult {
  parameters: StrategyParams
  score: number
  metrics: BacktestMetrics
}

/** Walk-forward validation result */
export interface WalkForwardResult {
  bestParameters: StrategyParams
  bestScore: number
  objective: OptimizationTarget
  trainMetrics: BacktestMetrics
  testMetrics: BacktestMetrics
  overfitRisk: 'low' | 'medium' | 'high'
  allResults: OptimizationResult[]
}

/** Filter conditions for strategy search */
export interface FilterConditions {
  minWinRate?: number
  minTrades?: number
  minReturn?: number
  minProfitFactor?: number
  maxDrawdown?: number
}

/** Sort options for results */
export type SortField = 
  | 'winRate' 
  | 'totalReturn' 
  | 'profitFactor' 
  | 'sharpeRatio' 
  | 'maxDrawdown'
  | 'totalTrades'

export type SortOrder = 'asc' | 'desc'
