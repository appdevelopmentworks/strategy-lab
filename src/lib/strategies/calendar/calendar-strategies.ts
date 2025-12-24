/**
 * Calendar-based Strategies
 * 
 * Simple strategies based on day-of-week and month timing
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
function getDayOfWeek(date: Date): number {
  return date.getDay()
}

/**
 * Check if it's near month start (first 3 trading days)
 */
function isMonthStart(date: Date, data: OHLCV[], index: number): boolean {
  const currentMonth = date.getMonth()
  
  // Count trading days from start of month
  let tradingDays = 0
  for (let i = 0; i <= index; i++) {
    if (data[i].date.getMonth() === currentMonth) {
      tradingDays++
    }
  }
  
  return tradingDays <= 3
}

/**
 * Check if it's near month end (last 3 trading days)
 */
function isMonthEnd(date: Date, data: OHLCV[], index: number): boolean {
  const currentMonth = date.getMonth()
  
  // Count remaining trading days in month
  let remainingDays = 0
  for (let i = index; i < data.length; i++) {
    if (data[i].date.getMonth() === currentMonth) {
      remainingDays++
    } else {
      break
    }
  }
  
  return remainingDays <= 3
}

/**
 * Monday Buy / Friday Sell Strategy
 * Buy on Monday, sell on Friday
 */
export const MondayFridayStrategy: Strategy = {
  id: 'CA001',
  name: 'Monday Buy / Friday Sell',
  nameJa: '月曜買い・金曜売り',
  category: 'calendar',
  
  generateSignals(data: OHLCV[], _params?: StrategyParams): Signal[] {
    const signals: Signal[] = []
    let inPosition = false
    
    for (let i = 0; i < data.length; i++) {
      const dayOfWeek = getDayOfWeek(data[i].date)
      
      // Monday = 1, Friday = 5
      if (dayOfWeek === 1 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { dayOfWeek: 1 },
        })
        inPosition = true
      } else if (dayOfWeek === 5 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { dayOfWeek: 5 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Friday Buy / Monday Sell Strategy
 * Buy on Friday, sell on Monday (weekend effect)
 */
export const FridayMondayStrategy: Strategy = {
  id: 'CA002',
  name: 'Friday Buy / Monday Sell',
  nameJa: '金曜買い・月曜売り',
  category: 'calendar',
  
  generateSignals(data: OHLCV[], _params?: StrategyParams): Signal[] {
    const signals: Signal[] = []
    let inPosition = false
    
    for (let i = 0; i < data.length; i++) {
      const dayOfWeek = getDayOfWeek(data[i].date)
      
      if (dayOfWeek === 5 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { dayOfWeek: 5 },
        })
        inPosition = true
      } else if (dayOfWeek === 1 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { dayOfWeek: 1 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Tuesday Buy / Thursday Sell Strategy
 * Mid-week trading
 */
export const TuesdayThursdayStrategy: Strategy = {
  id: 'CA003',
  name: 'Tuesday Buy / Thursday Sell',
  nameJa: '火曜買い・木曜売り',
  category: 'calendar',
  
  generateSignals(data: OHLCV[], _params?: StrategyParams): Signal[] {
    const signals: Signal[] = []
    let inPosition = false
    
    for (let i = 0; i < data.length; i++) {
      const dayOfWeek = getDayOfWeek(data[i].date)
      
      // Tuesday = 2, Thursday = 4
      if (dayOfWeek === 2 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { dayOfWeek: 2 },
        })
        inPosition = true
      } else if (dayOfWeek === 4 && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { dayOfWeek: 4 },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Month Start Buy / Month End Sell Strategy
 */
export const MonthStartEndStrategy: Strategy = {
  id: 'CA004',
  name: 'Month Start Buy / End Sell',
  nameJa: '月初買い・月末売り',
  category: 'calendar',
  
  generateSignals(data: OHLCV[], _params?: StrategyParams): Signal[] {
    const signals: Signal[] = []
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const isStart = isMonthStart(data[i].date, data, i)
      const isEnd = isMonthEnd(data[i].date, data, i)
      const wasStart = isMonthStart(data[i - 1].date, data, i - 1)
      
      // Buy at month start (first day of month start period)
      if (isStart && !wasStart && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { dayOfMonth: data[i].date.getDate() },
        })
        inPosition = true
      }
      
      // Sell at month end
      if (isEnd && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { dayOfMonth: data[i].date.getDate() },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Month End Buy / Month Start Sell Strategy (Turn of Month effect)
 */
export const MonthEndStartStrategy: Strategy = {
  id: 'CA005',
  name: 'Month End Buy / Start Sell',
  nameJa: '月末買い・月初売り',
  category: 'calendar',
  
  generateSignals(data: OHLCV[], _params?: StrategyParams): Signal[] {
    const signals: Signal[] = []
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const isStart = isMonthStart(data[i].date, data, i)
      const isEnd = isMonthEnd(data[i].date, data, i)
      const wasEnd = isMonthEnd(data[i - 1].date, data, i - 1)
      
      // Buy at month end (first day of month end period)
      if (isEnd && !wasEnd && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { dayOfMonth: data[i].date.getDate() },
        })
        inPosition = true
      }
      
      // Sell at month start
      if (isStart && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { dayOfMonth: data[i].date.getDate() },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Fixed Holding Period Strategy Factory
 */
function createFixedHoldingStrategy(days: number, id: string): Strategy {
  return {
    id,
    name: `${days}-Day Hold`,
    nameJa: `${days}日保有`,
    category: 'calendar',
    
    generateSignals(data: OHLCV[], params?: StrategyParams): Signal[] {
      const holdingDays = params?.holdingDays ?? days
      const signals: Signal[] = []
      let i = 0
      
      while (i < data.length - holdingDays) {
        // Buy signal
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { holdingDays },
        })
        
        // Sell after holding period
        const exitIndex = i + holdingDays
        if (exitIndex < data.length) {
          signals.push({
            date: data[exitIndex].date,
            type: 'SELL',
            price: data[exitIndex].close,
            indicatorValues: { holdingDays },
          })
        }
        
        // Move to next entry (after exit)
        i = exitIndex + 1
      }
      
      return signals
    },
  }
}

// Fixed Holding Period Strategies
export const Hold1DayStrategy = createFixedHoldingStrategy(1, 'FH001')
export const Hold3DayStrategy = createFixedHoldingStrategy(3, 'FH002')
export const Hold5DayStrategy = createFixedHoldingStrategy(5, 'FH003')
export const Hold10DayStrategy = createFixedHoldingStrategy(10, 'FH004')
export const Hold20DayStrategy = createFixedHoldingStrategy(20, 'FH005')

// Export all calendar strategies
export const calendarStrategies: Strategy[] = [
  MondayFridayStrategy,
  FridayMondayStrategy,
  TuesdayThursdayStrategy,
  MonthStartEndStrategy,
  MonthEndStartStrategy,
  Hold1DayStrategy,
  Hold3DayStrategy,
  Hold5DayStrategy,
  Hold10DayStrategy,
  Hold20DayStrategy,
]
