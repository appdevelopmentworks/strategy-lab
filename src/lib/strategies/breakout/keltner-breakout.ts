/**
 * Keltner Channel Breakout Strategy (BO003)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { keltnerChannel } from '@/lib/indicators'

export const KeltnerBreakout: Strategy = {
  id: 'BO003',
  name: 'Keltner Channel Breakout',
  nameJa: 'ケルトナーチャネル',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const emaPeriod = params.emaPeriod ?? 20
    const atrPeriod = params.atrPeriod ?? 10
    const multiplier = params.multiplier ?? 2
    
    const { upper, middle, lower } = keltnerChannel(data, emaPeriod, atrPeriod, multiplier)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currUpper = upper[i]
      const currLower = lower[i]
      const prevUpper = upper[i - 1]
      const prevLower = lower[i - 1]
      
      if (currUpper === null || currLower === null || 
          prevUpper === null || prevLower === null) continue
      
      const currClose = data[i].close
      const prevClose = data[i - 1].close
      
      // Price breaks above upper channel
      if (prevClose <= prevUpper && currClose > currUpper && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { upper: currUpper, lower: currLower },
        })
        inPosition = true
      }
      // Price breaks below lower channel
      else if (prevClose >= prevLower && currClose < currLower && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { upper: currUpper, lower: currLower },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
