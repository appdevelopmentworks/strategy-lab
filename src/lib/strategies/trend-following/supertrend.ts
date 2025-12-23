/**
 * SuperTrend Strategy (TF006)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { superTrend } from '@/lib/indicators'

export const SuperTrendStrategy: Strategy = {
  id: 'TF006',
  name: 'SuperTrend',
  nameJa: 'スーパートレンド',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 10
    const multiplier = params.multiplier ?? 3
    
    const { superTrend: stValues, direction } = superTrend(data, period, multiplier)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currDirection = direction[i]
      const prevDirection = direction[i - 1]
      const currST = stValues[i]
      
      if (currDirection === null || prevDirection === null || currST === null) continue
      
      // Direction changes from bearish to bullish
      if (prevDirection === -1 && currDirection === 1 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { superTrend: currST, direction: currDirection },
        })
        inPosition = true
      }
      // Direction changes from bullish to bearish
      else if (prevDirection === 1 && currDirection === -1 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { superTrend: currST, direction: currDirection },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
