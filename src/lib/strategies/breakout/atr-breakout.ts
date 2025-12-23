/**
 * ATR Breakout Strategy (BO005)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { atr, sma } from '@/lib/indicators'

export const ATRBreakout: Strategy = {
  id: 'BO005',
  name: 'ATR Breakout',
  nameJa: 'ATRブレイクアウト',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const atrPeriod = params.atrPeriod ?? 14
    const multiplier = params.multiplier ?? 2
    const smaPeriod = params.smaPeriod ?? 20
    
    const atrValues = atr(data, atrPeriod)
    const closes = data.map(d => d.close)
    const smaValues = sma(closes, smaPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currATR = atrValues[i]
      const currSMA = smaValues[i]
      const prevClose = data[i - 1].close
      
      if (currATR === null || currSMA === null) continue
      
      const upperBand = currSMA + multiplier * currATR
      const lowerBand = currSMA - multiplier * currATR
      const currClose = data[i].close
      
      // Price breaks above upper band
      if (prevClose <= upperBand && currClose > upperBand && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { atr: currATR, upperBand, lowerBand },
        })
        inPosition = true
      }
      // Price breaks below lower band
      else if (prevClose >= lowerBand && currClose < lowerBand && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { atr: currATR, upperBand, lowerBand },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
