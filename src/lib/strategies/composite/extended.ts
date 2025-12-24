/**
 * Extended Composite Strategies
 * Seasonality, Weekly Pivot Points
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'

/**
 * Seasonality Strategy (CO010)
 */
export const SeasonalityStrategy: Strategy = {
  id: 'CO010',
  name: 'Seasonality',
  nameJa: '季節性戦略',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    
    // Default: "Sell in May" - Buy Nov-Apr, Sell May-Oct
    const buyMonthsDefault = [11, 12, 1, 2, 3, 4]
    const sellMonthsDefault = [5, 6, 7, 8, 9, 10]
    
    const buyMonths = Array.isArray(params.buyMonths) ? params.buyMonths : buyMonthsDefault
    const sellMonths = Array.isArray(params.sellMonths) ? params.sellMonths : sellMonthsDefault
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currMonth = data[i].date.getMonth() + 1  // 1-12
      const prevMonth = data[i - 1].date.getMonth() + 1
      
      // Month changed
      if (currMonth !== prevMonth) {
        // Enter buy months
        if (buyMonths.includes(currMonth) && 
            !buyMonths.includes(prevMonth) && !inPosition) {
          signals.push({
            date: data[i].date,
            type: 'BUY',
            price: data[i].close,
            indicatorValues: { month: currMonth, isBullishSeason: 1 },
          })
          inPosition = true
        }
        // Enter sell months
        else if (sellMonths.includes(currMonth) && 
                 !sellMonths.includes(prevMonth) && inPosition) {
          signals.push({
            date: data[i].date,
            type: 'SELL',
            price: data[i].close,
            indicatorValues: { month: currMonth, isBullishSeason: 0 },
          })
          inPosition = false
        }
      }
    }
    
    return signals
  },
}

/**
 * Weekly Pivot Points Strategy (CO011)
 */
export const WeeklyPivotStrategy: Strategy = {
  id: 'CO011',
  name: 'Weekly Pivot Points',
  nameJa: '週足ピボット',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const threshold = (params.threshold as number) ?? 0.02  // 2%
    
    // Group data by week and calculate weekly pivots
    const weeklyData: { 
      weekStart: Date
      high: number
      low: number
      close: number
      open: number
    }[] = []
    
    let currentWeek = -1
    let weekHigh = -Infinity
    let weekLow = Infinity
    let weekClose = 0
    let weekOpen = 0
    let weekStart = new Date()
    
    for (let i = 0; i < data.length; i++) {
      const week = getWeekNumber(data[i].date)
      
      if (week !== currentWeek) {
        if (currentWeek !== -1) {
          weeklyData.push({
            weekStart,
            high: weekHigh,
            low: weekLow,
            close: weekClose,
            open: weekOpen,
          })
        }
        currentWeek = week
        weekHigh = data[i].high
        weekLow = data[i].low
        weekOpen = data[i].open
        weekStart = data[i].date
      }
      
      weekHigh = Math.max(weekHigh, data[i].high)
      weekLow = Math.min(weekLow, data[i].low)
      weekClose = data[i].close
    }
    
    // Add last week
    if (currentWeek !== -1) {
      weeklyData.push({
        weekStart,
        high: weekHigh,
        low: weekLow,
        close: weekClose,
        open: weekOpen,
      })
    }
    
    // Create a map of dates to weekly pivots
    const pivotMap = new Map<string, { pivot: number; s1: number; r1: number; s2: number; r2: number }>()
    
    for (let i = 1; i < weeklyData.length; i++) {
      const prev = weeklyData[i - 1]
      const pivot = (prev.high + prev.low + prev.close) / 3
      const range = prev.high - prev.low
      
      const pivotLevels = {
        pivot,
        r1: 2 * pivot - prev.low,
        s1: 2 * pivot - prev.high,
        r2: pivot + range,
        s2: pivot - range,
      }
      
      // Apply to all days in current week
      const weekStr = weeklyData[i].weekStart.toISOString().split('T')[0]
      pivotMap.set(weekStr, pivotLevels)
    }
    
    let inPosition = false
    let currentWeekPivots: { pivot: number; s1: number; r1: number; s2: number; r2: number } | null = null
    
    for (let i = 1; i < data.length; i++) {
      const week = getWeekNumber(data[i].date)
      const prevWeek = getWeekNumber(data[i - 1].date)
      
      // Update pivots on week change
      if (week !== prevWeek) {
        const weekStr = data[i].date.toISOString().split('T')[0]
        currentWeekPivots = pivotMap.get(weekStr) || null
      }
      
      if (!currentWeekPivots) continue
      
      const currPrice = data[i].close
      const { pivot, s1, s2, r1 } = currentWeekPivots
      
      // Buy near S1 or S2 support
      if (!inPosition && 
          (Math.abs(currPrice - s1) / s1 < threshold || 
           Math.abs(currPrice - s2) / s2 < threshold)) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { pivot, s1, s2, r1 },
        })
        inPosition = true
      }
      // Sell near R1 or below S2
      else if (inPosition && 
               (Math.abs(currPrice - r1) / r1 < threshold || currPrice < s2)) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { pivot, s1, s2, r1 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
