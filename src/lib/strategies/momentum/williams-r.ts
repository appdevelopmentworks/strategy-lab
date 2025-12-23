/**
 * Williams %R Strategy (MO005)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { williamsR } from '@/lib/indicators'

export const WilliamsRStrategy: Strategy = {
  id: 'MO005',
  name: 'Williams %R',
  nameJa: 'ウィリアムズ%R',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const overbought = params.overbought ?? -20
    const oversold = params.oversold ?? -80
    
    const wrValues = williamsR(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currWR = wrValues[i]
      const prevWR = wrValues[i - 1]
      
      if (currWR === null || prevWR === null) continue
      
      // Williams %R crosses above oversold - buy signal
      if (prevWR <= oversold && currWR > oversold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { williamsR: currWR },
        })
        inPosition = true
      }
      // Williams %R crosses below overbought - sell signal
      else if (prevWR >= overbought && currWR < overbought && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { williamsR: currWR },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
