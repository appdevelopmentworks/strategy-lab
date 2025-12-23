/**
 * Technical Indicators Library
 * 
 * Core calculation functions for technical analysis indicators.
 * All functions work with arrays of closing prices or OHLCV data.
 */

import type { OHLCV } from '@/types'

// =============================================================================
// Moving Averages
// =============================================================================

/**
 * Simple Moving Average (SMA)
 */
export function sma(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let sum = 0
      for (let j = 0; j < period; j++) {
        sum += data[i - j]
      }
      result.push(sum / period)
    }
  }
  
  return result
}

/**
 * Exponential Moving Average (EMA)
 */
export function ema(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = []
  const multiplier = 2 / (period + 1)
  
  let initialSma = 0
  for (let i = 0; i < period; i++) {
    initialSma += data[i]
    result.push(null)
  }
  initialSma /= period
  result[period - 1] = initialSma
  
  let prevEma = initialSma
  for (let i = period; i < data.length; i++) {
    const currentEma = (data[i] - prevEma) * multiplier + prevEma
    result.push(currentEma)
    prevEma = currentEma
  }
  
  return result
}

// =============================================================================
// Momentum Indicators
// =============================================================================

/**
 * Relative Strength Index (RSI)
 */
export function rsi(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)
  }
  
  result.push(null)
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let avgGain = 0
      let avgLoss = 0
      for (let j = 0; j < period; j++) {
        avgGain += gains[i - j]
        avgLoss += losses[i - j]
      }
      avgGain /= period
      avgLoss /= period
      
      if (avgLoss === 0) {
        result.push(100)
      } else {
        const rs = avgGain / avgLoss
        result.push(100 - (100 / (1 + rs)))
      }
    }
  }
  
  return result
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function macd(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: (number | null)[]
  signal: (number | null)[]
  histogram: (number | null)[]
} {
  const fastEma = ema(data, fastPeriod)
  const slowEma = ema(data, slowPeriod)
  
  const macdLine: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (fastEma[i] === null || slowEma[i] === null) {
      macdLine.push(null)
    } else {
      macdLine.push(fastEma[i]! - slowEma[i]!)
    }
  }
  
  const validMacd = macdLine.filter((v): v is number => v !== null)
  const signalEma = ema(validMacd, signalPeriod)
  
  const signalLine: (number | null)[] = []
  let signalIdx = 0
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null)
    } else {
      signalLine.push(signalEma[signalIdx] ?? null)
      signalIdx++
    }
  }
  
  const histogram: (number | null)[] = []
  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null)
    } else {
      histogram.push(macdLine[i]! - signalLine[i]!)
    }
  }
  
  return { macd: macdLine, signal: signalLine, histogram }
}

/**
 * Stochastic Oscillator
 */
export function stochastic(
  ohlcv: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smoothK: number = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const rawK: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(null)
    } else {
      let lowestLow = Infinity
      let highestHigh = -Infinity
      
      for (let j = 0; j < kPeriod; j++) {
        const candle = ohlcv[i - j]
        lowestLow = Math.min(lowestLow, candle.low)
        highestHigh = Math.max(highestHigh, candle.high)
      }
      
      const range = highestHigh - lowestLow
      rawK.push(range === 0 ? 50 : ((ohlcv[i].close - lowestLow) / range) * 100)
    }
  }
  
  const validRawK = rawK.filter((v): v is number => v !== null)
  const smoothedK = sma(validRawK, smoothK)
  
  const k: (number | null)[] = []
  let kIdx = 0
  for (let i = 0; i < ohlcv.length; i++) {
    if (rawK[i] === null) {
      k.push(null)
    } else {
      k.push(smoothedK[kIdx] ?? null)
      kIdx++
    }
  }
  
  const validK = k.filter((v): v is number => v !== null)
  const dValues = sma(validK, dPeriod)
  
  const d: (number | null)[] = []
  let dIdx = 0
  for (let i = 0; i < ohlcv.length; i++) {
    if (k[i] === null) {
      d.push(null)
    } else {
      d.push(dValues[dIdx] ?? null)
      dIdx++
    }
  }
  
  return { k, d }
}

/**
 * Commodity Channel Index (CCI)
 */
export function cci(ohlcv: OHLCV[], period: number = 20): (number | null)[] {
  const result: (number | null)[] = []
  const typicalPrices: number[] = ohlcv.map(d => (d.high + d.low + d.close) / 3)
  const tpSma = sma(typicalPrices, period)
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (tpSma[i] === null) {
      result.push(null)
    } else {
      // Calculate mean deviation
      let sumDeviation = 0
      for (let j = 0; j < period; j++) {
        sumDeviation += Math.abs(typicalPrices[i - j] - tpSma[i]!)
      }
      const meanDeviation = sumDeviation / period
      
      if (meanDeviation === 0) {
        result.push(0)
      } else {
        result.push((typicalPrices[i] - tpSma[i]!) / (0.015 * meanDeviation))
      }
    }
  }
  
  return result
}

/**
 * Williams %R
 */
export function williamsR(ohlcv: OHLCV[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period - 1) {
      result.push(null)
    } else {
      let highestHigh = -Infinity
      let lowestLow = Infinity
      
      for (let j = 0; j < period; j++) {
        highestHigh = Math.max(highestHigh, ohlcv[i - j].high)
        lowestLow = Math.min(lowestLow, ohlcv[i - j].low)
      }
      
      const range = highestHigh - lowestLow
      if (range === 0) {
        result.push(-50)
      } else {
        result.push(((highestHigh - ohlcv[i].close) / range) * -100)
      }
    }
  }
  
  return result
}

/**
 * Rate of Change (ROC)
 */
export function roc(data: number[], period: number = 12): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null)
    } else {
      const pastPrice = data[i - period]
      if (pastPrice === 0) {
        result.push(null)
      } else {
        result.push(((data[i] - pastPrice) / pastPrice) * 100)
      }
    }
  }
  
  return result
}

/**
 * Momentum
 */
export function momentum(data: number[], period: number = 10): (number | null)[] {
  const result: (number | null)[] = []
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null)
    } else {
      result.push(data[i] - data[i - period])
    }
  }
  
  return result
}

// =============================================================================
// Trend Indicators
// =============================================================================

/**
 * Average Directional Index (ADX)
 */
export function adx(ohlcv: OHLCV[], period: number = 14): {
  adx: (number | null)[]
  plusDI: (number | null)[]
  minusDI: (number | null)[]
} {
  const plusDM: number[] = []
  const minusDM: number[] = []
  const tr: number[] = []
  
  // Calculate +DM, -DM, and TR
  for (let i = 1; i < ohlcv.length; i++) {
    const current = ohlcv[i]
    const prev = ohlcv[i - 1]
    
    const upMove = current.high - prev.high
    const downMove = prev.low - current.low
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    
    const trValue = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    )
    tr.push(trValue)
  }
  
  // Smooth the values
  const smoothedPlusDM = sma(plusDM, period)
  const smoothedMinusDM = sma(minusDM, period)
  const smoothedTR = sma(tr, period)
  
  // Calculate +DI and -DI
  const plusDI: (number | null)[] = [null]
  const minusDI: (number | null)[] = [null]
  const dx: number[] = []
  
  for (let i = 0; i < smoothedTR.length; i++) {
    if (smoothedTR[i] === null || smoothedTR[i] === 0) {
      plusDI.push(null)
      minusDI.push(null)
    } else {
      const pdi = (smoothedPlusDM[i]! / smoothedTR[i]!) * 100
      const mdi = (smoothedMinusDM[i]! / smoothedTR[i]!) * 100
      plusDI.push(pdi)
      minusDI.push(mdi)
      
      const diSum = pdi + mdi
      if (diSum !== 0) {
        dx.push(Math.abs(pdi - mdi) / diSum * 100)
      }
    }
  }
  
  // Calculate ADX
  const adxValues = sma(dx, period)
  const adxResult: (number | null)[] = []
  let adxIdx = 0
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (plusDI[i] === null) {
      adxResult.push(null)
    } else if (adxIdx < adxValues.length) {
      adxResult.push(adxValues[adxIdx])
      adxIdx++
    } else {
      adxResult.push(null)
    }
  }
  
  return { adx: adxResult, plusDI, minusDI }
}

/**
 * Parabolic SAR
 */
export function parabolicSar(
  ohlcv: OHLCV[],
  accelerationFactor: number = 0.02,
  maxAcceleration: number = 0.2
): (number | null)[] {
  if (ohlcv.length < 2) return ohlcv.map(() => null)
  
  const result: (number | null)[] = [null]
  let isUpTrend = ohlcv[1].close > ohlcv[0].close
  let af = accelerationFactor
  let ep = isUpTrend ? ohlcv[0].high : ohlcv[0].low
  let sar = isUpTrend ? ohlcv[0].low : ohlcv[0].high
  
  for (let i = 1; i < ohlcv.length; i++) {
    const current = ohlcv[i]
    
    // Calculate new SAR
    let newSar = sar + af * (ep - sar)
    
    if (isUpTrend) {
      // Limit SAR to previous two lows
      if (i >= 2) {
        newSar = Math.min(newSar, ohlcv[i - 1].low, ohlcv[i - 2].low)
      } else if (i >= 1) {
        newSar = Math.min(newSar, ohlcv[i - 1].low)
      }
      
      // Check for reversal
      if (current.low < newSar) {
        isUpTrend = false
        newSar = ep
        ep = current.low
        af = accelerationFactor
      } else {
        if (current.high > ep) {
          ep = current.high
          af = Math.min(af + accelerationFactor, maxAcceleration)
        }
      }
    } else {
      // Limit SAR to previous two highs
      if (i >= 2) {
        newSar = Math.max(newSar, ohlcv[i - 1].high, ohlcv[i - 2].high)
      } else if (i >= 1) {
        newSar = Math.max(newSar, ohlcv[i - 1].high)
      }
      
      // Check for reversal
      if (current.high > newSar) {
        isUpTrend = true
        newSar = ep
        ep = current.high
        af = accelerationFactor
      } else {
        if (current.low < ep) {
          ep = current.low
          af = Math.min(af + accelerationFactor, maxAcceleration)
        }
      }
    }
    
    sar = newSar
    result.push(sar)
  }
  
  return result
}

/**
 * SuperTrend
 */
export function superTrend(
  ohlcv: OHLCV[],
  period: number = 10,
  multiplier: number = 3
): {
  superTrend: (number | null)[]
  direction: (number | null)[]  // 1 = bullish, -1 = bearish
} {
  const atrValues = atr(ohlcv, period)
  const result: (number | null)[] = []
  const direction: (number | null)[] = []
  
  let prevUpperBand = 0
  let prevLowerBand = 0
  let prevSuperTrend = 0
  let prevDirection = 1
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (atrValues[i] === null) {
      result.push(null)
      direction.push(null)
      continue
    }
    
    const hl2 = (ohlcv[i].high + ohlcv[i].low) / 2
    const upperBand = hl2 + multiplier * atrValues[i]!
    const lowerBand = hl2 - multiplier * atrValues[i]!
    
    // Adjust bands based on previous values
    const finalUpperBand = (upperBand < prevUpperBand || ohlcv[i - 1]?.close > prevUpperBand) 
      ? upperBand : prevUpperBand
    const finalLowerBand = (lowerBand > prevLowerBand || ohlcv[i - 1]?.close < prevLowerBand) 
      ? lowerBand : prevLowerBand
    
    let currentDirection: number
    let superTrendValue: number
    
    if (prevSuperTrend === prevUpperBand) {
      currentDirection = ohlcv[i].close > finalUpperBand ? 1 : -1
    } else {
      currentDirection = ohlcv[i].close < finalLowerBand ? -1 : 1
    }
    
    superTrendValue = currentDirection === 1 ? finalLowerBand : finalUpperBand
    
    result.push(superTrendValue)
    direction.push(currentDirection)
    
    prevUpperBand = finalUpperBand
    prevLowerBand = finalLowerBand
    prevSuperTrend = superTrendValue
    prevDirection = currentDirection
  }
  
  return { superTrend: result, direction }
}

// =============================================================================
// Volatility Indicators
// =============================================================================

/**
 * Bollinger Bands
 */
export function bollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: (number | null)[]
  middle: (number | null)[]
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
      let sumSquares = 0
      for (let j = 0; j < period; j++) {
        const diff = data[i - j] - middle[i]!
        sumSquares += diff * diff
      }
      const std = Math.sqrt(sumSquares / period)
      
      upper.push(middle[i]! + stdDev * std)
      lower.push(middle[i]! - stdDev * std)
    }
  }
  
  return { upper, middle, lower }
}

/**
 * Average True Range (ATR)
 */
export function atr(ohlcv: OHLCV[], period: number = 14): (number | null)[] {
  const trueRanges: number[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    const current = ohlcv[i]
    if (i === 0) {
      trueRanges.push(current.high - current.low)
    } else {
      const prev = ohlcv[i - 1]
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - prev.close),
        Math.abs(current.low - prev.close)
      )
      trueRanges.push(tr)
    }
  }
  
  return sma(trueRanges, period)
}

/**
 * Keltner Channel
 */
export function keltnerChannel(
  ohlcv: OHLCV[],
  emaPeriod: number = 20,
  atrPeriod: number = 10,
  multiplier: number = 2
): {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
} {
  const closes = ohlcv.map(d => d.close)
  const middle = ema(closes, emaPeriod)
  const atrValues = atr(ohlcv, atrPeriod)
  
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (middle[i] === null || atrValues[i] === null) {
      upper.push(null)
      lower.push(null)
    } else {
      upper.push(middle[i]! + multiplier * atrValues[i]!)
      lower.push(middle[i]! - multiplier * atrValues[i]!)
    }
  }
  
  return { upper, middle, lower }
}

// =============================================================================
// Volume Indicators
// =============================================================================

/**
 * On Balance Volume (OBV)
 */
export function obv(ohlcv: OHLCV[]): number[] {
  const result: number[] = [0]
  
  for (let i = 1; i < ohlcv.length; i++) {
    const current = ohlcv[i]
    const prev = ohlcv[i - 1]
    const prevObv = result[i - 1]
    
    if (current.close > prev.close) {
      result.push(prevObv + current.volume)
    } else if (current.close < prev.close) {
      result.push(prevObv - current.volume)
    } else {
      result.push(prevObv)
    }
  }
  
  return result
}

/**
 * Money Flow Index (MFI)
 */
export function mfi(ohlcv: OHLCV[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = []
  const typicalPrices: number[] = []
  const moneyFlows: number[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    const tp = (ohlcv[i].high + ohlcv[i].low + ohlcv[i].close) / 3
    typicalPrices.push(tp)
    moneyFlows.push(tp * ohlcv[i].volume)
  }
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period) {
      result.push(null)
    } else {
      let positiveFlow = 0
      let negativeFlow = 0
      
      for (let j = 0; j < period; j++) {
        const idx = i - j
        if (idx > 0 && typicalPrices[idx] > typicalPrices[idx - 1]) {
          positiveFlow += moneyFlows[idx]
        } else if (idx > 0) {
          negativeFlow += moneyFlows[idx]
        }
      }
      
      if (negativeFlow === 0) {
        result.push(100)
      } else {
        const mfRatio = positiveFlow / negativeFlow
        result.push(100 - (100 / (1 + mfRatio)))
      }
    }
  }
  
  return result
}

// =============================================================================
// Channel Indicators
// =============================================================================

/**
 * Donchian Channel
 */
export function donchianChannel(
  ohlcv: OHLCV[],
  period: number = 20
): {
  upper: (number | null)[]
  middle: (number | null)[]
  lower: (number | null)[]
} {
  const upper: (number | null)[] = []
  const middle: (number | null)[] = []
  const lower: (number | null)[] = []
  
  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period - 1) {
      upper.push(null)
      middle.push(null)
      lower.push(null)
    } else {
      let highestHigh = -Infinity
      let lowestLow = Infinity
      
      for (let j = 0; j < period; j++) {
        highestHigh = Math.max(highestHigh, ohlcv[i - j].high)
        lowestLow = Math.min(lowestLow, ohlcv[i - j].low)
      }
      
      upper.push(highestHigh)
      lower.push(lowestLow)
      middle.push((highestHigh + lowestLow) / 2)
    }
  }
  
  return { upper, middle, lower }
}
