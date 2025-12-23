/**
 * ADX Trend Strategy (TF004)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { adx } from '@/lib/indicators'

export const ADXtrend: Strategy = {
  id: 'TF004',
  name: 'ADX Trend',
  nameJa: 'ADXトレンド',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const threshold = params.threshold ?? 25
    
    const { adx: adxValues, plusDI, minusDI } = adx(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currAdx = adxValues[i]
      const currPlusDI = plusDI[i]
      const currMinusDI = minusDI[i]
      const prevPlusDI = plusDI[i - 1]
      const prevMinusDI = minusDI[i - 1]
      
      if (currAdx === null || currPlusDI === null || currMinusDI === null ||
          prevPlusDI === null || prevMinusDI === null) {
        continue
      }
      
      // Strong trend with +DI crossing above -DI
      if (currAdx > threshold && prevPlusDI <= prevMinusDI && currPlusDI > currMinusDI && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { adx: currAdx, plusDI: currPlusDI, minusDI: currMinusDI },
        })
        inPosition = true
      }
      // -DI crosses above +DI
      else if (prevPlusDI >= prevMinusDI && currPlusDI < currMinusDI && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { adx: currAdx, plusDI: currPlusDI, minusDI: currMinusDI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
