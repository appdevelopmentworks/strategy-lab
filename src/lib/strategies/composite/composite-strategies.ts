/**
 * Composite Strategies (CO002-CO008)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { ema, rsi, atr, sma, donchianChannel, pivotPoints, findSwingPoints, fibonacciLevels } from '@/lib/indicators'

/**
 * Trend + Momentum Strategy (CO002)
 */
export const TrendMomentum: Strategy = {
  id: 'CO002',
  name: 'Trend + Momentum',
  nameJa: 'トレンド+モメンタム',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const emaPeriod = params.emaPeriod ?? 20
    const rsiPeriod = params.rsiPeriod ?? 14
    const rsiThreshold = params.rsiThreshold ?? 50
    
    const closes = data.map(d => d.close)
    const emaValues = ema(closes, emaPeriod)
    const rsiValues = rsi(closes, rsiPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currEMA = emaValues[i]
      const currRSI = rsiValues[i]
      const currPrice = closes[i]
      
      if (currEMA === null || currRSI === null) continue
      
      // Trend up (price > EMA) + Momentum confirmed (RSI > threshold)
      if (currPrice > currEMA && currRSI > rsiThreshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { ema: currEMA, rsi: currRSI },
        })
        inPosition = true
      }
      // Trend down or momentum lost
      else if ((currPrice < currEMA || currRSI < rsiThreshold) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { ema: currEMA, rsi: currRSI },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Volatility Adjusted Strategy (CO003)
 */
export const VolatilityAdjusted: Strategy = {
  id: 'CO003',
  name: 'Volatility Adjusted',
  nameJa: 'ボラティリティ調整',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const atrPeriod = params.atrPeriod ?? 14
    const smaPeriod = params.smaPeriod ?? 20
    const atrMultiplier = params.atrMultiplier ?? 2
    
    const closes = data.map(d => d.close)
    const smaValues = sma(closes, smaPeriod)
    const atrValues = atr(data, atrPeriod)
    
    let inPosition = false
    let stopLoss = 0
    let takeProfit = 0
    
    for (let i = 1; i < data.length; i++) {
      const currSMA = smaValues[i]
      const currATR = atrValues[i]
      const currPrice = closes[i]
      
      if (currSMA === null || currATR === null) continue
      
      if (!inPosition) {
        // Entry when price crosses above SMA
        if (closes[i - 1] <= smaValues[i - 1]! && currPrice > currSMA) {
          stopLoss = currPrice - atrMultiplier * currATR
          takeProfit = currPrice + atrMultiplier * 2 * currATR
          
          signals.push({
            date: data[i].date,
            type: 'BUY',
            price: currPrice,
            indicatorValues: { sma: currSMA, atr: currATR, stopLoss, takeProfit },
          })
          inPosition = true
        }
      } else {
        // Exit on stop loss or take profit
        if (currPrice <= stopLoss || currPrice >= takeProfit) {
          signals.push({
            date: data[i].date,
            type: 'SELL',
            price: currPrice,
            indicatorValues: { 
              hitStop: currPrice <= stopLoss ? 1 : 0,
              hitTarget: currPrice >= takeProfit ? 1 : 0,
            },
          })
          inPosition = false
        }
      }
    }
    
    return signals
  },
}

/**
 * Moving Average Ribbon Strategy (CO004)
 */
export const MARibbon: Strategy = {
  id: 'CO004',
  name: 'MA Ribbon',
  nameJa: '移動平均リボン',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const periods = [5, 10, 20, 50, 100, 200]
    
    const closes = data.map(d => d.close)
    const mas = periods.map(p => sma(closes, p))
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currMAs = mas.map(ma => ma[i])
      const prevMAs = mas.map(ma => ma[i - 1])
      
      if (currMAs.some(v => v === null) || prevMAs.some(v => v === null)) continue
      
      // Check if MAs are aligned (bullish: all ascending)
      let bullishAligned = true
      let bearishAligned = true
      
      for (let j = 0; j < currMAs.length - 1; j++) {
        if (currMAs[j]! <= currMAs[j + 1]!) bullishAligned = false
        if (currMAs[j]! >= currMAs[j + 1]!) bearishAligned = false
      }
      
      // Entry when ribbon becomes aligned
      if (bullishAligned && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: closes[i],
          indicatorValues: { aligned: 1, ma5: currMAs[0] ?? 0, ma200: currMAs[5] ?? 0 },
        })
        inPosition = true
      }
      // Exit when alignment breaks
      else if (!bullishAligned && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: closes[i],
          indicatorValues: { aligned: 0 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * High Low Channel Strategy (CO005)
 */
export const HighLowChannel: Strategy = {
  id: 'CO005',
  name: 'High Low Channel',
  nameJa: '高値安値チャネル',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    
    const channel = donchianChannel(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currUpper = channel.upper[i]
      const currLower = channel.lower[i]
      const prevUpper = channel.upper[i - 1]
      
      if (currUpper === null || currLower === null || prevUpper === null) continue
      
      const currClose = data[i].close
      const prevClose = data[i - 1].close
      
      // Breakout above channel
      if (prevClose <= prevUpper && currClose > currUpper && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { upper: currUpper, lower: currLower },
        })
        inPosition = true
      }
      // Break below channel
      else if (currClose < currLower && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { upper: currUpper, lower: currLower },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Pivot Points Strategy (CO006)
 */
export const PivotPointsStrategy: Strategy = {
  id: 'CO006',
  name: 'Pivot Points',
  nameJa: 'ピボットポイント',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    
    const pivots = pivotPoints(data)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const pivot = pivots.pivot[i]
      const s1 = pivots.s1[i]
      const r1 = pivots.r1[i]
      
      if (pivot === null || s1 === null || r1 === null) continue
      
      const currClose = data[i].close
      const prevClose = data[i - 1].close
      
      // Bounce off S1 support
      if (prevClose <= s1 && currClose > s1 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { pivot, s1, r1 },
        })
        inPosition = true
      }
      // Hit R1 resistance or break S1
      else if ((currClose >= r1 || currClose < s1) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { pivot, s1, r1 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Fibonacci Retracement Strategy (CO007)
 */
export const FibonacciStrategy: Strategy = {
  id: 'CO007',
  name: 'Fibonacci Retracement',
  nameJa: 'フィボナッチ',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const lookback = params.lookback ?? 50
    
    let inPosition = false
    
    for (let i = lookback; i < data.length; i++) {
      // Find recent swing high and low
      const { swingHighs, swingLows } = findSwingPoints(data.slice(i - lookback, i + 1), 5)
      
      if (swingHighs.length === 0 || swingLows.length === 0) continue
      
      const recentHigh = Math.max(...swingHighs.map(s => s.price))
      const recentLow = Math.min(...swingLows.map(s => s.price))
      
      const fibs = fibonacciLevels(recentHigh, recentLow)
      const currClose = data[i].close
      
      // Buy at 61.8% retracement level
      if (currClose <= fibs.level618 * 1.01 && currClose >= fibs.level618 * 0.99 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { 
            fib618: fibs.level618,
            fib382: fibs.level382,
            high: recentHigh,
            low: recentLow,
          },
        })
        inPosition = true
      }
      // Take profit at 38.2% or stop at 100%
      else if ((currClose >= fibs.level382 || currClose <= fibs.level1000) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { exitType: currClose >= fibs.level382 ? 1 : 0 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * High Low Breakout Strategy (CO008)
 */
export const HighLowBreakout: Strategy = {
  id: 'CO008',
  name: 'High Low Breakout',
  nameJa: 'ハイローブレイクアウト',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 10
    
    let inPosition = false
    
    for (let i = period; i < data.length; i++) {
      let periodHigh = -Infinity
      let periodLow = Infinity
      
      for (let j = 1; j <= period; j++) {
        periodHigh = Math.max(periodHigh, data[i - j].high)
        periodLow = Math.min(periodLow, data[i - j].low)
      }
      
      const currClose = data[i].close
      
      // Break above period high
      if (currClose > periodHigh && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { periodHigh, periodLow },
        })
        inPosition = true
      }
      // Break below period low
      else if (currClose < periodLow && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { periodHigh, periodLow },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
