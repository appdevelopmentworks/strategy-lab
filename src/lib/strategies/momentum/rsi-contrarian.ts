/**
 * RSI Contrarian Strategy (MO002)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { rsi } from '@/lib/indicators'

export const RSIcontrarian: Strategy = {
  id: 'MO002',
  name: 'RSI Contrarian',
  nameJa: 'RSI逆張り',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const oversold = params.oversold ?? 30
    const overbought = params.overbought ?? 70
    
    const closes = data.map(d => d.close)
    const rsiValues = rsi(closes, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevRsi = rsiValues[i - 1]
      const currRsi = rsiValues[i]
      
      if (prevRsi === null || currRsi === null) {
        continue
      }
      
      // RSI crosses below oversold - buy signal (contrarian)
      if (prevRsi >= oversold && currRsi < oversold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { rsi: currRsi },
        })
        inPosition = true
      }
      // RSI crosses above overbought - sell signal
      else if (prevRsi <= overbought && currRsi > overbought && inPosition) {
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
