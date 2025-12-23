/**
 * Stochastic Strategy (MO003)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { stochastic } from '@/lib/indicators'

export const StochasticStrategy: Strategy = {
  id: 'MO003',
  name: 'Stochastic',
  nameJa: 'ストキャスティクス',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const kPeriod = params.kPeriod ?? 14
    const dPeriod = params.dPeriod ?? 3
    const smoothK = params.smoothK ?? 3
    const oversold = params.oversold ?? 20
    const overbought = params.overbought ?? 80
    
    const { k, d } = stochastic(data, kPeriod, dPeriod, smoothK)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevK = k[i - 1]
      const prevD = d[i - 1]
      const currK = k[i]
      const currD = d[i]
      
      if (prevK === null || prevD === null || currK === null || currD === null) {
        continue
      }
      
      // %K crosses above %D in oversold zone - buy signal
      if (prevK <= prevD && currK > currD && currK < oversold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { stochK: currK, stochD: currD },
        })
        inPosition = true
      }
      // %K crosses below %D in overbought zone - sell signal
      else if (prevK >= prevD && currK < currD && currK > overbought && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { stochK: currK, stochD: currD },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
