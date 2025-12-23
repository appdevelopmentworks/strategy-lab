/**
 * Turtle Trading Strategy (CO009)
 * 
 * The famous Turtle Trading system developed by Richard Dennis and William Eckhardt.
 * Uses two breakout systems:
 * - System 1: 20-day breakout for entry, 10-day breakout for exit
 * - System 2: 55-day breakout for entry, 20-day breakout for exit
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { atr, donchianChannel } from '@/lib/indicators'

export const TurtleStrategy: Strategy = {
  id: 'CO009',
  name: 'Turtle Trading',
  nameJa: 'タートルズ',
  category: 'composite',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const entryPeriod = params.entryPeriod ?? 20  // System 1 default
    const exitPeriod = params.exitPeriod ?? 10
    const atrPeriod = params.atrPeriod ?? 20
    const useSystem2 = params.useSystem2 ?? false
    
    // Adjust for System 2 if selected
    const actualEntryPeriod = useSystem2 ? 55 : entryPeriod
    const actualExitPeriod = useSystem2 ? 20 : exitPeriod
    
    const entryChannel = donchianChannel(data, actualEntryPeriod)
    const exitChannel = donchianChannel(data, actualExitPeriod)
    const atrValues = atr(data, atrPeriod)
    
    let inPosition = false
    let entryPrice = 0
    let stopLoss = 0
    
    for (let i = 1; i < data.length; i++) {
      const currHigh = data[i].high
      const currLow = data[i].low
      const currClose = data[i].close
      
      const prevEntryUpper = entryChannel.upper[i - 1]
      const prevEntryLower = entryChannel.lower[i - 1]
      const currExitLower = exitChannel.lower[i]
      const currATR = atrValues[i]
      
      if (prevEntryUpper === null || prevEntryLower === null || 
          currExitLower === null || currATR === null) continue
      
      if (!inPosition) {
        // Entry: Price breaks above previous period high
        if (currHigh > prevEntryUpper) {
          entryPrice = prevEntryUpper
          stopLoss = entryPrice - 2 * currATR  // 2N stop
          
          signals.push({
            date: data[i].date,
            type: 'BUY',
            price: currClose,
            indicatorValues: { 
              entryLevel: prevEntryUpper, 
              atr: currATR,
              stopLoss,
            },
          })
          inPosition = true
        }
      } else {
        // Exit conditions:
        // 1. Price breaks below exit period low
        // 2. Price hits stop loss
        const shouldExit = currLow < currExitLower || currLow < stopLoss
        
        if (shouldExit) {
          signals.push({
            date: data[i].date,
            type: 'SELL',
            price: currClose,
            indicatorValues: { 
              exitLevel: currExitLower,
              stopLoss,
            },
          })
          inPosition = false
        }
      }
    }
    
    return signals
  },
}
