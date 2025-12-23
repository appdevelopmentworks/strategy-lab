/**
 * OBV Strategy (VO001)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { obv, sma } from '@/lib/indicators'

export const OBVStrategy: Strategy = {
  id: 'VO001',
  name: 'OBV',
  nameJa: 'OBV（出来高）',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    
    const obvValues = obv(data)
    const obvSma = sma(obvValues, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currOBV = obvValues[i]
      const prevOBV = obvValues[i - 1]
      const currSMA = obvSma[i]
      const prevSMA = obvSma[i - 1]
      
      if (currSMA === null || prevSMA === null) continue
      
      // OBV crosses above its SMA
      if (prevOBV <= prevSMA && currOBV > currSMA && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { obv: currOBV, obvSma: currSMA },
        })
        inPosition = true
      }
      // OBV crosses below its SMA
      else if (prevOBV >= prevSMA && currOBV < currSMA && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { obv: currOBV, obvSma: currSMA },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
