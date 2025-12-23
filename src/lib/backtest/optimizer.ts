/**
 * Parameter Optimizer
 * 
 * Grid search and walk-forward validation for strategy optimization.
 */

import type {
  OHLCV,
  StrategyParams,
  BacktestMetrics,
  OptimizationTarget,
  OptimizationResult,
  WalkForwardResult,
  ParameterDefinition,
} from '@/types'
import { runBacktest, type Strategy } from './engine'

/**
 * Parameter range for grid search
 */
export interface ParameterRange {
  name: string
  min: number
  max: number
  step: number
}

/**
 * Generate all parameter combinations for grid search
 */
export function generateParameterCombinations(
  ranges: ParameterRange[],
  baseParams: StrategyParams
): StrategyParams[] {
  const combinations: StrategyParams[] = []
  
  function recurse(
    index: number,
    current: StrategyParams
  ) {
    if (index === ranges.length) {
      combinations.push({ ...current })
      return
    }
    
    const range = ranges[index]
    for (let value = range.min; value <= range.max; value += range.step) {
      current[range.name] = value
      recurse(index + 1, current)
    }
  }
  
  recurse(0, { ...baseParams })
  return combinations
}

/**
 * Get the objective score from metrics
 */
export function getObjectiveScore(
  metrics: BacktestMetrics,
  objective: OptimizationTarget
): number {
  switch (objective) {
    case 'winRate':
      return metrics.winRate
    case 'totalReturn':
      return metrics.totalReturn
    case 'profitFactor':
      return metrics.profitFactor === Infinity ? 999 : metrics.profitFactor
    case 'sharpeRatio':
      return metrics.sharpeRatio
    default:
      return metrics.totalReturn
  }
}

/**
 * Run grid search optimization
 */
export function gridSearch(
  strategy: Strategy,
  data: OHLCV[],
  ranges: ParameterRange[],
  baseParams: StrategyParams,
  objective: OptimizationTarget,
  minTrades: number = 10
): OptimizationResult[] {
  const combinations = generateParameterCombinations(ranges, baseParams)
  const results: OptimizationResult[] = []
  
  for (const params of combinations) {
    const { metrics } = runBacktest(strategy, data, params)
    
    // Skip if minimum trades not met
    if (metrics.totalTrades < minTrades) {
      continue
    }
    
    const score = getObjectiveScore(metrics, objective)
    
    results.push({
      parameters: params,
      score,
      metrics,
    })
  }
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score)
  
  return results
}

/**
 * Split data into training and testing sets
 */
export function splitData(
  data: OHLCV[],
  trainRatio: number
): {
  trainData: OHLCV[]
  testData: OHLCV[]
} {
  const splitIndex = Math.floor(data.length * trainRatio)
  return {
    trainData: data.slice(0, splitIndex),
    testData: data.slice(splitIndex),
  }
}

/**
 * Evaluate overfit risk based on train vs test performance
 */
export function evaluateOverfitRisk(
  trainScore: number,
  testScore: number
): 'low' | 'medium' | 'high' {
  if (trainScore === 0) return 'high'
  
  const degradation = ((trainScore - testScore) / trainScore) * 100
  
  if (degradation < 20) return 'low'
  if (degradation < 40) return 'medium'
  return 'high'
}

/**
 * Run walk-forward validation
 */
export function walkForwardValidation(
  strategy: Strategy,
  data: OHLCV[],
  ranges: ParameterRange[],
  baseParams: StrategyParams,
  objective: OptimizationTarget,
  trainRatio: number = 0.7,
  minTrades: number = 10
): WalkForwardResult {
  // Split data
  const { trainData, testData } = splitData(data, trainRatio)
  
  // Optimize on training data
  const trainResults = gridSearch(
    strategy,
    trainData,
    ranges,
    baseParams,
    objective,
    minTrades
  )
  
  if (trainResults.length === 0) {
    throw new Error('No valid parameter combinations found in training data')
  }
  
  const bestTrainResult = trainResults[0]
  const bestParams = bestTrainResult.parameters
  
  // Validate on test data
  const { metrics: testMetrics } = runBacktest(strategy, testData, bestParams)
  const testScore = getObjectiveScore(testMetrics, objective)
  
  // Evaluate overfit risk
  const overfitRisk = evaluateOverfitRisk(bestTrainResult.score, testScore)
  
  return {
    bestParameters: bestParams,
    bestScore: bestTrainResult.score,
    objective,
    trainMetrics: bestTrainResult.metrics,
    testMetrics,
    overfitRisk,
    allResults: trainResults,
  }
}

/**
 * Create parameter ranges from strategy definitions
 */
export function createParameterRanges(
  definitions: ParameterDefinition[],
  customRanges?: Partial<Record<string, { min?: number; max?: number; step?: number }>>
): ParameterRange[] {
  return definitions.map(def => {
    const custom = customRanges?.[def.name] ?? {}
    return {
      name: def.name,
      min: custom.min ?? def.min,
      max: custom.max ?? def.max,
      step: custom.step ?? def.step,
    }
  })
}
