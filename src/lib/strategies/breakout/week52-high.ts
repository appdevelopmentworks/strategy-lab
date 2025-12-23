/**
 * 52-Week High Breakout Strategy (BO004)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'

export const Week52HighBreakout: Strategy = {
  id: 'BO004',
  name: '52-Week High Breakout',
  nameJa: '52週高値ブレイク',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 252 // ~52 weeks
    const exitPeriod = params.exitPeriod ?? 20
    
    let inPosition = false
    
    for (let i = period; i < data.length; i++) {
      // Calculate period high and low
      let periodHigh = -Infinity
      let exitLow = Infinity
      
      for (let j = 1; j <= period; j++) {
        periodHigh = Math.max(periodHigh, data[i - j].high)
      }
      
      for (let j = 1; j <= exitPeriod; j++) {
        exitLow = Math.min(exitLow, data[i - j].low)
      }
      
      const currClose = data[i].close
      
      // Price breaks above 52-week high
      if (currClose > periodHigh && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { high52w: periodHigh },
        })
        inPosition = true
      }
      // Exit on break of exit period low
      else if (currClose < exitLow && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { exitLow },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
