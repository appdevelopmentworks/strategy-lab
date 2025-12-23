/**
 * Golden Cross Strategy (PA001)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { sma } from '@/lib/indicators'

export const GoldenCross: Strategy = {
  id: 'PA001',
  name: 'Golden Cross',
  nameJa: 'ゴールデンクロス',
  category: 'pattern',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const shortPeriod = params.shortPeriod ?? 50
    const longPeriod = params.longPeriod ?? 200
    
    const closes = data.map(d => d.close)
    const shortSma = sma(closes, shortPeriod)
    const longSma = sma(closes, longPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevShort = shortSma[i - 1]
      const prevLong = longSma[i - 1]
      const currShort = shortSma[i]
      const currLong = longSma[i]
      
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
            sma50: currShort,
            sma200: currLong,
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
            sma50: currShort,
            sma200: currLong,
          },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
