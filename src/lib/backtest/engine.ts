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
 * Calculate ATR (Average True Range)
 */
function calculateATR(data: OHLCV[], period: number = 14): number[] {
  const atr: number[] = []
  const trueRanges: number[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      trueRanges.push(data[i].high - data[i].low)
    } else {
      const tr = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      )
      trueRanges.push(tr)
    }
    
    if (i >= period - 1) {
      const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
      atr.push(sum / period)
    }
  }
  
  return atr
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
  const metrics = calculateMetrics(trades, equity, data, INITIAL_CAPITAL, maxDrawdown)
  
  return { trades, equity, metrics }
}

/**
 * Calculate backtest performance metrics
 */
export function calculateMetrics(
  trades: Trade[],
  equity: EquityPoint[],
  data: OHLCV[],
  initialCapital: number,
  maxDrawdown: number
): BacktestMetrics {
  // Default values for empty metrics
  const emptyMetrics: BacktestMetrics = {
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
    // 資金管理用指標
    expectancy: 0,
    payoffRatio: 0,
    recoveryFactor: 0,
    kellyPercent: 0,
    dailyVolatility: 0,
    avgATRPercent: 0,
    cagr: 0,
    calmarRatio: 0,
    riskOfRuin: 0,
  }
  
  if (trades.length === 0) {
    return emptyMetrics
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
  
  // Calculate daily returns for Sharpe ratio and volatility
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
  
  // ========================================
  // 資金管理用指標の計算
  // ========================================
  
  // 1. 期待値 (Expectancy) - 1トレードあたりの期待利益%
  // Expectancy = (勝率 × 平均利益) + (敗率 × 平均損失)
  const winRateDecimal = winRate / 100
  const loseRateDecimal = 1 - winRateDecimal
  const expectancy = (winRateDecimal * avgWin) + (loseRateDecimal * avgLoss)
  
  // 2. ペイオフレシオ (Payoff Ratio) - 平均利益 ÷ 平均損失の絶対値
  const payoffRatio = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : avgWin > 0 ? Infinity : 0
  
  // 3. リカバリーファクター (Recovery Factor) - 総リターン ÷ 最大DD
  const recoveryFactor = maxDrawdown > 0 ? totalReturn / maxDrawdown : totalReturn > 0 ? Infinity : 0
  
  // 4. ケリー基準 (Kelly Criterion) - 最適ポジションサイズ%
  // Kelly% = W - (1-W)/R  where W=勝率, R=ペイオフレシオ
  // 実用的には半ケリー（Kelly÷2）がよく使われる
  let kellyPercent = 0
  if (payoffRatio > 0 && payoffRatio !== Infinity) {
    kellyPercent = (winRateDecimal - ((1 - winRateDecimal) / payoffRatio)) * 100
    // 負のケリーは0にする（期待値マイナスの戦略）
    kellyPercent = Math.max(0, kellyPercent)
  }
  
  // 5. 日次ボラティリティ (Daily Volatility) - 日次リターンの標準偏差%
  const dailyVolatility = stdDev * 100
  
  // 6. 平均ATR% (Average ATR Percent) - 終値に対するATRの割合
  let avgATRPercent = 0
  if (data.length > 14) {
    const atrValues = calculateATR(data, 14)
    if (atrValues.length > 0) {
      const avgATR = atrValues.reduce((a, b) => a + b, 0) / atrValues.length
      const avgClose = data.slice(-atrValues.length).reduce((sum, d) => sum + d.close, 0) / atrValues.length
      avgATRPercent = avgClose > 0 ? (avgATR / avgClose) * 100 : 0
    }
  }
  
  // 7. CAGR (Compound Annual Growth Rate) - 年率換算リターン
  let cagr = 0
  if (equity.length >= 2) {
    const totalDays = (equity[equity.length - 1].date.getTime() - equity[0].date.getTime()) / (1000 * 60 * 60 * 24)
    const years = totalDays / 365
    if (years > 0 && finalEquity > 0 && initialCapital > 0) {
      cagr = (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100
    }
  }
  
  // 8. カルマーレシオ (Calmar Ratio) - CAGR ÷ 最大DD
  const calmarRatio = maxDrawdown > 0 ? cagr / maxDrawdown : cagr > 0 ? Infinity : 0
  
  // 9. 破産確率の目安 (Risk of Ruin) - 簡易版
  // RoR ≈ ((1 - Edge) / (1 + Edge))^Units
  // Edge = 期待値 / 平均損失の絶対値
  // Units = 資金 / 1トレードあたりのリスク
  let riskOfRuin = 0
  if (avgLoss !== 0 && expectancy !== 0) {
    const edge = expectancy / Math.abs(avgLoss)
    if (edge > -1 && edge < 1) {
      // 簡易計算: 20単位（資金を20分割）として計算
      const units = 20
      riskOfRuin = Math.pow((1 - edge) / (1 + edge), units) * 100
      riskOfRuin = Math.min(100, Math.max(0, riskOfRuin))
    } else if (edge >= 1) {
      riskOfRuin = 0 // 非常に有利な戦略
    } else {
      riskOfRuin = 100 // 非常に不利な戦略
    }
  }
  
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
    // 資金管理用指標
    expectancy,
    payoffRatio,
    recoveryFactor,
    kellyPercent,
    dailyVolatility,
    avgATRPercent,
    cagr,
    calmarRatio,
    riskOfRuin,
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
