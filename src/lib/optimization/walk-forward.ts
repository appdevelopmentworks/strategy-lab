/**
 * Walk-Forward Optimization
 * 
 * Time-series cross-validation to detect and prevent overfitting.
 * Splits data into multiple train/test windows and validates
 * that optimized parameters generalize to out-of-sample periods.
 */

import type { OHLCV, StrategyParams, BacktestMetrics, OptimizationTarget } from '@/types'
import { runBacktest } from '@/lib/backtest'
import { getStrategy } from '@/lib/strategies/registry'

export interface WalkForwardConfig {
  strategyId: string
  stockData: OHLCV[]
  parameterRanges: ParameterRange[]
  objective: OptimizationTarget
  windowCount: number // Number of walk-forward windows (2-10)
  trainRatio: number // Train/Total ratio (0.5-0.9)
  anchoredStart?: boolean // If true, all windows start from beginning
}

export interface ParameterRange {
  name: string
  min: number
  max: number
  step: number
}

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

export interface WalkForwardResult {
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
  overfitRatio: number
  robustnessScore: number
  consistency: number
  executionTimeMs: number
}

/**
 * Generate all parameter combinations
 */
function generateCombinations(ranges: ParameterRange[]): StrategyParams[] {
  if (ranges.length === 0) return [{}]
  
  const [first, ...rest] = ranges
  const restCombinations = generateCombinations(rest)
  const combinations: StrategyParams[] = []
  
  for (let value = first.min; value <= first.max; value += first.step) {
    for (const restCombo of restCombinations) {
      combinations.push({
        [first.name]: Math.round(value * 1000) / 1000,
        ...restCombo,
      })
    }
  }
  
  return combinations
}

/**
 * Calculate objective score from metrics
 */
function calculateScore(metrics: BacktestMetrics, objective: OptimizationTarget): number {
  switch (objective) {
    case 'winRate':
      return metrics.winRate
    case 'totalReturn':
      return metrics.totalReturn
    case 'profitFactor':
      return metrics.profitFactor === Infinity ? 1000 : metrics.profitFactor
    case 'sharpeRatio':
      return metrics.sharpeRatio
    default:
      return metrics.winRate
  }
}

/**
 * Find best parameters for a given data slice
 */
function optimizeParameters(
  strategy: ReturnType<typeof getStrategy>,
  data: OHLCV[],
  paramCombinations: StrategyParams[],
  objective: OptimizationTarget
): { bestParams: StrategyParams; bestMetrics: BacktestMetrics; bestScore: number } {
  let bestResult: { params: StrategyParams; metrics: BacktestMetrics; score: number } | null = null
  
  for (const params of paramCombinations) {
    try {
      const result = runBacktest(strategy!, data, params)
      const score = calculateScore(result.metrics, objective)
      
      if (!bestResult || score > bestResult.score) {
        bestResult = {
          params,
          metrics: result.metrics,
          score,
        }
      }
    } catch (error) {
      // Skip invalid parameter combinations
      continue
    }
  }
  
  if (!bestResult) {
    throw new Error('No valid parameter combinations found')
  }
  
  return {
    bestParams: bestResult.params,
    bestMetrics: bestResult.metrics,
    bestScore: bestResult.score,
  }
}

/**
 * Run walk-forward optimization
 */
export function runWalkForward(config: WalkForwardConfig): WalkForwardResult {
  const startTime = Date.now()
  
  const strategy = getStrategy(config.strategyId)
  if (!strategy) {
    throw new Error(`Strategy not found: ${config.strategyId}`)
  }
  
  const { stockData, parameterRanges, objective, windowCount, trainRatio } = config
  const anchoredStart = config.anchoredStart ?? false
  
  // Validate inputs
  if (stockData.length < 100) {
    throw new Error('Insufficient data for walk-forward analysis (minimum 100 data points)')
  }
  
  if (windowCount < 2 || windowCount > 10) {
    throw new Error('Window count must be between 2 and 10')
  }
  
  if (trainRatio < 0.5 || trainRatio > 0.9) {
    throw new Error('Train ratio must be between 0.5 and 0.9')
  }
  
  // Generate parameter combinations (limit to prevent explosion)
  const allCombinations = generateCombinations(parameterRanges)
  const combinations = allCombinations.slice(0, 1000)
  
  // Calculate window sizes
  const totalLength = stockData.length
  const windowLength = Math.floor(totalLength / windowCount)
  const trainLength = Math.floor(windowLength * trainRatio)
  const testLength = windowLength - trainLength
  
  if (trainLength < 30 || testLength < 10) {
    throw new Error('Data too short for the specified window count')
  }
  
  const windows: WalkForwardWindow[] = []
  
  // Process each window
  for (let i = 0; i < windowCount; i++) {
    let trainStartIdx: number
    let trainEndIdx: number
    let testStartIdx: number
    let testEndIdx: number
    
    if (anchoredStart) {
      // Anchored: Train always starts from beginning
      trainStartIdx = 0
      trainEndIdx = Math.min((i + 1) * windowLength, totalLength - testLength)
      testStartIdx = trainEndIdx
      testEndIdx = Math.min(testStartIdx + testLength, totalLength)
    } else {
      // Rolling: Windows slide forward
      trainStartIdx = i * windowLength
      trainEndIdx = trainStartIdx + trainLength
      testStartIdx = trainEndIdx
      testEndIdx = Math.min(testStartIdx + testLength, totalLength)
    }
    
    // Ensure we have enough data
    if (trainEndIdx >= totalLength || testEndIdx > totalLength) {
      continue
    }
    
    const trainData = stockData.slice(trainStartIdx, trainEndIdx)
    const testData = stockData.slice(testStartIdx, testEndIdx)
    
    if (trainData.length < 30 || testData.length < 10) {
      continue
    }
    
    // Optimize on training data
    const { bestParams, bestMetrics: trainMetrics, bestScore: trainScore } = 
      optimizeParameters(strategy, trainData, combinations, objective)
    
    // Test on out-of-sample data
    const testResult = runBacktest(strategy, testData, bestParams)
    const testScore = calculateScore(testResult.metrics, objective)
    
    windows.push({
      windowIndex: i,
      trainStart: trainData[0].date,
      trainEnd: trainData[trainData.length - 1].date,
      testStart: testData[0].date,
      testEnd: testData[testData.length - 1].date,
      bestParams,
      trainMetrics,
      testMetrics: testResult.metrics,
      trainScore,
      testScore,
    })
  }
  
  if (windows.length === 0) {
    throw new Error('No valid windows generated')
  }
  
  // Calculate aggregated metrics
  const avgTrainWinRate = windows.reduce((s, w) => s + w.trainMetrics.winRate, 0) / windows.length
  const avgTrainReturn = windows.reduce((s, w) => s + w.trainMetrics.totalReturn, 0) / windows.length
  const avgTrainPF = windows.reduce((s, w) => s + Math.min(w.trainMetrics.profitFactor, 100), 0) / windows.length
  const avgTrainSharpe = windows.reduce((s, w) => s + w.trainMetrics.sharpeRatio, 0) / windows.length
  
  const avgTestWinRate = windows.reduce((s, w) => s + w.testMetrics.winRate, 0) / windows.length
  const avgTestReturn = windows.reduce((s, w) => s + w.testMetrics.totalReturn, 0) / windows.length
  const avgTestPF = windows.reduce((s, w) => s + Math.min(w.testMetrics.profitFactor, 100), 0) / windows.length
  const avgTestSharpe = windows.reduce((s, w) => s + w.testMetrics.sharpeRatio, 0) / windows.length
  
  // Calculate overfit ratio (train/test performance)
  const avgTrainScore = windows.reduce((s, w) => s + w.trainScore, 0) / windows.length
  const avgTestScore = windows.reduce((s, w) => s + w.testScore, 0) / windows.length
  const overfitRatio = avgTestScore !== 0 ? avgTrainScore / avgTestScore : 999
  
  // Calculate robustness score (0-100)
  // Based on: consistency, test performance, and overfit ratio
  const consistency = (windows.filter(w => w.testMetrics.totalReturn > 0).length / windows.length) * 100
  const testPerformance = Math.min(Math.max(avgTestReturn + 50, 0), 100) // Normalize to 0-100
  const overfitPenalty = overfitRatio > 2 ? 0 : (2 - overfitRatio) * 50 // 0-100
  const robustnessScore = Math.round((consistency + testPerformance + overfitPenalty) / 3)
  
  // Ticker is not available from OHLCV data, use empty string
  const ticker = ''
  
  return {
    strategyId: config.strategyId,
    ticker,
    objective,
    windowCount: windows.length,
    trainRatio,
    windows,
    aggregatedTrainMetrics: {
      avgWinRate: avgTrainWinRate,
      avgReturn: avgTrainReturn,
      avgPF: avgTrainPF,
      avgSharpe: avgTrainSharpe,
    },
    aggregatedTestMetrics: {
      avgWinRate: avgTestWinRate,
      avgReturn: avgTestReturn,
      avgPF: avgTestPF,
      avgSharpe: avgTestSharpe,
    },
    overfitRatio,
    robustnessScore,
    consistency,
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * Evaluate overfit risk level
 */
export function evaluateOverfitRisk(result: WalkForwardResult): 'low' | 'medium' | 'high' {
  const { overfitRatio, consistency, robustnessScore } = result
  
  if (overfitRatio <= 1.3 && consistency >= 70 && robustnessScore >= 60) {
    return 'low'
  } else if (overfitRatio <= 2.0 && consistency >= 50 && robustnessScore >= 40) {
    return 'medium'
  } else {
    return 'high'
  }
}

/**
 * Get recommendation based on walk-forward results
 */
export function getWalkForwardRecommendation(result: WalkForwardResult): string {
  const risk = evaluateOverfitRisk(result)
  const { overfitRatio, consistency, aggregatedTestMetrics } = result
  
  const recommendations: string[] = []
  
  if (risk === 'low') {
    recommendations.push('✅ 過学習リスクが低く、堅牢な戦略です')
  } else if (risk === 'medium') {
    recommendations.push('⚠️ 中程度の過学習リスクがあります')
  } else {
    recommendations.push('❌ 過学習リスクが高い可能性があります')
  }
  
  if (overfitRatio > 2) {
    recommendations.push('• 訓練期間と検証期間でパフォーマンス差が大きいです')
  }
  
  if (consistency < 50) {
    recommendations.push('• 検証期間での安定性が低いです')
  }
  
  if (aggregatedTestMetrics.avgReturn < 0) {
    recommendations.push('• 検証期間で平均的にマイナスリターンです')
  }
  
  if (aggregatedTestMetrics.avgPF < 1) {
    recommendations.push('• 検証期間のプロフィットファクターが1未満です')
  }
  
  return recommendations.join('\n')
}
