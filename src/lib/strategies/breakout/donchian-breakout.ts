/**
 * Donchian Breakout Strategy (BO002)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { donchianChannel } from '@/lib/indicators'

export const DonchianBreakout: Strategy = {
  id: 'BO002',
  name: 'Donchian Breakout',
  nameJa: 'ドンチャンチャネル',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    
    const { upper, middle, lower } = donchianChannel(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevHigh = data[i - 1].high
      const currHigh = data[i].high
      const currLow = data[i].low
      const prevUpper = upper[i - 1]
      const currLower = lower[i]
      
      if (prevUpper === null || currLower === null) {
        continue
      }
      
      // Price makes new high (breaks above channel) - buy signal
      if (currHigh > prevUpper && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: {
            channelHigh: prevUpper,
            channelLow: currLower,
          },
        })
        inPosition = true
      }
      // Price makes new low (breaks below channel) - sell signal
      else if (currLow < currLower && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: {
            channelHigh: upper[i] ?? 0,
            channelLow: currLower,
          },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
