/**
 * Extended Trend Following Strategies
 * DMI, KAMA, Heiken Ashi, Triple MA, Aroon, Choppiness
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { dmi, kama, heikenAshi, aroon, choppinessIndex, sma } from '@/lib/indicators'

/**
 * DMI Strategy (TF008)
 */
export const DMIStrategy: Strategy = {
  id: 'TF008',
  name: 'DMI',
  nameJa: 'DMI（方向性指数）',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const adxThreshold = params.adxThreshold ?? 25
    
    const { plusDI, minusDI, adx } = dmi(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currPlusDI = plusDI[i]
      const currMinusDI = minusDI[i]
      const currADX = adx[i]
      const prevPlusDI = plusDI[i - 1]
      const prevMinusDI = minusDI[i - 1]
      
      if (currPlusDI === null || currMinusDI === null || currADX === null ||
          prevPlusDI === null || prevMinusDI === null) continue
      
      // +DI crosses above -DI with strong trend (ADX > threshold)
      if (prevPlusDI <= prevMinusDI && currPlusDI > currMinusDI && 
          currADX > adxThreshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { plusDI: currPlusDI, minusDI: currMinusDI, adx: currADX },
        })
        inPosition = true
      }
      // +DI crosses below -DI
      else if (prevPlusDI >= prevMinusDI && currPlusDI < currMinusDI && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { plusDI: currPlusDI, minusDI: currMinusDI, adx: currADX },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * KAMA Strategy (TF009)
 */
export const KAMAStrategy: Strategy = {
  id: 'TF009',
  name: 'KAMA',
  nameJa: 'KAMA（適応型MA）',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 10
    const fastSC = params.fastSC ?? 2
    const slowSC = params.slowSC ?? 30
    
    const closes = data.map(d => d.close)
    const kamaValues = kama(closes, period, fastSC, slowSC)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currKAMA = kamaValues[i]
      const prevKAMA = kamaValues[i - 1]
      const currPrice = closes[i]
      const prevPrice = closes[i - 1]
      
      if (currKAMA === null || prevKAMA === null) continue
      
      // Price crosses above KAMA
      if (prevPrice <= prevKAMA && currPrice > currKAMA && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { kama: currKAMA },
        })
        inPosition = true
      }
      // Price crosses below KAMA
      else if (prevPrice >= prevKAMA && currPrice < currKAMA && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { kama: currKAMA },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Heiken Ashi Strategy (TF010)
 */
export const HeikenAshiStrategy: Strategy = {
  id: 'TF010',
  name: 'Heiken Ashi',
  nameJa: '平均足',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const consecutiveCandles = params.consecutiveCandles ?? 2
    
    const ha = heikenAshi(data)
    
    let inPosition = false
    
    for (let i = consecutiveCandles; i < data.length; i++) {
      // Check for consecutive bullish candles
      let bullishCount = 0
      let bearishCount = 0
      
      for (let j = 0; j < consecutiveCandles; j++) {
        const idx = i - j
        if (ha.close[idx] > ha.open[idx]) {
          bullishCount++
        } else {
          bearishCount++
        }
      }
      
      // Consecutive bullish candles - buy
      if (bullishCount === consecutiveCandles && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { haClose: ha.close[i], haOpen: ha.open[i] },
        })
        inPosition = true
      }
      // Consecutive bearish candles - sell
      else if (bearishCount === consecutiveCandles && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { haClose: ha.close[i], haOpen: ha.open[i] },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Triple MA Strategy (TF011)
 */
export const TripleMAStrategy: Strategy = {
  id: 'TF011',
  name: 'Triple MA',
  nameJa: 'トリプルMA',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const shortPeriod = params.shortPeriod ?? 5
    const mediumPeriod = params.mediumPeriod ?? 20
    const longPeriod = params.longPeriod ?? 50
    
    const closes = data.map(d => d.close)
    const shortMA = sma(closes, shortPeriod)
    const mediumMA = sma(closes, mediumPeriod)
    const longMA = sma(closes, longPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currShort = shortMA[i]
      const currMedium = mediumMA[i]
      const currLong = longMA[i]
      const prevShort = shortMA[i - 1]
      const prevMedium = mediumMA[i - 1]
      const prevLong = longMA[i - 1]
      
      if (currShort === null || currMedium === null || currLong === null ||
          prevShort === null || prevMedium === null || prevLong === null) continue
      
      const currAligned = currShort > currMedium && currMedium > currLong
      const prevAligned = prevShort > prevMedium && prevMedium > prevLong
      
      // MAs become aligned (bullish)
      if (!prevAligned && currAligned && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { shortMA: currShort, mediumMA: currMedium, longMA: currLong },
        })
        inPosition = true
      }
      // Alignment breaks
      else if (prevAligned && !currAligned && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { shortMA: currShort, mediumMA: currMedium, longMA: currLong },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Aroon Strategy (TF012)
 */
export const AroonStrategy: Strategy = {
  id: 'TF012',
  name: 'Aroon',
  nameJa: 'アルーン',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 25
    const threshold = params.threshold ?? 50
    
    const { aroonUp, aroonDown, oscillator } = aroon(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currUp = aroonUp[i]
      const currDown = aroonDown[i]
      const prevUp = aroonUp[i - 1]
      const prevDown = aroonDown[i - 1]
      
      if (currUp === null || currDown === null ||
          prevUp === null || prevDown === null) continue
      
      // Aroon Up > threshold and crosses above Aroon Down
      if (prevUp <= prevDown && currUp > currDown && currUp > threshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { aroonUp: currUp, aroonDown: currDown },
        })
        inPosition = true
      }
      // Aroon Down crosses above Aroon Up
      else if (prevUp >= prevDown && currUp < currDown && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { aroonUp: currUp, aroonDown: currDown },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Choppiness Index Strategy (TF013)
 */
export const ChoppinessStrategy: Strategy = {
  id: 'TF013',
  name: 'Choppiness Index',
  nameJa: 'チョピネス指数',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 14
    const trendThreshold = params.trendThreshold ?? 38.2  // Below this = trending
    const maPeriod = params.maPeriod ?? 20
    
    const closes = data.map(d => d.close)
    const ciValues = choppinessIndex(data, period)
    const maValues = sma(closes, maPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currCI = ciValues[i]
      const currMA = maValues[i]
      const currPrice = closes[i]
      
      if (currCI === null || currMA === null) continue
      
      // Low choppiness (trending) and price above MA
      if (currCI < trendThreshold && currPrice > currMA && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { choppiness: currCI, ma: currMA },
        })
        inPosition = true
      }
      // High choppiness (choppy) or price below MA
      else if ((currCI > 61.8 || currPrice < currMA) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { choppiness: currCI, ma: currMA },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
