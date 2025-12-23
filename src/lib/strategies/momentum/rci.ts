/**
 * RCI Strategy (MO008)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { rci } from '@/lib/indicators'

export const RCIStrategy: Strategy = {
  id: 'MO008',
  name: 'RCI',
  nameJa: 'RCI（順位相関指数）',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 9
    const overbought = params.overbought ?? 80
    const oversold = params.oversold ?? -80
    
    const closes = data.map(d => d.close)
    const rciValues = rci(closes, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currRCI = rciValues[i]
      const prevRCI = rciValues[i - 1]
      
      if (currRCI === null || prevRCI === null) continue
      
      // RCI crosses above oversold - buy signal
      if (prevRCI <= oversold && currRCI > oversold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { rci: currRCI },
        })
        inPosition = true
      }
      // RCI crosses below overbought - sell signal
      else if (prevRCI >= overbought && currRCI < overbought && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { rci: currRCI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
