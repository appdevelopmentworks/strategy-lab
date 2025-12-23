/**
 * CCI Strategy (MO004)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { cci } from '@/lib/indicators'

export const CCIStrategy: Strategy = {
  id: 'MO004',
  name: 'CCI',
  nameJa: 'CCI',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const overbought = params.overbought ?? 100
    const oversold = params.oversold ?? -100
    
    const cciValues = cci(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currCCI = cciValues[i]
      const prevCCI = cciValues[i - 1]
      
      if (currCCI === null || prevCCI === null) continue
      
      // CCI crosses above oversold - buy signal
      if (prevCCI <= oversold && currCCI > oversold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { cci: currCCI },
        })
        inPosition = true
      }
      // CCI crosses below overbought - sell signal
      else if (prevCCI >= overbought && currCCI < overbought && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { cci: currCCI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
