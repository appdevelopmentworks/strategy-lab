/**
 * Extended Momentum Strategies
 * TRIX, DEMA, Force Index
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { trix, dema, forceIndex, sma } from '@/lib/indicators'

/**
 * TRIX Strategy (MO009)
 */
export const TRIXStrategy: Strategy = {
  id: 'MO009',
  name: 'TRIX',
  nameJa: 'TRIX',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    
    const closes = data.map(d => d.close)
    const trixValues = trix(closes, period)
    const signalLine = sma(trixValues.map(v => v ?? 0), 9)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currTrix = trixValues[i]
      const prevTrix = trixValues[i - 1]
      const currSignal = signalLine[i]
      const prevSignal = signalLine[i - 1]
      
      if (currTrix === null || prevTrix === null || 
          currSignal === null || prevSignal === null) continue
      
      // TRIX crosses above signal line
      if (prevTrix <= prevSignal && currTrix > currSignal && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { trix: currTrix, signal: currSignal },
        })
        inPosition = true
      }
      // TRIX crosses below signal line
      else if (prevTrix >= prevSignal && currTrix < currSignal && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { trix: currTrix, signal: currSignal },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * DEMA Cross Strategy (MO010)
 */
export const DEMAStrategy: Strategy = {
  id: 'MO010',
  name: 'DEMA Cross',
  nameJa: 'DEMAクロス',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const shortPeriod = params.shortPeriod ?? 12
    const longPeriod = params.longPeriod ?? 26
    
    const closes = data.map(d => d.close)
    const shortDema = dema(closes, shortPeriod)
    const longDema = dema(closes, longPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currShort = shortDema[i]
      const currLong = longDema[i]
      const prevShort = shortDema[i - 1]
      const prevLong = longDema[i - 1]
      
      if (currShort === null || currLong === null ||
          prevShort === null || prevLong === null) continue
      
      // Short DEMA crosses above Long DEMA
      if (prevShort <= prevLong && currShort > currLong && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { shortDema: currShort, longDema: currLong },
        })
        inPosition = true
      }
      // Short DEMA crosses below Long DEMA
      else if (prevShort >= prevLong && currShort < currLong && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { shortDema: currShort, longDema: currLong },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Force Index Strategy (MO011)
 */
export const ForceIndexStrategy: Strategy = {
  id: 'MO011',
  name: 'Force Index',
  nameJa: 'フォースインデックス',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 13
    
    const fiValues = forceIndex(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currFI = fiValues[i]
      const prevFI = fiValues[i - 1]
      
      if (currFI === null || prevFI === null) continue
      
      // Force Index crosses above zero
      if (prevFI <= 0 && currFI > 0 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { forceIndex: currFI },
        })
        inPosition = true
      }
      // Force Index crosses below zero
      else if (prevFI >= 0 && currFI < 0 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { forceIndex: currFI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
