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
  
  // === 資金管理用指標 (v1.5.0) ===
  
  /** Expectancy - 期待値 (1トレードあたりの期待利益%) */
  expectancy: number
  /** Payoff Ratio - ペイオフレシオ (平均利益 ÷ 平均損失の絶対値) */
  payoffRatio: number
  /** Recovery Factor - リカバリーファクター (総リターン ÷ 最大DD) */
  recoveryFactor: number
  /** Kelly Criterion - ケリー基準 (最適ポジションサイズ%) */
  kellyPercent: number
  /** Daily Volatility - 日次ボラティリティ (日次リターンの標準偏差%) */
  dailyVolatility: number
  /** Average ATR% - 平均ATR (終値に対する%) */
  avgATRPercent: number
  /** CAGR - 年率換算リターン (%) */
  cagr: number
  /** Calmar Ratio - カルマーレシオ (CAGR ÷ 最大DD) */
  calmarRatio: number
  /** Risk of Ruin - 破産確率の目安 (%) */
  riskOfRuin: number
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

/** Walk-forward window result */
export interface WalkForwardWindow {
  windowIndex: number
  trainStart: Date
  trainEnd: Date
  testStart: Date
  testEnd: Date
  bestParams: StrategyParams
  trainMetrics: BacktestMetrics
  testMetrics: BacktestMetrics
  trainScore: number
  testScore: number
}

/** Walk-forward analysis result */
export interface WalkForwardAnalysis {
  strategyId: string
  ticker: string
  objective: OptimizationTarget
  windowCount: number
  trainRatio: number
  windows: WalkForwardWindow[]
  aggregatedTrainMetrics: {
    avgWinRate: number
    avgReturn: number
    avgPF: number
    avgSharpe: number
  }
  aggregatedTestMetrics: {
    avgWinRate: number
    avgReturn: number
    avgPF: number
    avgSharpe: number
  }
  overfitRatio: number // train/test performance ratio
  robustnessScore: number // 0-100, higher is better
  consistency: number // % of windows with positive test return
  executionTimeMs: number
}

/** Portfolio asset */
export interface PortfolioAsset {
  ticker: string
  strategyId: string
  strategyName: string
  weight: number
  metrics: BacktestMetrics
  returns: number[] // daily returns
}

/** Portfolio optimization method */
export type PortfolioOptMethod = 'equal' | 'risk_parity' | 'max_sharpe' | 'min_variance' | 'max_return'

/** Portfolio optimization result */
export interface PortfolioOptResult {
  method: PortfolioOptMethod
  assets: PortfolioAsset[]
  weights: number[]
  combinedMetrics: {
    expectedReturn: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    diversificationRatio: number
  }
  correlationMatrix: number[][]
  efficientFrontier?: {
    returns: number[]
    volatilities: number[]
    sharpes: number[]
    weights: number[][]
  }
  executionTimeMs: number
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
