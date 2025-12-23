/**
 * Additional Technical Indicators
 * 
 * Ichimoku, RCI, VWAP, and other advanced indicators
 */

import type { OHLCV } from '@/types'

/**
 * Ichimoku Cloud (一目均衡表)
 */
export function ichimoku(
  ohlcv: OHLCV[],
  tenkanPeriod: number = 9,
  kijunPeriod: number = 26,
  senkouBPeriod: number = 52
): {
  tenkan: (number | null)[]      // 転換線
  kijun: (number | null)[]       // 基準線
  senkouA: (number | null)[]     // 先行スパンA
  senkouB: (number | null)[]     // 先行スパンB
  chikou: (number | null)[]      // 遅行スパン
} {
  const length = ohlcv.length
  const tenkan: (number | null)[] = []
  const kijun: (number | null)[] = []
  const senkouA: (number | null)[] = []
  const senkouB: (number | null)[] = []
  const chikou: (number | null)[] = []

  // Helper to calculate (highest high + lowest low) / 2
  const calcMidpoint = (data: OHLCV[], start: number, period: number): number | null => {
    if (start < period - 1) return null
    let highest = -Infinity
    let lowest = Infinity
    for (let i = 0; i < period; i++) {
      highest = Math.max(highest, data[start - i].high)
      lowest = Math.min(lowest, data[start - i].low)
    }
    return (highest + lowest) / 2
  }

  for (let i = 0; i < length; i++) {
    // Tenkan-sen (Conversion Line)
    tenkan.push(calcMidpoint(ohlcv, i, tenkanPeriod))
    
    // Kijun-sen (Base Line)
    kijun.push(calcMidpoint(ohlcv, i, kijunPeriod))
    
    // Senkou Span A (Leading Span A) - shifted forward by kijunPeriod
    const tenkanVal = calcMidpoint(ohlcv, i, tenkanPeriod)
    const kijunVal = calcMidpoint(ohlcv, i, kijunPeriod)
    if (tenkanVal !== null && kijunVal !== null) {
      senkouA.push((tenkanVal + kijunVal) / 2)
    } else {
      senkouA.push(null)
    }
    
    // Senkou Span B (Leading Span B) - shifted forward by kijunPeriod
    senkouB.push(calcMidpoint(ohlcv, i, senkouBPeriod))
    
    // Chikou Span (Lagging Span) - current close shifted back by kijunPeriod
    chikou.push(ohlcv[i].close)
  }

  return { tenkan, kijun, senkouA, senkouB, chikou }
}

/**
 * RCI (Rank Correlation Index / 順位相関指数)
 */
export function rci(data: number[], period: number = 9): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }

    // Get the period data
    const periodData: { value: number; timeRank: number }[] = []
    for (let j = 0; j < period; j++) {
      periodData.push({
        value: data[i - j],
        timeRank: j + 1  // 1 = most recent, period = oldest
      })
    }

    // Sort by value and assign price ranks
    const sorted = [...periodData].sort((a, b) => b.value - a.value)
    sorted.forEach((item, idx) => {
      (item as { value: number; timeRank: number; priceRank?: number }).priceRank = idx + 1
    })

    // Calculate sum of squared rank differences
    let sumD2 = 0
    for (const item of periodData) {
      const d = item.timeRank - ((item as { value: number; timeRank: number; priceRank?: number }).priceRank || 0)
      sumD2 += d * d
    }

    // RCI formula: (1 - 6 * Σd² / (n³ - n)) * 100
    const n = period
    const rciValue = (1 - (6 * sumD2) / (n * n * n - n)) * 100
    result.push(rciValue)
  }

  return result
}

/**
 * VWAP (Volume Weighted Average Price)
 * Note: Typically calculated intraday, this is a rolling version
 */
export function vwap(ohlcv: OHLCV[], period: number = 20): (number | null)[] {
  const result: (number | null)[] = []

  for (let i = 0; i < ohlcv.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }

    let sumPV = 0
    let sumV = 0

    for (let j = 0; j < period; j++) {
      const bar = ohlcv[i - j]
      const typicalPrice = (bar.high + bar.low + bar.close) / 3
      sumPV += typicalPrice * bar.volume
      sumV += bar.volume
    }

    result.push(sumV > 0 ? sumPV / sumV : null)
  }

  return result
}

/**
 * Pivot Points (Daily)
 */
export function pivotPoints(ohlcv: OHLCV[]): {
  pivot: (number | null)[]
  r1: (number | null)[]
  r2: (number | null)[]
  r3: (number | null)[]
  s1: (number | null)[]
  s2: (number | null)[]
  s3: (number | null)[]
} {
  const result = {
    pivot: [] as (number | null)[],
    r1: [] as (number | null)[],
    r2: [] as (number | null)[],
    r3: [] as (number | null)[],
    s1: [] as (number | null)[],
    s2: [] as (number | null)[],
    s3: [] as (number | null)[],
  }

  for (let i = 0; i < ohlcv.length; i++) {
    if (i === 0) {
      result.pivot.push(null)
      result.r1.push(null)
      result.r2.push(null)
      result.r3.push(null)
      result.s1.push(null)
      result.s2.push(null)
      result.s3.push(null)
      continue
    }

    const prev = ohlcv[i - 1]
    const pivot = (prev.high + prev.low + prev.close) / 3
    const range = prev.high - prev.low

    result.pivot.push(pivot)
    result.r1.push(2 * pivot - prev.low)
    result.r2.push(pivot + range)
    result.r3.push(prev.high + 2 * (pivot - prev.low))
    result.s1.push(2 * pivot - prev.high)
    result.s2.push(pivot - range)
    result.s3.push(prev.low - 2 * (prev.high - pivot))
  }

  return result
}

/**
 * Swing High/Low Detection for Fibonacci
 */
export function findSwingPoints(
  ohlcv: OHLCV[],
  lookback: number = 5
): {
  swingHighs: { index: number; price: number }[]
  swingLows: { index: number; price: number }[]
} {
  const swingHighs: { index: number; price: number }[] = []
  const swingLows: { index: number; price: number }[] = []

  for (let i = lookback; i < ohlcv.length - lookback; i++) {
    let isSwingHigh = true
    let isSwingLow = true

    for (let j = 1; j <= lookback; j++) {
      if (ohlcv[i].high <= ohlcv[i - j].high || ohlcv[i].high <= ohlcv[i + j].high) {
        isSwingHigh = false
      }
      if (ohlcv[i].low >= ohlcv[i - j].low || ohlcv[i].low >= ohlcv[i + j].low) {
        isSwingLow = false
      }
    }

    if (isSwingHigh) {
      swingHighs.push({ index: i, price: ohlcv[i].high })
    }
    if (isSwingLow) {
      swingLows.push({ index: i, price: ohlcv[i].low })
    }
  }

  return { swingHighs, swingLows }
}

/**
 * Fibonacci Retracement Levels
 */
export function fibonacciLevels(
  high: number,
  low: number
): {
  level0: number
  level236: number
  level382: number
  level500: number
  level618: number
  level786: number
  level1000: number
} {
  const range = high - low
  return {
    level0: high,
    level236: high - range * 0.236,
    level382: high - range * 0.382,
    level500: high - range * 0.5,
    level618: high - range * 0.618,
    level786: high - range * 0.786,
    level1000: low,
  }
}
