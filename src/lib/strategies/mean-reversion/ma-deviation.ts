/**
 * Moving Average Deviation Strategy (MR003)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { sma } from '@/lib/indicators'

export const MADeviation: Strategy = {
  id: 'MR003',
  name: 'MA Deviation',
  nameJa: '移動平均乖離率',
  category: 'mean-reversion',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const buyThreshold = params.buyThreshold ?? -5  // -5%
    const sellThreshold = params.sellThreshold ?? 5  // +5%
    
    const closes = data.map(d => d.close)
    const smaValues = sma(closes, period)
    
    let inPosition = false
    
    for (let i = 0; i < data.length; i++) {
      const currSMA = smaValues[i]
      if (currSMA === null) continue
      
      const deviation = ((closes[i] - currSMA) / currSMA) * 100
      
      // Price is significantly below MA - buy signal
      if (deviation <= buyThreshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { deviation, sma: currSMA },
        })
        inPosition = true
      }
      // Price is significantly above MA - sell signal
      else if (deviation >= sellThreshold && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { deviation, sma: currSMA },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
