/**
 * Grid Search Optimization
 * 
 * Exhaustive parameter search for strategy optimization
 */

import type { OHLCV, StrategyParams, BacktestMetrics } from '@/types'
import { runBacktest } from '@/lib/backtest'
import { getStrategy, getStrategyInfo } from '@/lib/strategies/registry'

export interface GridSearchConfig {
  strategyId: string
  stockData: OHLCV[]
  parameterRanges: ParameterRange[]
  objective: 'winRate' | 'totalReturn' | 'profitFactor' | 'sharpeRatio'
  maxCombinations?: number
}

export interface ParameterRange {
  name: string
  min: number
  max: number
  step: number
}

export interface GridSearchResult {
  bestParams: StrategyParams
  bestMetrics: BacktestMetrics
  bestScore: number
  allResults: {
    params: StrategyParams
    metrics: BacktestMetrics
    score: number
  }[]
  totalCombinations: number
  executedCombinations: number
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
        [first.name]: Math.round(value * 1000) / 1000, // Avoid floating point issues
        ...restCombo,
      })
    }
  }
  
  return combinations
}

/**
 * Calculate objective score from metrics
 */
function calculateScore(metrics: BacktestMetrics, objective: GridSearchConfig['objective']): number {
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
 * Run grid search optimization
 */
export function runGridSearch(config: GridSearchConfig): GridSearchResult {
  const startTime = Date.now()
  
  const strategy = getStrategy(config.strategyId)
  if (!strategy) {
    throw new Error(`Strategy not found: ${config.strategyId}`)
  }
  
  // Generate all parameter combinations
  const allCombinations = generateCombinations(config.parameterRanges)
  const maxCombinations = config.maxCombinations ?? 10000
  
  // Limit combinations if too many
  const combinations = allCombinations.slice(0, maxCombinations)
  
  const results: GridSearchResult['allResults'] = []
  let bestResult: { params: StrategyParams; metrics: BacktestMetrics; score: number } | null = null
  
  for (const params of combinations) {
    try {
      const backtestResult = runBacktest(strategy, config.stockData, params)
      const score = calculateScore(backtestResult.metrics, config.objective)
      
      const result = {
        params,
        metrics: backtestResult.metrics,
        score,
      }
      
      results.push(result)
      
      if (!bestResult || score > bestResult.score) {
        bestResult = result
      }
    } catch (error) {
      // Skip invalid parameter combinations
      console.warn('Backtest failed for params:', params, error)
    }
  }
  
  if (!bestResult) {
    throw new Error('No valid parameter combinations found')
  }
  
  // Sort results by score (descending)
  results.sort((a, b) => b.score - a.score)
  
  return {
    bestParams: bestResult.params,
    bestMetrics: bestResult.metrics,
    bestScore: bestResult.score,
    allResults: results.slice(0, 100), // Keep top 100
    totalCombinations: allCombinations.length,
    executedCombinations: combinations.length,
    executionTimeMs: Date.now() - startTime,
  }
}

/**
 * Get default parameter ranges for a strategy
 */
export function getDefaultParameterRanges(strategyId: string): ParameterRange[] {
  const info = getStrategyInfo(strategyId)
  if (!info) return []
  
  return info.parameters.map(param => {
    // Calculate appropriate step size
    const range = param.max - param.min
    let step = param.step
    
    // Limit number of steps to prevent too many combinations
    const maxSteps = 10
    if (range / step > maxSteps) {
      step = range / maxSteps
    }
    
    return {
      name: param.name,
      min: param.min,
      max: param.max,
      step: Math.max(step, param.step),
    }
  })
}

/**
 * Estimate number of combinations
 */
export function estimateCombinations(ranges: ParameterRange[]): number {
  return ranges.reduce((total, range) => {
    const steps = Math.floor((range.max - range.min) / range.step) + 1
    return total * steps
  }, 1)
}
