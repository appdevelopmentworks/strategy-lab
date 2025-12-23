/**
 * RSI Trend Strategy (MO001)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { rsi } from '@/lib/indicators'

export const RSItrend: Strategy = {
  id: 'MO001',
  name: 'RSI Trend',
  nameJa: 'RSI順張り',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const threshold = params.threshold ?? 50
    
    const closes = data.map(d => d.close)
    const rsiValues = rsi(closes, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevRsi = rsiValues[i - 1]
      const currRsi = rsiValues[i]
      
      if (prevRsi === null || currRsi === null) {
        continue
      }
      
      // RSI crosses above threshold - buy signal
      if (prevRsi <= threshold && currRsi > threshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { rsi: currRsi },
        })
        inPosition = true
      }
      // RSI crosses below threshold - sell signal
      else if (prevRsi >= threshold && currRsi < threshold && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { rsi: currRsi },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
