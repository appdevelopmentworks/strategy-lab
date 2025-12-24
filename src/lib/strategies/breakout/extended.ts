/**
 * Extended Volatility and Breakout Strategies
 * Bollinger Squeeze, ATR Trailing Stop, Chandelier Exit, Gap, Volatility Breakout
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { bollingerBandWidth, bollingerBands, atr, chandelierExit, sma } from '@/lib/indicators'

/**
 * Bollinger Squeeze Strategy (BO006)
 */
export const BollingerSqueezeStrategy: Strategy = {
  id: 'BO006',
  name: 'Bollinger Squeeze',
  nameJa: 'ボリンジャースクイーズ',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const stdDev = params.stdDev ?? 2
    const squeezeLookback = params.squeezeLookback ?? 20
    
    const closes = data.map(d => d.close)
    const bandWidth = bollingerBandWidth(closes, period, stdDev)
    const bb = bollingerBands(closes, period, stdDev)
    
    let inPosition = false
    
    for (let i = squeezeLookback; i < data.length; i++) {
      const currBW = bandWidth[i]
      const currUpper = bb.upper[i]
      const currLower = bb.lower[i]
      
      if (currBW === null || currUpper === null || currLower === null) continue
      
      // Find minimum band width in lookback period (squeeze)
      let minBW = currBW
      for (let j = 1; j < squeezeLookback; j++) {
        if (bandWidth[i - j] !== null && bandWidth[i - j]! < minBW) {
          minBW = bandWidth[i - j]!
        }
      }
      
      const isSqueeze = currBW <= minBW * 1.1  // Within 10% of minimum
      const currPrice = closes[i]
      const prevPrice = closes[i - 1]
      
      // Squeeze breakout to upside
      if (isSqueeze && prevPrice <= currUpper && currPrice > currUpper && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { bandWidth: currBW, upper: currUpper },
        })
        inPosition = true
      }
      // Exit on lower band break
      else if (currPrice < currLower && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { bandWidth: currBW, lower: currLower },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * ATR Trailing Stop Strategy (BO007)
 */
export const ATRTrailingStopStrategy: Strategy = {
  id: 'BO007',
  name: 'ATR Trailing Stop',
  nameJa: 'ATRトレーリングストップ',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const atrPeriod = params.atrPeriod ?? 14
    const multiplier = params.multiplier ?? 3
    const maPeriod = params.maPeriod ?? 20
    
    const closes = data.map(d => d.close)
    const atrValues = atr(data, atrPeriod)
    const maValues = sma(closes, maPeriod)
    
    let inPosition = false
    let trailingStop = 0
    let highestPrice = 0
    
    for (let i = 1; i < data.length; i++) {
      const currATR = atrValues[i]
      const currMA = maValues[i]
      const currPrice = closes[i]
      const prevPrice = closes[i - 1]
      
      if (currATR === null || currMA === null) continue
      
      if (!inPosition) {
        // Entry: Price crosses above MA
        if (prevPrice <= maValues[i - 1]! && currPrice > currMA) {
          trailingStop = currPrice - multiplier * currATR
          highestPrice = currPrice
          
          signals.push({
            date: data[i].date,
            type: 'BUY',
            price: currPrice,
            indicatorValues: { atr: currATR, trailingStop },
          })
          inPosition = true
        }
      } else {
        // Update trailing stop
        if (currPrice > highestPrice) {
          highestPrice = currPrice
          trailingStop = Math.max(trailingStop, currPrice - multiplier * currATR)
        }
        
        // Exit: Price hits trailing stop
        if (currPrice < trailingStop) {
          signals.push({
            date: data[i].date,
            type: 'SELL',
            price: currPrice,
            indicatorValues: { atr: currATR, trailingStop },
          })
          inPosition = false
        }
      }
    }
    
    return signals
  },
}

/**
 * Chandelier Exit Strategy (BO008)
 */
export const ChandelierExitStrategy: Strategy = {
  id: 'BO008',
  name: 'Chandelier Exit',
  nameJa: 'シャンデリアエグジット',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 22
    const multiplier = params.multiplier ?? 3
    
    const { longExit } = chandelierExit(data, period, multiplier)
    const closes = data.map(d => d.close)
    
    let inPosition = false
    
    for (let i = period + 1; i < data.length; i++) {
      const currExit = longExit[i]
      const prevExit = longExit[i - 1]
      const currPrice = closes[i]
      const prevPrice = closes[i - 1]
      
      if (currExit === null || prevExit === null) continue
      
      // Entry: Price crosses above Chandelier Exit (new uptrend)
      if (prevPrice <= prevExit && currPrice > currExit && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { chandelierExit: currExit },
        })
        inPosition = true
      }
      // Exit: Price falls below Chandelier Exit
      else if (currPrice < currExit && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { chandelierExit: currExit },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Gap Strategy (BO009)
 */
export const GapStrategy: Strategy = {
  id: 'BO009',
  name: 'Gap',
  nameJa: 'ギャップ戦略',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const gapThreshold = params.gapThreshold ?? 2  // 2%
    const holdDays = params.holdDays ?? 3
    
    let inPosition = false
    let entryIdx = -1
    
    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close
      const currOpen = data[i].open
      const gapPct = ((currOpen - prevClose) / prevClose) * 100
      
      if (!inPosition) {
        // Gap up - expect gap fill (mean reversion)
        if (gapPct >= gapThreshold) {
          signals.push({
            date: data[i].date,
            type: 'BUY',  // Buying at gap up, expecting reversal or continuation
            price: data[i].close,
            indicatorValues: { gapPct },
          })
          inPosition = true
          entryIdx = i
        }
      } else {
        // Exit after hold days or if gap is filled
        if (i - entryIdx >= holdDays) {
          signals.push({
            date: data[i].date,
            type: 'SELL',
            price: data[i].close,
            indicatorValues: { holdDays: i - entryIdx },
          })
          inPosition = false
        }
      }
    }
    
    return signals
  },
}

/**
 * Volatility Breakout Strategy (BO010)
 */
export const VolatilityBreakoutStrategy: Strategy = {
  id: 'BO010',
  name: 'Volatility Breakout',
  nameJa: 'ボラティリティブレイクアウト',
  category: 'breakout',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const multiplier = params.multiplier ?? 2
    const holdDays = params.holdDays ?? 3
    
    let inPosition = false
    let entryIdx = -1
    
    for (let i = period; i < data.length; i++) {
      // Calculate average true range for volatility baseline
      let sumRange = 0
      for (let j = 1; j <= period; j++) {
        sumRange += data[i - j].high - data[i - j].low
      }
      const avgRange = sumRange / period
      
      const currRange = data[i].high - data[i].low
      const currChange = Math.abs(data[i].close - data[i - 1].close)
      
      if (!inPosition) {
        // Volatility breakout: current range or change exceeds multiplier * average
        if ((currRange > avgRange * multiplier || currChange > avgRange * multiplier) &&
            data[i].close > data[i - 1].close) {  // Upward breakout
          signals.push({
            date: data[i].date,
            type: 'BUY',
            price: data[i].close,
            indicatorValues: { 
              currRange, 
              avgRange, 
              volatilityRatio: currRange / avgRange 
            },
          })
          inPosition = true
          entryIdx = i
        }
      } else {
        // Exit after hold days
        if (i - entryIdx >= holdDays) {
          signals.push({
            date: data[i].date,
            type: 'SELL',
            price: data[i].close,
            indicatorValues: { holdDays: i - entryIdx },
          })
          inPosition = false
        }
      }
    }
    
    return signals
  },
}
