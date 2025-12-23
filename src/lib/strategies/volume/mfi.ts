/**
 * MFI Strategy (VO004)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { mfi } from '@/lib/indicators'

export const MFIStrategy: Strategy = {
  id: 'VO004',
  name: 'MFI',
  nameJa: 'MFI（マネーフロー）',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const overbought = params.overbought ?? 80
    const oversold = params.oversold ?? 20
    
    const mfiValues = mfi(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currMFI = mfiValues[i]
      const prevMFI = mfiValues[i - 1]
      
      if (currMFI === null || prevMFI === null) continue
      
      // MFI crosses above oversold - buy signal
      if (prevMFI <= oversold && currMFI > oversold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { mfi: currMFI },
        })
        inPosition = true
      }
      // MFI crosses below overbought - sell signal
      else if (prevMFI >= overbought && currMFI < overbought && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { mfi: currMFI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
