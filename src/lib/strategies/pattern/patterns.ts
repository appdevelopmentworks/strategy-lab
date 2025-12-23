/**
 * Dead Cross Strategy (PA002)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { sma } from '@/lib/indicators'

export const DeadCross: Strategy = {
  id: 'PA002',
  name: 'Dead Cross',
  nameJa: 'デッドクロス',
  category: 'pattern',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const shortPeriod = params.shortPeriod ?? 50
    const longPeriod = params.longPeriod ?? 200
    
    const closes = data.map(d => d.close)
    const shortMA = sma(closes, shortPeriod)
    const longMA = sma(closes, longPeriod)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currShort = shortMA[i]
      const currLong = longMA[i]
      const prevShort = shortMA[i - 1]
      const prevLong = longMA[i - 1]
      
      if (currShort === null || currLong === null ||
          prevShort === null || prevLong === null) continue
      
      // Dead Cross: Short MA crosses below Long MA - Short signal (but we go long after)
      // For long-only: we wait for recovery
      if (prevShort >= prevLong && currShort < currLong && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { shortMA: currShort, longMA: currLong },
        })
        inPosition = false
      }
      // Recovery: Short MA crosses back above Long MA
      else if (prevShort <= prevLong && currShort > currLong && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { shortMA: currShort, longMA: currLong },
        })
        inPosition = true
      }
    }
    
    return signals
  },
}

/**
 * Sanku (Three Line Strike) - Ichimoku (PA003)
 */
export const IchimokuSanku: Strategy = {
  id: 'PA003',
  name: 'Ichimoku Sanku',
  nameJa: '三役好転',
  category: 'pattern',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const tenkanPeriod = params.tenkanPeriod ?? 9
    const kijunPeriod = params.kijunPeriod ?? 26
    const senkouPeriod = params.senkouPeriod ?? 52
    
    // Import ichimoku dynamically to avoid circular dependency
    const { ichimoku } = require('@/lib/indicators')
    const { tenkan, kijun, senkouA, senkouB, chikou } = ichimoku(data, tenkanPeriod, kijunPeriod, senkouPeriod)
    
    let inPosition = false
    
    for (let i = kijunPeriod + 1; i < data.length; i++) {
      const currTenkan = tenkan[i]
      const currKijun = kijun[i]
      const currPrice = data[i].close
      const currSenkouA = senkouA[i - kijunPeriod]
      const currSenkouB = senkouB[i - kijunPeriod]
      const currChikou = chikou[i]
      const chikouPrice = i >= kijunPeriod ? data[i - kijunPeriod].close : null
      
      if (currTenkan === null || currKijun === null ||
          currSenkouA === null || currSenkouB === null) continue
      
      const cloudTop = Math.max(currSenkouA, currSenkouB)
      
      // Three conditions for Sanku (三役好転):
      // 1. Tenkan > Kijun
      // 2. Price > Cloud
      // 3. Chikou > Price of kijunPeriod ago
      const condition1 = currTenkan > currKijun
      const condition2 = currPrice > cloudTop
      const condition3 = chikouPrice !== null && currChikou > chikouPrice
      
      if (condition1 && condition2 && condition3 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { tenkan: currTenkan, kijun: currKijun, cloudTop },
        })
        inPosition = true
      }
      // Exit when any condition fails
      else if ((!condition1 || !condition2) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { tenkan: currTenkan, kijun: currKijun, cloudTop },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Double Bottom Detection (PA004)
 */
export const DoubleBottom: Strategy = {
  id: 'PA004',
  name: 'Double Bottom',
  nameJa: 'ダブルボトム',
  category: 'pattern',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const lookback = params.lookback ?? 60
    const tolerance = params.tolerance ?? 0.02  // 2% tolerance
    
    let inPosition = false
    
    for (let i = lookback; i < data.length; i++) {
      if (inPosition) {
        // Simple exit: 10% gain or 5% loss
        const entryIdx = signals[signals.length - 1] ? 
          data.findIndex(d => d.date === signals[signals.length - 1].date) : -1
        if (entryIdx > 0) {
          const entryPrice = signals[signals.length - 1].price
          const change = (data[i].close - entryPrice) / entryPrice
          if (change > 0.1 || change < -0.05) {
            signals.push({
              date: data[i].date,
              type: 'SELL',
              price: data[i].close,
              indicatorValues: { profitPct: change * 100 },
            })
            inPosition = false
          }
        }
        continue
      }
      
      // Find two lows in lookback period
      const lows: { idx: number; price: number }[] = []
      for (let j = 5; j < lookback - 5; j++) {
        const idx = i - lookback + j
        let isLow = true
        for (let k = 1; k <= 5; k++) {
          if (data[idx].low >= data[idx - k].low || data[idx].low >= data[idx + k].low) {
            isLow = false
            break
          }
        }
        if (isLow) {
          lows.push({ idx, price: data[idx].low })
        }
      }
      
      // Check for double bottom pattern
      if (lows.length >= 2) {
        const first = lows[0]
        const second = lows[lows.length - 1]
        const priceDiff = Math.abs(first.price - second.price) / first.price
        
        // Bottoms are within tolerance and current price breaks above neckline
        if (priceDiff <= tolerance) {
          const neckline = Math.max(
            ...data.slice(first.idx, second.idx + 1).map(d => d.high)
          )
          
          if (data[i].close > neckline && data[i - 1].close <= neckline) {
            signals.push({
              date: data[i].date,
              type: 'BUY',
              price: data[i].close,
              indicatorValues: { 
                bottom1: first.price, 
                bottom2: second.price, 
                neckline 
              },
            })
            inPosition = true
          }
        }
      }
    }
    
    return signals
  },
}

/**
 * Head and Shoulders Detection (PA005)
 */
export const HeadAndShoulders: Strategy = {
  id: 'PA005',
  name: 'Head and Shoulders',
  nameJa: 'ヘッドアンドショルダー',
  category: 'pattern',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const lookback = params.lookback ?? 60
    const tolerance = params.tolerance ?? 0.02
    
    let inPosition = false
    
    for (let i = lookback; i < data.length; i++) {
      // Find three highs (left shoulder, head, right shoulder)
      const highs: { idx: number; price: number }[] = []
      for (let j = 5; j < lookback - 5; j++) {
        const idx = i - lookback + j
        let isHigh = true
        for (let k = 1; k <= 5; k++) {
          if (data[idx].high <= data[idx - k].high || data[idx].high <= data[idx + k].high) {
            isHigh = false
            break
          }
        }
        if (isHigh) {
          highs.push({ idx, price: data[idx].high })
        }
      }
      
      // Need at least 3 peaks
      if (highs.length >= 3) {
        // Check for H&S pattern: middle peak (head) is highest
        for (let h = 1; h < highs.length - 1; h++) {
          const leftShoulder = highs[h - 1]
          const head = highs[h]
          const rightShoulder = highs[h + 1]
          
          // Head must be higher than both shoulders
          if (head.price > leftShoulder.price && head.price > rightShoulder.price) {
            // Shoulders should be roughly equal
            const shoulderDiff = Math.abs(leftShoulder.price - rightShoulder.price) / leftShoulder.price
            
            if (shoulderDiff <= tolerance) {
              // Calculate neckline
              const neckline = Math.min(
                ...data.slice(leftShoulder.idx, rightShoulder.idx + 1).map(d => d.low)
              )
              
              // Bearish pattern confirmed when price breaks neckline
              if (data[i].close < neckline && data[i - 1].close >= neckline && inPosition) {
                signals.push({
                  date: data[i].date,
                  type: 'SELL',
                  price: data[i].close,
                  indicatorValues: { 
                    leftShoulder: leftShoulder.price,
                    head: head.price,
                    rightShoulder: rightShoulder.price,
                    neckline 
                  },
                })
                inPosition = false
              }
              // Entry when pattern invalidated (price goes above head)
              else if (data[i].close > head.price && !inPosition) {
                signals.push({
                  date: data[i].date,
                  type: 'BUY',
                  price: data[i].close,
                  indicatorValues: { breakout: head.price },
                })
                inPosition = true
              }
            }
          }
        }
      }
    }
    
    return signals
  },
}
