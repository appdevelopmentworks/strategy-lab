/**
 * Bollinger Reversion Strategy (MR001)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { bollingerBands } from '@/lib/indicators'

export const BollingerReversion: Strategy = {
  id: 'MR001',
  name: 'Bollinger Reversion',
  nameJa: 'ボリンジャーバンド逆張り',
  category: 'mean-reversion',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const stdDev = params.stdDev ?? 2
    
    const closes = data.map(d => d.close)
    const { upper, middle, lower } = bollingerBands(closes, period, stdDev)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close
      const currClose = data[i].close
      const prevLower = lower[i - 1]
      const currUpper = upper[i]
      const currLower = lower[i]
      const currMiddle = middle[i]
      
      if (prevLower === null || currUpper === null || currLower === null || currMiddle === null) {
        continue
      }
      
      // Price touches lower band - buy signal (expecting mean reversion)
      if (prevClose >= prevLower && currClose <= currLower && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: {
            upperBand: currUpper,
            middleBand: currMiddle,
            lowerBand: currLower,
          },
        })
        inPosition = true
      }
      // Price reaches upper band or middle band - sell signal
      else if (currClose >= currUpper && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: {
            upperBand: currUpper,
            middleBand: currMiddle,
            lowerBand: currLower,
          },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
