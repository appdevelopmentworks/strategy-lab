/**
 * EMA Crossover Strategy (TF002)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { ema } from '@/lib/indicators'

export const EMAcrossover: Strategy = {
  id: 'TF002',
  name: 'EMA Crossover',
  nameJa: 'EMAクロスオーバー',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const shortPeriod = params.shortPeriod ?? 12
    const longPeriod = params.longPeriod ?? 26
    
    const closes = data.map(d => d.close)
    const shortEma = ema(closes, shortPeriod)
    const longEma = ema(closes, longPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevShort = shortEma[i - 1]
      const prevLong = longEma[i - 1]
      const currShort = shortEma[i]
      const currLong = longEma[i]
      
      if (prevShort === null || prevLong === null || currShort === null || currLong === null) {
        continue
      }
      
      // Golden cross - buy signal
      if (prevShort <= prevLong && currShort > currLong && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: {
            shortEMA: currShort,
            longEMA: currLong,
          },
        })
        inPosition = true
      }
      // Death cross - sell signal
      else if (prevShort >= prevLong && currShort < currLong && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: {
            shortEMA: currShort,
            longEMA: currLong,
          },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
