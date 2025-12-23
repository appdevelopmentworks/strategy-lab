/**
 * Backtest Engine
 * 
 * Core backtesting logic that executes trading strategies on historical data.
 */

import type {
  OHLCV,
  Signal,
  Trade,
  BacktestMetrics,
  EquityPoint,
  StrategyParams,
} from '@/types'

/** Initial capital for backtesting */
const INITIAL_CAPITAL = 100000

/** Risk-free rate for Sharpe ratio calculation (annualized) */
const RISK_FREE_RATE = 0.02

/** Trading days per year for annualization */
const TRADING_DAYS_PER_YEAR = 252

/**
 * Strategy interface that all strategies must implement
 */
export interface Strategy {
  id: string
  name: string
  nameJa: string
  category: string
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[]
}

/**
 * Execute backtest on historical data using given signals
 */
export function executeBacktest(
  data: OHLCV[],
  signals: Signal[]
): {
  trades: Trade[]
  equity: EquityPoint[]
  metrics: BacktestMetrics
} {
  const trades: Trade[] = []
  const equity: EquityPoint[] = []
  
  let position: { entryDate: Date; entryPrice: number } | null = null
  let capital = INITIAL_CAPITAL
  let peakCapital = capital
  let maxDrawdown = 0
  
  // Create a map of signals by date for quick lookup
  const signalMap = new Map<string, Signal>()
  for (const signal of signals) {
    const dateKey = signal.date.toISOString().split('T')[0]
    signalMap.set(dateKey, signal)
  }
  
  // Process each data point
  for (let i = 0; i < data.length; i++) {
    const candle = data[i]
    const dateKey = candle.date.toISOString().split('T')[0]
    const signal = signalMap.get(dateKey)
    
    // Handle signals
    if (signal) {
      if (signal.type === 'BUY' && !position) {
        // Enter long position
        position = {
          entryDate: candle.date,
          entryPrice: candle.close,
        }
      } else if (signal.type === 'SELL' && position) {
        // Exit long position
        const exitPrice = candle.close
        const profitPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100
        const profitAmount = capital * (profitPct / 100)
        
        const holdingDays = Math.floor(
          (candle.date.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        trades.push({
          entryDate: position.entryDate,
          entryPrice: position.entryPrice,
          exitDate: candle.date,
          exitPrice,
          type: 'LONG',
          profitPct,
          profitAmount,
          holdingDays,
        })
        
        capital += profitAmount
        position = null
      }
    }
    
    // Update equity curve
    let currentEquity = capital
    if (position) {
      const unrealizedPct = ((candle.close - position.entryPrice) / position.entryPrice) * 100
      currentEquity = capital + (capital * (unrealizedPct / 100))
    }
    
    // Track peak and drawdown
    if (currentEquity > peakCapital) {
      peakCapital = currentEquity
    }
    const drawdown = ((peakCapital - currentEquity) / peakCapital) * 100
    maxDrawdown = Math.max(maxDrawdown, drawdown)
    
    equity.push({
      date: candle.date,
      equity: currentEquity,
      drawdown: -drawdown,
    })
  }
  
  // Close any open position at the end
  if (position && data.length > 0) {
    const lastCandle = data[data.length - 1]
    const exitPrice = lastCandle.close
    const profitPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100
    const profitAmount = capital * (profitPct / 100)
    
    const holdingDays = Math.floor(
      (lastCandle.date.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    trades.push({
      entryDate: position.entryDate,
      entryPrice: position.entryPrice,
      exitDate: lastCandle.date,
      exitPrice,
      type: 'LONG',
      profitPct,
      profitAmount,
      holdingDays,
    })
    
    capital += profitAmount
  }
  
  // Calculate metrics
  const metrics = calculateMetrics(trades, equity, INITIAL_CAPITAL, maxDrawdown)
  
  return { trades, equity, metrics }
}

/**
 * Calculate backtest performance metrics
 */
export function calculateMetrics(
  trades: Trade[],
  equity: EquityPoint[],
  initialCapital: number,
  maxDrawdown: number
): BacktestMetrics {
  if (trades.length === 0) {
    return {
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      avgWin: 0,
      avgLoss: 0,
      totalReturn: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
      avgHoldingPeriod: 0,
      grossProfit: 0,
      grossLoss: 0,
    }
  }
  
  const winningTrades = trades.filter(t => t.profitPct > 0)
  const losingTrades = trades.filter(t => t.profitPct <= 0)
  
  const winRate = (winningTrades.length / trades.length) * 100
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + t.profitPct, 0) / winningTrades.length
    : 0
  const avgLoss = losingTrades.length > 0
    ? losingTrades.reduce((sum, t) => sum + t.profitPct, 0) / losingTrades.length
    : 0
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.profitAmount, 0)
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitAmount, 0))
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  
  const finalEquity = equity.length > 0 ? equity[equity.length - 1].equity : initialCapital
  const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100
  
  // Calculate Sharpe Ratio
  const returns: number[] = []
  for (let i = 1; i < equity.length; i++) {
    const dailyReturn = (equity[i].equity - equity[i - 1].equity) / equity[i - 1].equity
    returns.push(dailyReturn)
  }
  
  const avgReturn = returns.length > 0 
    ? returns.reduce((sum, r) => sum + r, 0) / returns.length 
    : 0
  const variance = returns.length > 0
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    : 0
  const stdDev = Math.sqrt(variance)
  
  const annualizedReturn = avgReturn * TRADING_DAYS_PER_YEAR
  const annualizedStdDev = stdDev * Math.sqrt(TRADING_DAYS_PER_YEAR)
  const sharpeRatio = annualizedStdDev > 0 
    ? (annualizedReturn - RISK_FREE_RATE) / annualizedStdDev 
    : 0
  
  // Calculate consecutive wins/losses
  let maxConsecutiveWins = 0
  let maxConsecutiveLosses = 0
  let currentWins = 0
  let currentLosses = 0
  
  for (const trade of trades) {
    if (trade.profitPct > 0) {
      currentWins++
      currentLosses = 0
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins)
    } else {
      currentLosses++
      currentWins = 0
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses)
    }
  }
  
  // Calculate average holding period
  const avgHoldingPeriod = trades.reduce((sum, t) => sum + t.holdingDays, 0) / trades.length
  
  return {
    winRate,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    avgWin,
    avgLoss,
    totalReturn,
    profitFactor,
    maxDrawdown,
    sharpeRatio,
    maxConsecutiveWins,
    maxConsecutiveLosses,
    avgHoldingPeriod,
    grossProfit,
    grossLoss,
  }
}

/**
 * Run backtest for a strategy with given parameters
 */
export function runBacktest(
  strategy: Strategy,
  data: OHLCV[],
  params: StrategyParams
): {
  signals: Signal[]
  trades: Trade[]
  equity: EquityPoint[]
  metrics: BacktestMetrics
} {
  const signals = strategy.generateSignals(data, params)
  const { trades, equity, metrics } = executeBacktest(data, signals)
  
  return {
    signals,
    trades,
    equity,
    metrics,
  }
}
