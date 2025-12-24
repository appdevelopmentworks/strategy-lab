/**
 * RSI Divergence Strategy (MR002)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { rsi } from '@/lib/indicators'

export const RSIDivergence: Strategy = {
  id: 'MR002',
  name: 'RSI Divergence',
  nameJa: 'RSIダイバージェンス',
  category: 'mean-reversion',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const lookback = params.lookback ?? 10
    
    const closes = data.map(d => d.close)
    const rsiValues = rsi(closes, period)
    
    let inPosition = false
    
    for (let i = lookback + period; i < data.length; i++) {
      const currRSI = rsiValues[i]
      const currPrice = closes[i]
      
      if (currRSI === null) continue
      
      // Find local lows in lookback period
      let lowestPriceIdx = i
      let lowestRSIIdx = i
      
      for (let j = 1; j <= lookback; j++) {
        if (closes[i - j] < closes[lowestPriceIdx]) lowestPriceIdx = i - j
        if (rsiValues[i - j] !== null && rsiValues[i - j]! < (rsiValues[lowestRSIIdx] ?? 100)) {
          lowestRSIIdx = i - j
        }
      }
      
      // Bullish divergence: Price makes lower low, RSI makes higher low
      const priceLowerLow = currPrice < closes[lowestPriceIdx] * 1.02
      const rsiHigherLow = currRSI > (rsiValues[lowestRSIIdx] ?? 0)
      
      if (priceLowerLow && rsiHigherLow && currRSI < 40 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { rsi: currRSI, isBullishDivergence: 1 },
        })
        inPosition = true
      }
      // Exit when RSI goes above 60
      else if (currRSI > 60 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { rsi: currRSI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
