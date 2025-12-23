/**
 * VWAP Reversal Strategy (VO002)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { vwap } from '@/lib/indicators'

export const VWAPReversal: Strategy = {
  id: 'VO002',
  name: 'VWAP Reversal',
  nameJa: 'VWAPリバーサル',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const threshold = params.threshold ?? 2  // % deviation
    
    const vwapValues = vwap(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currVWAP = vwapValues[i]
      const currPrice = data[i].close
      
      if (currVWAP === null) continue
      
      const deviation = ((currPrice - currVWAP) / currVWAP) * 100
      
      // Price significantly below VWAP - buy
      if (deviation <= -threshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { vwap: currVWAP, deviation },
        })
        inPosition = true
      }
      // Price significantly above VWAP - sell
      else if (deviation >= threshold && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { vwap: currVWAP, deviation },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Volume Breakout Strategy (VO003)
 */
export const VolumeBreakout: Strategy = {
  id: 'VO003',
  name: 'Volume Breakout',
  nameJa: 'ボリュームブレイクアウト',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const volumeMultiplier = params.volumeMultiplier ?? 2
    
    let inPosition = false
    
    for (let i = period; i < data.length; i++) {
      // Calculate average volume
      let avgVolume = 0
      for (let j = 1; j <= period; j++) {
        avgVolume += data[i - j].volume
      }
      avgVolume /= period
      
      const currVolume = data[i].volume
      const currClose = data[i].close
      const prevClose = data[i - 1].close
      const priceChange = (currClose - prevClose) / prevClose
      
      // High volume breakout with positive price movement
      if (currVolume > avgVolume * volumeMultiplier && priceChange > 0.01 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { 
            volume: currVolume, 
            avgVolume, 
            volumeRatio: currVolume / avgVolume 
          },
        })
        inPosition = true
      }
      // Volume dries up or negative breakout
      else if ((currVolume < avgVolume * 0.5 || priceChange < -0.02) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { volume: currVolume, avgVolume },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
