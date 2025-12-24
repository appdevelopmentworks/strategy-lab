/**
 * Monte Carlo Simulation
 * 
 * Statistical validation of trading strategy robustness
 */

import type { Trade, BacktestMetrics } from '@/types'

export interface MonteCarloConfig {
  trades: Trade[]
  initialCapital: number
  simulations: number
  confidenceLevel: number // e.g., 0.95 for 95%
}

export interface MonteCarloResult {
  // Original metrics
  originalMetrics: {
    totalReturn: number
    maxDrawdown: number
    sharpeRatio: number
    winRate: number
  }
  
  // Simulation statistics
  simulations: number
  
  // Return distribution
  returnDistribution: {
    mean: number
    median: number
    stdDev: number
    min: number
    max: number
    percentile5: number
    percentile25: number
    percentile75: number
    percentile95: number
  }
  
  // Drawdown distribution
  drawdownDistribution: {
    mean: number
    median: number
    max: number
    percentile95: number
  }
  
  // Risk metrics
  riskMetrics: {
    probabilityOfLoss: number      // % of simulations with negative return
    probabilityOfRuin: number      // % of simulations with > 50% drawdown
    expectedShortfall: number      // Average loss in worst 5% of cases (CVaR)
    valueAtRisk: number            // VaR at confidence level
  }
  
  // Equity curves (sample)
  sampleEquityCurves: number[][]
  
  executionTimeMs: number
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Calculate equity curve from shuffled trades
 */
function calculateEquityCurve(trades: Trade[], initialCapital: number): number[] {
  const equity: number[] = [initialCapital]
  let currentEquity = initialCapital
  
  for (const trade of trades) {
    currentEquity *= (1 + trade.profitPct / 100)
    equity.push(currentEquity)
  }
  
  return equity
}

/**
 * Calculate max drawdown from equity curve
 */
function calculateMaxDrawdown(equity: number[]): number {
  let peak = equity[0]
  let maxDrawdown = 0
  
  for (const value of equity) {
    if (value > peak) peak = value
    const drawdown = (peak - value) / peak * 100
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }
  
  return maxDrawdown
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  const index = (p / 100) * (sortedArray.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1]
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const startTime = Date.now()
  const { trades, initialCapital, simulations, confidenceLevel } = config
  
  if (trades.length === 0) {
    throw new Error('No trades to simulate')
  }
  
  // Calculate original metrics
  const originalEquity = calculateEquityCurve(trades, initialCapital)
  const originalReturn = ((originalEquity[originalEquity.length - 1] - initialCapital) / initialCapital) * 100
  const originalMaxDrawdown = calculateMaxDrawdown(originalEquity)
  const winningTrades = trades.filter(t => t.profitPct > 0).length
  const originalWinRate = (winningTrades / trades.length) * 100
  
  // Calculate original Sharpe ratio (simplified, assuming 0 risk-free rate)
  const returns = trades.map(t => t.profitPct)
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  const originalSharpe = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252) // Annualized
  
  // Run simulations
  const simulatedReturns: number[] = []
  const simulatedDrawdowns: number[] = []
  const sampleEquityCurves: number[][] = []
  
  for (let i = 0; i < simulations; i++) {
    const shuffledTrades = shuffleArray(trades)
    const equity = calculateEquityCurve(shuffledTrades, initialCapital)
    const totalReturn = ((equity[equity.length - 1] - initialCapital) / initialCapital) * 100
    const maxDrawdown = calculateMaxDrawdown(equity)
    
    simulatedReturns.push(totalReturn)
    simulatedDrawdowns.push(maxDrawdown)
    
    // Keep sample curves (every 10th simulation, max 10)
    if (i % Math.ceil(simulations / 10) === 0 && sampleEquityCurves.length < 10) {
      sampleEquityCurves.push(equity)
    }
  }
  
  // Sort for percentile calculations
  const sortedReturns = [...simulatedReturns].sort((a, b) => a - b)
  const sortedDrawdowns = [...simulatedDrawdowns].sort((a, b) => a - b)
  
  // Calculate statistics
  const meanReturn = simulatedReturns.reduce((a, b) => a + b, 0) / simulations
  const returnVariance = simulatedReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / simulations
  const returnStdDev = Math.sqrt(returnVariance)
  
  const meanDrawdown = simulatedDrawdowns.reduce((a, b) => a + b, 0) / simulations
  
  // Risk metrics
  const lossCount = simulatedReturns.filter(r => r < 0).length
  const ruinCount = simulatedDrawdowns.filter(d => d > 50).length
  const probabilityOfLoss = (lossCount / simulations) * 100
  const probabilityOfRuin = (ruinCount / simulations) * 100
  
  // VaR and Expected Shortfall (CVaR)
  const varIndex = Math.floor((1 - confidenceLevel) * simulations)
  const valueAtRisk = sortedReturns[varIndex]
  const worstReturns = sortedReturns.slice(0, varIndex + 1)
  const expectedShortfall = worstReturns.length > 0 
    ? worstReturns.reduce((a, b) => a + b, 0) / worstReturns.length 
    : sortedReturns[0]
  
  return {
    originalMetrics: {
      totalReturn: originalReturn,
      maxDrawdown: originalMaxDrawdown,
      sharpeRatio: originalSharpe,
      winRate: originalWinRate,
    },
    simulations,
    returnDistribution: {
      mean: meanReturn,
      median: percentile(sortedReturns, 50),
      stdDev: returnStdDev,
      min: sortedReturns[0],
      max: sortedReturns[sortedReturns.length - 1],
      percentile5: percentile(sortedReturns, 5),
      percentile25: percentile(sortedReturns, 25),
      percentile75: percentile(sortedReturns, 75),
      percentile95: percentile(sortedReturns, 95),
    },
    drawdownDistribution: {
      mean: meanDrawdown,
      median: percentile(sortedDrawdowns, 50),
      max: sortedDrawdowns[sortedDrawdowns.length - 1],
      percentile95: percentile(sortedDrawdowns, 95),
    },
    riskMetrics: {
      probabilityOfLoss,
      probabilityOfRuin,
      expectedShortfall,
      valueAtRisk,
    },
    sampleEquityCurves,
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * Run bootstrap simulation (resample with replacement)
 */
export function runBootstrapSimulation(config: MonteCarloConfig): MonteCarloResult {
  const startTime = Date.now()
  const { trades, initialCapital, simulations, confidenceLevel } = config
  
  if (trades.length === 0) {
    throw new Error('No trades to simulate')
  }
  
  // Calculate original metrics (same as Monte Carlo)
  const originalEquity = calculateEquityCurve(trades, initialCapital)
  const originalReturn = ((originalEquity[originalEquity.length - 1] - initialCapital) / initialCapital) * 100
  const originalMaxDrawdown = calculateMaxDrawdown(originalEquity)
  const winningTrades = trades.filter(t => t.profitPct > 0).length
  const originalWinRate = (winningTrades / trades.length) * 100
  
  const returns = trades.map(t => t.profitPct)
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  const originalSharpe = stdDev === 0 ? 0 : (avgReturn / stdDev) * Math.sqrt(252)
  
  // Run bootstrap simulations (resample with replacement)
  const simulatedReturns: number[] = []
  const simulatedDrawdowns: number[] = []
  const sampleEquityCurves: number[][] = []
  
  for (let i = 0; i < simulations; i++) {
    // Resample trades with replacement
    const resampledTrades: Trade[] = []
    for (let j = 0; j < trades.length; j++) {
      const randomIndex = Math.floor(Math.random() * trades.length)
      resampledTrades.push(trades[randomIndex])
    }
    
    const equity = calculateEquityCurve(resampledTrades, initialCapital)
    const totalReturn = ((equity[equity.length - 1] - initialCapital) / initialCapital) * 100
    const maxDrawdown = calculateMaxDrawdown(equity)
    
    simulatedReturns.push(totalReturn)
    simulatedDrawdowns.push(maxDrawdown)
    
    if (i % Math.ceil(simulations / 10) === 0 && sampleEquityCurves.length < 10) {
      sampleEquityCurves.push(equity)
    }
  }
  
  // Calculate statistics (same as Monte Carlo)
  const sortedReturns = [...simulatedReturns].sort((a, b) => a - b)
  const sortedDrawdowns = [...simulatedDrawdowns].sort((a, b) => a - b)
  
  const meanReturn = simulatedReturns.reduce((a, b) => a + b, 0) / simulations
  const returnVariance = simulatedReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / simulations
  const returnStdDev = Math.sqrt(returnVariance)
  
  const meanDrawdown = simulatedDrawdowns.reduce((a, b) => a + b, 0) / simulations
  
  const lossCount = simulatedReturns.filter(r => r < 0).length
  const ruinCount = simulatedDrawdowns.filter(d => d > 50).length
  const probabilityOfLoss = (lossCount / simulations) * 100
  const probabilityOfRuin = (ruinCount / simulations) * 100
  
  const varIndex = Math.floor((1 - confidenceLevel) * simulations)
  const valueAtRisk = sortedReturns[varIndex]
  const worstReturns = sortedReturns.slice(0, varIndex + 1)
  const expectedShortfall = worstReturns.length > 0 
    ? worstReturns.reduce((a, b) => a + b, 0) / worstReturns.length 
    : sortedReturns[0]
  
  return {
    originalMetrics: {
      totalReturn: originalReturn,
      maxDrawdown: originalMaxDrawdown,
      sharpeRatio: originalSharpe,
      winRate: originalWinRate,
    },
    simulations,
    returnDistribution: {
      mean: meanReturn,
      median: percentile(sortedReturns, 50),
      stdDev: returnStdDev,
      min: sortedReturns[0],
      max: sortedReturns[sortedReturns.length - 1],
      percentile5: percentile(sortedReturns, 5),
      percentile25: percentile(sortedReturns, 25),
      percentile75: percentile(sortedReturns, 75),
      percentile95: percentile(sortedReturns, 95),
    },
    drawdownDistribution: {
      mean: meanDrawdown,
      median: percentile(sortedDrawdowns, 50),
      max: sortedDrawdowns[sortedDrawdowns.length - 1],
      percentile95: percentile(sortedDrawdowns, 95),
    },
    riskMetrics: {
      probabilityOfLoss,
      probabilityOfRuin,
      expectedShortfall,
      valueAtRisk,
    },
    sampleEquityCurves,
    executionTimeMs: Date.now() - startTime,
  }
}
