/**
 * MACD Signal Strategy (TF003)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { macd } from '@/lib/indicators'

export const MACDsignal: Strategy = {
  id: 'TF003',
  name: 'MACD Signal',
  nameJa: 'MACDシグナル',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const fastPeriod = params.fastPeriod ?? 12
    const slowPeriod = params.slowPeriod ?? 26
    const signalPeriod = params.signalPeriod ?? 9
    
    const closes = data.map(d => d.close)
    const { macd: macdLine, signal: signalLine, histogram } = macd(closes, fastPeriod, slowPeriod, signalPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const prevMacd = macdLine[i - 1]
      const prevSignal = signalLine[i - 1]
      const currMacd = macdLine[i]
      const currSignal = signalLine[i]
      const currHist = histogram[i]
      
      if (prevMacd === null || prevSignal === null || currMacd === null || currSignal === null) {
        continue
      }
      
      // MACD crosses above signal - buy
      if (prevMacd <= prevSignal && currMacd > currSignal && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: {
            macd: currMacd,
            signal: currSignal,
            histogram: currHist ?? 0,
          },
        })
        inPosition = true
      }
      // MACD crosses below signal - sell
      else if (prevMacd >= prevSignal && currMacd < currSignal && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: {
            macd: currMacd,
            signal: currSignal,
            histogram: currHist ?? 0,
          },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
