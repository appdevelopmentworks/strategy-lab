/**
 * Momentum Strategy (MO007)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { momentum } from '@/lib/indicators'

export const MomentumStrategy: Strategy = {
  id: 'MO007',
  name: 'Momentum',
  nameJa: 'モメンタム',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 10
    
    const closes = data.map(d => d.close)
    const momValues = momentum(closes, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currMom = momValues[i]
      const prevMom = momValues[i - 1]
      
      if (currMom === null || prevMom === null) continue
      
      // Momentum crosses above zero - buy signal
      if (prevMom <= 0 && currMom > 0 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { momentum: currMom },
        })
        inPosition = true
      }
      // Momentum crosses below zero - sell signal
      else if (prevMom >= 0 && currMom < 0 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { momentum: currMom },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
