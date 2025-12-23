/**
 * Z-Score Mean Reversion Strategy (MR004)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { sma } from '@/lib/indicators'

export const ZScoreStrategy: Strategy = {
  id: 'MR004',
  name: 'Z-Score',
  nameJa: 'Zスコア',
  category: 'mean-reversion',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const buyThreshold = params.buyThreshold ?? -2
    const sellThreshold = params.sellThreshold ?? 2
    
    const closes = data.map(d => d.close)
    const smaValues = sma(closes, period)
    
    let inPosition = false
    
    for (let i = period - 1; i < data.length; i++) {
      const currSMA = smaValues[i]
      if (currSMA === null) continue
      
      // Calculate standard deviation
      let sumSquares = 0
      for (let j = 0; j < period; j++) {
        const diff = closes[i - j] - currSMA
        sumSquares += diff * diff
      }
      const stdDev = Math.sqrt(sumSquares / period)
      
      if (stdDev === 0) continue
      
      const zScore = (closes[i] - currSMA) / stdDev
      
      // Z-Score below threshold - buy signal
      if (zScore <= buyThreshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { zScore, sma: currSMA, stdDev },
        })
        inPosition = true
      }
      // Z-Score above threshold - sell signal
      else if (zScore >= sellThreshold && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { zScore, sma: currSMA, stdDev },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
