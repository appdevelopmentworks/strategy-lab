/**
 * Extended Technical Indicators
 * 
 * Additional indicators for advanced strategies
 */

import type { OHLCV } from '@/types'
import { ema, sma, atr } from './core'

/**
 * TRIX (Triple Exponential Moving Average)
 * EMA of EMA of EMA, then calculate rate of change
 */
export function trix(data: number[], period: number = 14): (number | null)[] {
  const ema1 = ema(data, period)
  const ema2 = ema(ema1.map(v => v ?? 0), period)
  const ema3 = ema(ema2.map(v => v ?? 0), period)
  
  const result: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (i < period * 3 - 2 || ema3[i - 1] === null || ema3[i - 1] === 0) {
      result.push(null)
    } else {
      const trixValue = ((ema3[i]! - ema3[i - 1]!) / ema3[i - 1]!) * 100
      result.push(trixValue)
    }
  }
  return result
}

/**
 * CMF (Chaikin Money Flow)
 */
export function cmf(ohlcv: OHLCV[], period: number = 20): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    
    let sumMFV = 0
    let sumVolume = 0
    
    for (let j = 0; j < period; j++) {
      const bar = ohlcv[i - j]
      const range = bar.high - bar.low
      const mfm = range === 0 ? 0 : ((bar.close - bar.low) - (bar.high - bar.close)) / range
      sumMFV += mfm * bar.volume
      sumVolume += bar.volume
    }
    
    result.push(sumVolume === 0 ? 0 : sumMFV / sumVolume)
  }
  
  return result
}

/**
 * DMI (Directional Movement Index) - returns +DI, -DI, and ADX
 */
export function dmi(ohlcv: OHLCV[], period: number = 14): {
  plusDI: (number | null)[]
  minusDI: (number | null)[]
  adx: (number | null)[]
} {
  const plusDI: (number | null)[] = []
  const minusDI: (number | null)[] = []
  const adxResult: (number | null)[] = []
  
  const tr: number[] = []
  const plusDM: number[] = []
  const minusDM: number[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i === 0) {
      tr.push(ohlcv[i].high - ohlcv[i].low)
      plusDM.push(0)
      minusDM.push(0)
      plusDI.push(null)
      minusDI.push(null)
      adxResult.push(null)
      continue
    }
    
    const high = ohlcv[i].high
    const low = ohlcv[i].low
    const prevHigh = ohlcv[i - 1].high
    const prevLow = ohlcv[i - 1].low
    const prevClose = ohlcv[i - 1].close
    
    // True Range
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
    
    // Directional Movement
    const upMove = high - prevHigh
    const downMove = prevLow - low
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    
    if (i < period) {
      plusDI.push(null)
      minusDI.push(null)
      adxResult.push(null)
      continue
    }
    
    // Smoothed values
    let smoothedTR = 0
    let smoothedPlusDM = 0
    let smoothedMinusDM = 0
    
    for (let j = 0; j < period; j++) {
      smoothedTR += tr[i - j]
      smoothedPlusDM += plusDM[i - j]
      smoothedMinusDM += minusDM[i - j]
    }
    
    const pdi = smoothedTR === 0 ? 0 : (smoothedPlusDM / smoothedTR) * 100
    const mdi = smoothedTR === 0 ? 0 : (smoothedMinusDM / smoothedTR) * 100
    
    plusDI.push(pdi)
    minusDI.push(mdi)
    
    // ADX
    const dx = pdi + mdi === 0 ? 0 : Math.abs(pdi - mdi) / (pdi + mdi) * 100
    
    if (i < period * 2 - 1) {
      adxResult.push(null)
    } else {
      // Simple average of DX for ADX
      let sumDX = dx
      let count = 1
      for (let j = 1; j < period && i - j >= period; j++) {
        const prevPDI = plusDI[i - j]
        const prevMDI = minusDI[i - j]
        if (prevPDI !== null && prevMDI !== null) {
          const prevDX = prevPDI + prevMDI === 0 ? 0 : Math.abs(prevPDI - prevMDI) / (prevPDI + prevMDI) * 100
          sumDX += prevDX
          count++
        }
      }
      adxResult.push(sumDX / count)
    }
  }
  
  return { plusDI, minusDI, adx: adxResult }
}

/**
 * KAMA (Kaufman's Adaptive Moving Average)
 */
export function kama(data: number[], period: number = 10, fastSC: number = 2, slowSC: number = 30): (number | null)[] {
  const result: (number | null)[] = []
  const fastAlpha = 2 / (fastSC + 1)
  const slowAlpha = 2 / (slowSC + 1)
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null)
      continue
    }
    
    // Efficiency Ratio
    const change = Math.abs(data[i] - data[i - period])
    let volatility = 0
    for (let j = 0; j < period; j++) {
      volatility += Math.abs(data[i - j] - data[i - j - 1])
    }
    
    const er = volatility === 0 ? 0 : change / volatility
    const sc = Math.pow(er * (fastAlpha - slowAlpha) + slowAlpha, 2)
    
    if (result[i - 1] === null) {
      result.push(data[i])
    } else {
      result.push(result[i - 1]! + sc * (data[i] - result[i - 1]!))
    }
  }
  
  return result
}

/**
 * DEMA (Double Exponential Moving Average)
 */
export function dema(data: number[], period: number = 12): (number | null)[] {
  const ema1 = ema(data, period)
  const ema2 = ema(ema1.map(v => v ?? 0), period)
  
  return data.map((_, i) => {
    if (ema1[i] === null || ema2[i] === null) return null
    return 2 * ema1[i]! - ema2[i]!
  })
}

/**
 * Chandelier Exit
 */
export function chandelierExit(ohlcv: OHLCV[], period: number = 22, multiplier: number = 3): {
  longExit: (number | null)[]
  shortExit: (number | null)[]
} {
  const atrValues = atr(ohlcv, period)
  const longExit: (number | null)[] = []
  const shortExit: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period || atrValues[i] === null) {
      longExit.push(null)
      shortExit.push(null)
      continue
    }
    
    let highestHigh = -Infinity
    let lowestLow = Infinity
    
    for (let j = 0; j < period; j++) {
      highestHigh = Math.max(highestHigh, ohlcv[i - j].high)
      lowestLow = Math.min(lowestLow, ohlcv[i - j].low)
    }
    
    longExit.push(highestHigh - multiplier * atrValues[i]!)
    shortExit.push(lowestLow + multiplier * atrValues[i]!)
  }
  
  return { longExit, shortExit }
}

/**
 * Aroon Indicator
 */
export function aroon(ohlcv: OHLCV[], period: number = 25): {
  aroonUp: (number | null)[]
  aroonDown: (number | null)[]
  oscillator: (number | null)[]
} {
  const aroonUp: (number | null)[] = []
  const aroonDown: (number | null)[] = []
  const oscillator: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period) {
      aroonUp.push(null)
      aroonDown.push(null)
      oscillator.push(null)
      continue
    }
    
    let highestIdx = 0
    let lowestIdx = 0
    let highest = -Infinity
    let lowest = Infinity
    
    for (let j = 0; j <= period; j++) {
      if (ohlcv[i - j].high > highest) {
        highest = ohlcv[i - j].high
        highestIdx = j
      }
      if (ohlcv[i - j].low < lowest) {
        lowest = ohlcv[i - j].low
        lowestIdx = j
      }
    }
    
    const up = ((period - highestIdx) / period) * 100
    const down = ((period - lowestIdx) / period) * 100
    
    aroonUp.push(up)
    aroonDown.push(down)
    oscillator.push(up - down)
  }
  
  return { aroonUp, aroonDown, oscillator }
}

/**
 * Choppiness Index
 */
export function choppinessIndex(ohlcv: OHLCV[], period: number = 14): (number | null)[] {
  const atrValues = atr(ohlcv, period)
  const result: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period || atrValues[i] === null) {
      result.push(null)
      continue
    }
    
    let sumATR = 0
    for (let j = 0; j < period; j++) {
      if (atrValues[i - j] !== null) {
        sumATR += atrValues[i - j]!
      }
    }
    
    let highestHigh = -Infinity
    let lowestLow = Infinity
    for (let j = 0; j < period; j++) {
      highestHigh = Math.max(highestHigh, ohlcv[i - j].high)
      lowestLow = Math.min(lowestLow, ohlcv[i - j].low)
    }
    
    const range = highestHigh - lowestLow
    if (range === 0) {
      result.push(50)
    } else {
      const ci = 100 * Math.log10(sumATR / range) / Math.log10(period)
      result.push(ci)
    }
  }
  
  return result
}

/**
 * Force Index (Elder's)
 */
export function forceIndex(ohlcv: OHLCV[], period: number = 13): (number | null)[] {
  const rawForce: number[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i === 0) {
      rawForce.push(0)
    } else {
      rawForce.push((ohlcv[i].close - ohlcv[i - 1].close) * ohlcv[i].volume)
    }
  }
  
  return ema(rawForce, period)
}

/**
 * Heiken Ashi
 */
export function heikenAshi(ohlcv: OHLCV[]): {
  open: number[]
  high: number[]
  low: number[]
  close: number[]
} {
  const haOpen: number[] = []
  const haHigh: number[] = []
  const haLow: number[] = []
  const haClose: number[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    const bar = ohlcv[i]
    
    // HA Close = (Open + High + Low + Close) / 4
    const close = (bar.open + bar.high + bar.low + bar.close) / 4
    haClose.push(close)
    
    // HA Open = (Previous HA Open + Previous HA Close) / 2
    if (i === 0) {
      haOpen.push((bar.open + bar.close) / 2)
    } else {
      haOpen.push((haOpen[i - 1] + haClose[i - 1]) / 2)
    }
    
    // HA High = Max(High, HA Open, HA Close)
    haHigh.push(Math.max(bar.high, haOpen[i], close))
    
    // HA Low = Min(Low, HA Open, HA Close)
    haLow.push(Math.min(bar.low, haOpen[i], close))
  }
  
  return { open: haOpen, high: haHigh, low: haLow, close: haClose }
}

/**
 * Bollinger Bands Width (for squeeze detection)
 */
export function bollingerBandWidth(data: number[], period: number = 20, stdDev: number = 2): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j]
    }
    const mean = sum / period
    
    let sumSq = 0
    for (let j = 0; j < period; j++) {
      sumSq += Math.pow(data[i - j] - mean, 2)
    }
    const std = Math.sqrt(sumSq / period)
    
    const upper = mean + stdDev * std
    const lower = mean - stdDev * std
    const width = (upper - lower) / mean * 100
    
    result.push(width)
  }
  
  return result
}

/**
 * VWMA (Volume Weighted Moving Average)
 */
export function vwma(ohlcv: OHLCV[], period: number = 20): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    
    let sumPV = 0
    let sumV = 0
    
    for (let j = 0; j < period; j++) {
      sumPV += ohlcv[i - j].close * ohlcv[i - j].volume
      sumV += ohlcv[i - j].volume
    }
    
    result.push(sumV === 0 ? null : sumPV / sumV)
  }
  
  return result
}

/**
 * Envelope (Moving Average Envelope)
 */
export function envelope(data: number[], period: number = 25, percentage: number = 2.5): {
  middle: (number | null)[]
  upper: (number | null)[]
  lower: (number | null)[]
} {
  const middle = sma(data, period)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (middle[i] === null) {
      upper.push(null)
      lower.push(null)
    } else {
      upper.push(middle[i]! * (1 + percentage / 100))
      lower.push(middle[i]! * (1 - percentage / 100))
    }
  }
  
  return { middle, upper, lower }
}
