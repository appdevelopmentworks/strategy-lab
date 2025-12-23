/**
 * MACD + RSI Filter Strategy (CO001)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { macd, rsi } from '@/lib/indicators'

export const MACDRSIStrategy: Strategy = {
  id: 'CO001',
  name: 'MACD + RSI Filter',
  nameJa: 'MACD+RSIフィルター',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const fastPeriod = params.fastPeriod ?? 12
    const slowPeriod = params.slowPeriod ?? 26
    const signalPeriod = params.signalPeriod ?? 9
    const rsiPeriod = params.rsiPeriod ?? 14
    const rsiLower = params.rsiLower ?? 30
    const rsiUpper = params.rsiUpper ?? 70
    
    const closes = data.map(d => d.close)
    const { macd: macdLine, signal: signalLine } = macd(closes, fastPeriod, slowPeriod, signalPeriod)
    const rsiValues = rsi(closes, rsiPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currMACD = macdLine[i]
      const prevMACD = macdLine[i - 1]
      const currSignal = signalLine[i]
      const prevSignal = signalLine[i - 1]
      const currRSI = rsiValues[i]
      
      if (currMACD === null || prevMACD === null || 
          currSignal === null || prevSignal === null || 
          currRSI === null) continue
      
      // MACD crosses above signal AND RSI is not overbought
      if (prevMACD <= prevSignal && currMACD > currSignal && 
          currRSI < rsiUpper && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { macd: currMACD, signal: currSignal, rsi: currRSI },
        })
        inPosition = true
      }
      // MACD crosses below signal OR RSI is oversold (exit)
      else if ((prevMACD >= prevSignal && currMACD < currSignal) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { macd: currMACD, signal: currSignal, rsi: currRSI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
