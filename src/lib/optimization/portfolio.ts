/**
 * Portfolio Optimization
 * 
 * Multi-asset/strategy portfolio construction with various optimization methods:
 * - Equal Weight
 * - Risk Parity
 * - Maximum Sharpe Ratio
 * - Minimum Variance
 * - Maximum Return
 */

import type { BacktestMetrics, EquityPoint } from '@/types'

export type PortfolioOptMethod = 'equal' | 'risk_parity' | 'max_sharpe' | 'min_variance' | 'max_return'

export interface PortfolioAsset {
  id: string
  ticker: string
  strategyId: string
  strategyName: string
  metrics: BacktestMetrics
  equityCurve: EquityPoint[]
  returns: number[] // daily returns
}

export interface PortfolioConfig {
  assets: PortfolioAsset[]
  method: PortfolioOptMethod
  riskFreeRate?: number // Annualized, default 0.02
  constraints?: {
    minWeight?: number // Minimum weight per asset (default 0)
    maxWeight?: number // Maximum weight per asset (default 1)
  }
}

export interface PortfolioResult {
  method: PortfolioOptMethod
  assets: Array<{
    id: string
    ticker: string
    strategyId: string
    strategyName: string
    weight: number
    metrics: BacktestMetrics
  }>
  weights: number[]
  combinedMetrics: {
    expectedReturn: number // Annualized
    volatility: number // Annualized
    sharpeRatio: number
    maxDrawdown: number
    diversificationRatio: number
  }
  correlationMatrix: number[][]
  covarianceMatrix: number[][]
  efficientFrontier?: {
    points: Array<{
      return: number
      volatility: number
      sharpe: number
      weights: number[]
    }>
  }
  executionTimeMs: number
}

/**
 * Calculate daily returns from equity curve
 */
export function calculateReturns(equityCurve: EquityPoint[]): number[] {
  if (equityCurve.length < 2) return []
  
  const returns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const dailyReturn = (equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity
    returns.push(dailyReturn)
  }
  return returns
}

/**
 * Calculate mean of array
 */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Calculate variance of array
 */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return arr.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (arr.length - 1)
}

/**
 * Calculate standard deviation of array
 */
function stdDev(arr: number[]): number {
  return Math.sqrt(variance(arr))
}

/**
 * Calculate covariance between two arrays
 */
function covariance(arr1: number[], arr2: number[]): number {
  const n = Math.min(arr1.length, arr2.length)
  if (n < 2) return 0
  
  const m1 = mean(arr1.slice(0, n))
  const m2 = mean(arr2.slice(0, n))
  
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += (arr1[i] - m1) * (arr2[i] - m2)
  }
  
  return sum / (n - 1)
}

/**
 * Calculate correlation between two arrays
 */
function correlation(arr1: number[], arr2: number[]): number {
  const cov = covariance(arr1, arr2)
  const std1 = stdDev(arr1)
  const std2 = stdDev(arr2)
  
  if (std1 === 0 || std2 === 0) return 0
  return cov / (std1 * std2)
}

/**
 * Calculate covariance matrix
 */
function calculateCovarianceMatrix(assets: PortfolioAsset[]): number[][] {
  const n = assets.length
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = covariance(assets[i].returns, assets[j].returns)
    }
  }
  
  return matrix
}

/**
 * Calculate correlation matrix
 */
function calculateCorrelationMatrix(assets: PortfolioAsset[]): number[][] {
  const n = assets.length
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matrix[i][j] = correlation(assets[i].returns, assets[j].returns)
    }
  }
  
  return matrix
}

/**
 * Calculate portfolio return given weights
 */
function portfolioReturn(weights: number[], expectedReturns: number[]): number {
  return weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0)
}

/**
 * Calculate portfolio variance given weights and covariance matrix
 */
function portfolioVariance(weights: number[], covMatrix: number[][]): number {
  let variance = 0
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      variance += weights[i] * weights[j] * covMatrix[i][j]
    }
  }
  return variance
}

/**
 * Calculate portfolio volatility (standard deviation)
 */
function portfolioVolatility(weights: number[], covMatrix: number[][]): number {
  return Math.sqrt(portfolioVariance(weights, covMatrix))
}

/**
 * Calculate Sharpe ratio
 */
function sharpeRatio(ret: number, vol: number, riskFreeRate: number): number {
  if (vol === 0) return 0
  return (ret - riskFreeRate) / vol
}

/**
 * Normalize weights to sum to 1
 */
function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum === 0) return weights.map(() => 1 / weights.length)
  return weights.map(w => w / sum)
}

/**
 * Apply constraints to weights
 */
function applyConstraints(
  weights: number[], 
  minWeight: number, 
  maxWeight: number
): number[] {
  // Clip weights
  let clipped = weights.map(w => Math.max(minWeight, Math.min(maxWeight, w)))
  
  // Renormalize
  return normalizeWeights(clipped)
}

/**
 * Equal Weight Portfolio
 */
function equalWeight(assets: PortfolioAsset[]): number[] {
  const n = assets.length
  return Array(n).fill(1 / n)
}

/**
 * Risk Parity Portfolio
 * Weights inversely proportional to asset volatility
 */
function riskParity(assets: PortfolioAsset[]): number[] {
  const volatilities = assets.map(a => {
    const vol = stdDev(a.returns)
    return vol === 0 ? 0.0001 : vol // Avoid division by zero
  })
  
  const inverseVols = volatilities.map(v => 1 / v)
  return normalizeWeights(inverseVols)
}

/**
 * Maximum Sharpe Ratio Portfolio
 * Uses numerical optimization (gradient-free)
 */
function maxSharpe(
  assets: PortfolioAsset[], 
  covMatrix: number[][], 
  expectedReturns: number[],
  riskFreeRate: number,
  constraints: { minWeight: number; maxWeight: number }
): number[] {
  const n = assets.length
  
  // Simple grid search for small n
  if (n <= 4) {
    return gridSearchOptimize(
      n,
      (weights) => {
        const ret = portfolioReturn(weights, expectedReturns) * 252
        const vol = portfolioVolatility(weights, covMatrix) * Math.sqrt(252)
        return sharpeRatio(ret, vol, riskFreeRate)
      },
      constraints,
      20 // grid size per dimension
    )
  }
  
  // For larger n, use random search
  return randomSearchOptimize(
    n,
    (weights) => {
      const ret = portfolioReturn(weights, expectedReturns) * 252
      const vol = portfolioVolatility(weights, covMatrix) * Math.sqrt(252)
      return sharpeRatio(ret, vol, riskFreeRate)
    },
    constraints,
    5000 // iterations
  )
}

/**
 * Minimum Variance Portfolio
 */
function minVariance(
  assets: PortfolioAsset[], 
  covMatrix: number[][],
  constraints: { minWeight: number; maxWeight: number }
): number[] {
  const n = assets.length
  
  // Optimize for minimum variance (negative to maximize in search)
  const objective = (weights: number[]) => {
    return -portfolioVariance(weights, covMatrix)
  }
  
  if (n <= 4) {
    return gridSearchOptimize(n, objective, constraints, 20)
  }
  
  return randomSearchOptimize(n, objective, constraints, 5000)
}

/**
 * Maximum Return Portfolio
 */
function maxReturn(
  assets: PortfolioAsset[], 
  expectedReturns: number[],
  constraints: { minWeight: number; maxWeight: number }
): number[] {
  const n = assets.length
  
  const objective = (weights: number[]) => {
    return portfolioReturn(weights, expectedReturns)
  }
  
  if (n <= 4) {
    return gridSearchOptimize(n, objective, constraints, 20)
  }
  
  return randomSearchOptimize(n, objective, constraints, 5000)
}

/**
 * Grid search optimization for small dimensions
 */
function gridSearchOptimize(
  n: number,
  objective: (weights: number[]) => number,
  constraints: { minWeight: number; maxWeight: number },
  gridSize: number
): number[] {
  const step = 1 / gridSize
  let bestWeights = equalWeight(Array(n).fill(null) as any)
  let bestScore = objective(bestWeights)
  
  // Generate grid points
  function* generateGrid(dim: number, remaining: number): Generator<number[]> {
    if (dim === n - 1) {
      yield [remaining]
      return
    }
    
    for (let w = constraints.minWeight; w <= Math.min(constraints.maxWeight, remaining); w += step) {
      for (const rest of generateGrid(dim + 1, remaining - w)) {
        yield [w, ...rest]
      }
    }
  }
  
  for (const weights of generateGrid(0, 1)) {
    const normalized = normalizeWeights(weights)
    const score = objective(normalized)
    
    if (score > bestScore) {
      bestScore = score
      bestWeights = normalized
    }
  }
  
  return applyConstraints(bestWeights, constraints.minWeight, constraints.maxWeight)
}

/**
 * Random search optimization for larger dimensions
 */
function randomSearchOptimize(
  n: number,
  objective: (weights: number[]) => number,
  constraints: { minWeight: number; maxWeight: number },
  iterations: number
): number[] {
  let bestWeights = equalWeight(Array(n).fill(null) as any)
  let bestScore = objective(bestWeights)
  
  for (let i = 0; i < iterations; i++) {
    // Generate random weights using Dirichlet-like distribution
    const rawWeights = Array(n).fill(0).map(() => Math.random())
    const weights = normalizeWeights(rawWeights)
    const constrained = applyConstraints(weights, constraints.minWeight, constraints.maxWeight)
    
    const score = objective(constrained)
    
    if (score > bestScore) {
      bestScore = score
      bestWeights = constrained
    }
  }
  
  return bestWeights
}

/**
 * Calculate max drawdown for portfolio
 */
function calculatePortfolioMaxDrawdown(
  assets: PortfolioAsset[], 
  weights: number[]
): number {
  // Align equity curves by date and calculate weighted equity
  const minLength = Math.min(...assets.map(a => a.equityCurve.length))
  if (minLength === 0) return 0
  
  const combinedEquity: number[] = []
  for (let i = 0; i < minLength; i++) {
    let equity = 0
    for (let j = 0; j < assets.length; j++) {
      equity += assets[j].equityCurve[i].equity * weights[j]
    }
    combinedEquity.push(equity)
  }
  
  // Calculate max drawdown
  let peak = combinedEquity[0]
  let maxDD = 0
  
  for (const equity of combinedEquity) {
    if (equity > peak) peak = equity
    const dd = (peak - equity) / peak
    if (dd > maxDD) maxDD = dd
  }
  
  return maxDD * 100
}

/**
 * Calculate diversification ratio
 */
function calculateDiversificationRatio(
  assets: PortfolioAsset[], 
  weights: number[], 
  covMatrix: number[][]
): number {
  // Weighted average of individual volatilities
  const individualVols = assets.map(a => stdDev(a.returns))
  const weightedAvgVol = weights.reduce((sum, w, i) => sum + w * individualVols[i], 0)
  
  // Portfolio volatility
  const portVol = portfolioVolatility(weights, covMatrix)
  
  if (portVol === 0) return 1
  return weightedAvgVol / portVol
}

/**
 * Generate efficient frontier points
 */
function generateEfficientFrontier(
  assets: PortfolioAsset[],
  covMatrix: number[][],
  expectedReturns: number[],
  riskFreeRate: number,
  constraints: { minWeight: number; maxWeight: number },
  numPoints: number = 20
): NonNullable<PortfolioResult['efficientFrontier']> {
  const n = assets.length
  const points: Array<{
    return: number
    volatility: number
    sharpe: number
    weights: number[]
  }> = []
  
  // Find return range
  const minRet = Math.min(...expectedReturns)
  const maxRet = Math.max(...expectedReturns)
  const retRange = maxRet - minRet
  
  for (let i = 0; i < numPoints; i++) {
    const targetRet = minRet + (retRange * i / (numPoints - 1))
    
    // Find minimum variance portfolio for this target return
    const objective = (weights: number[]) => {
      const ret = portfolioReturn(weights, expectedReturns)
      const vol = portfolioVariance(weights, covMatrix)
      
      // Penalty for not meeting target return
      const penalty = Math.pow(ret - targetRet, 2) * 1000
      
      return -(vol + penalty)
    }
    
    const weights = randomSearchOptimize(n, objective, constraints, 1000)
    const ret = portfolioReturn(weights, expectedReturns) * 252
    const vol = portfolioVolatility(weights, covMatrix) * Math.sqrt(252)
    const sharpe = sharpeRatio(ret, vol, riskFreeRate)
    
    points.push({ return: ret, volatility: vol, sharpe, weights })
  }
  
  return { points }
}

/**
 * Run portfolio optimization
 */
export function runPortfolioOptimization(config: PortfolioConfig): PortfolioResult {
  const startTime = Date.now()
  
  const { assets, method, riskFreeRate = 0.02, constraints } = config
  const minWeight = constraints?.minWeight ?? 0
  const maxWeight = constraints?.maxWeight ?? 1
  
  if (assets.length < 2) {
    throw new Error('At least 2 assets required for portfolio optimization')
  }
  
  // Ensure all assets have returns calculated
  const processedAssets = assets.map(a => ({
    ...a,
    returns: a.returns.length > 0 ? a.returns : calculateReturns(a.equityCurve)
  }))
  
  // Calculate matrices
  const covMatrix = calculateCovarianceMatrix(processedAssets)
  const corrMatrix = calculateCorrelationMatrix(processedAssets)
  
  // Expected returns (annualized)
  const expectedReturns = processedAssets.map(a => mean(a.returns) * 252)
  
  // Optimize weights based on method
  let weights: number[]
  
  switch (method) {
    case 'equal':
      weights = equalWeight(processedAssets)
      break
    case 'risk_parity':
      weights = riskParity(processedAssets)
      break
    case 'max_sharpe':
      weights = maxSharpe(processedAssets, covMatrix, expectedReturns.map(r => r / 252), riskFreeRate, { minWeight, maxWeight })
      break
    case 'min_variance':
      weights = minVariance(processedAssets, covMatrix, { minWeight, maxWeight })
      break
    case 'max_return':
      weights = maxReturn(processedAssets, expectedReturns.map(r => r / 252), { minWeight, maxWeight })
      break
    default:
      weights = equalWeight(processedAssets)
  }
  
  // Calculate portfolio metrics
  const portReturn = portfolioReturn(weights, expectedReturns.map(r => r / 252)) * 252
  const portVol = portfolioVolatility(weights, covMatrix) * Math.sqrt(252)
  const portSharpe = sharpeRatio(portReturn, portVol, riskFreeRate)
  const maxDD = calculatePortfolioMaxDrawdown(processedAssets, weights)
  const divRatio = calculateDiversificationRatio(processedAssets, weights, covMatrix)
  
  // Generate efficient frontier (for visualization)
  const efficientFrontier = generateEfficientFrontier(
    processedAssets,
    covMatrix,
    expectedReturns.map(r => r / 252),
    riskFreeRate,
    { minWeight, maxWeight },
    15
  )
  
  return {
    method,
    assets: processedAssets.map((a, i) => ({
      id: a.id,
      ticker: a.ticker,
      strategyId: a.strategyId,
      strategyName: a.strategyName,
      weight: weights[i],
      metrics: a.metrics,
    })),
    weights,
    combinedMetrics: {
      expectedReturn: portReturn * 100, // Convert to percentage
      volatility: portVol * 100,
      sharpeRatio: portSharpe,
      maxDrawdown: maxDD,
      diversificationRatio: divRatio,
    },
    correlationMatrix: corrMatrix,
    covarianceMatrix: covMatrix,
    efficientFrontier,
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * Get method description
 */
export function getMethodDescription(method: PortfolioOptMethod): string {
  switch (method) {
    case 'equal':
      return '均等配分: 全資産に同じウェイトを配分'
    case 'risk_parity':
      return 'リスクパリティ: 各資産のリスク貢献度を均等化'
    case 'max_sharpe':
      return '最大シャープ: リスク調整後リターンを最大化'
    case 'min_variance':
      return '最小分散: ポートフォリオ全体のボラティリティを最小化'
    case 'max_return':
      return '最大リターン: 期待リターンを最大化（高リスク）'
    default:
      return ''
  }
}
