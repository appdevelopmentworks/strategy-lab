/**
 * Bollinger Breakout Strategy (BO001)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { bollingerBands } from '@/lib/indicators'

export const BollingerBreakout: Strategy = {
  id: 'BO001',
  name: 'Bollinger Breakout',
  nameJa: 'ボリンジャーバンド・ブレイクアウト',
  category: 'breakout',
  
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
      const prevUpper = upper[i - 1]
      const currUpper = upper[i]
      const currLower = lower[i]
      const currMiddle = middle[i]
      
      if (prevUpper === null || currUpper === null || currLower === null) {
        continue
      }
      
      // Price breaks above upper band - buy signal
      if (prevClose <= prevUpper && currClose > currUpper && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: {
            upperBand: currUpper,
            middleBand: currMiddle ?? 0,
            lowerBand: currLower,
          },
        })
        inPosition = true
      }
      // Price breaks below lower band - sell signal
      else if (currClose < currLower && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: {
            upperBand: currUpper,
            middleBand: currMiddle ?? 0,
            lowerBand: currLower,
          },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
