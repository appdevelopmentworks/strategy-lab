/**
 * Extended Mean Reversion Strategies
 * Envelope
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { envelope } from '@/lib/indicators'

/**
 * Envelope Strategy (MR005)
 */
export const EnvelopeStrategy: Strategy = {
  id: 'MR005',
  name: 'Envelope',
  nameJa: 'エンベロープ',
  category: 'mean-reversion',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 25
    const percentage = params.percentage ?? 2.5
    
    const closes = data.map(d => d.close)
    const { middle, upper, lower } = envelope(closes, period, percentage)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currMiddle = middle[i]
      const currUpper = upper[i]
      const currLower = lower[i]
      const currPrice = closes[i]
      const prevPrice = closes[i - 1]
      
      if (currMiddle === null || currUpper === null || currLower === null) continue
      
      const prevLower = lower[i - 1]
      const prevUpper = upper[i - 1]
      
      if (prevLower === null || prevUpper === null) continue
      
      // Price touches lower envelope - buy
      if (prevPrice >= prevLower && currPrice < currLower && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { middle: currMiddle, upper: currUpper, lower: currLower },
        })
        inPosition = true
      }
      // Price touches upper envelope - sell
      else if (prevPrice <= prevUpper && currPrice > currUpper && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { middle: currMiddle, upper: currUpper, lower: currLower },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
