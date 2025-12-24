/**
 * Extended Volume Strategies
 * CMF, Volume Spike, VWMA
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { cmf, vwma, sma } from '@/lib/indicators'

/**
 * CMF Strategy (VO005)
 */
export const CMFStrategy: Strategy = {
  id: 'VO005',
  name: 'CMF',
  nameJa: 'CMF（チャイキンマネーフロー）',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    const buyThreshold = params.buyThreshold ?? 0.05
    const sellThreshold = params.sellThreshold ?? -0.05
    
    const cmfValues = cmf(data, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currCMF = cmfValues[i]
      const prevCMF = cmfValues[i - 1]
      
      if (currCMF === null || prevCMF === null) continue
      
      // CMF crosses above buy threshold (buying pressure)
      if (prevCMF <= buyThreshold && currCMF > buyThreshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { cmf: currCMF },
        })
        inPosition = true
      }
      // CMF crosses below sell threshold (selling pressure)
      else if (prevCMF >= sellThreshold && currCMF < sellThreshold && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { cmf: currCMF },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * Volume Spike Strategy (VO006)
 */
export const VolumeSpikeStrategy: Strategy = {
  id: 'VO006',
  name: 'Volume Spike',
  nameJa: '出来高スパイク',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const maPeriod = params.maPeriod ?? 20
    const spikeMultiplier = params.spikeMultiplier ?? 2.5
    
    let inPosition = false
    
    for (let i = maPeriod; i < data.length; i++) {
      // Calculate average volume
      let avgVolume = 0
      for (let j = 1; j <= maPeriod; j++) {
        avgVolume += data[i - j].volume
      }
      avgVolume /= maPeriod
      
      const currVolume = data[i].volume
      const currPrice = data[i].close
      const prevPrice = data[i - 1].close
      const priceChange = (currPrice - prevPrice) / prevPrice
      
      // Volume spike with positive price movement
      if (currVolume > avgVolume * spikeMultiplier && priceChange > 0 && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { 
            volume: currVolume, 
            avgVolume, 
            volumeRatio: currVolume / avgVolume,
            priceChange: priceChange * 100 
          },
        })
        inPosition = true
      }
      // Exit on volume spike with negative movement or low volume
      else if ((currVolume > avgVolume * spikeMultiplier && priceChange < 0) || 
               (currVolume < avgVolume * 0.5) && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { volume: currVolume, avgVolume },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}

/**
 * VWMA Strategy (VO007)
 */
export const VWMAStrategy: Strategy = {
  id: 'VO007',
  name: 'VWMA',
  nameJa: 'VWMA（出来高加重MA）',
  category: 'volume',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 20
    
    const vwmaValues = vwma(data, period)
    const closes = data.map(d => d.close)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currVWMA = vwmaValues[i]
      const prevVWMA = vwmaValues[i - 1]
      const currPrice = closes[i]
      const prevPrice = closes[i - 1]
      
      if (currVWMA === null || prevVWMA === null) continue
      
      // Price crosses above VWMA
      if (prevPrice <= prevVWMA && currPrice > currVWMA && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { vwma: currVWMA },
        })
        inPosition = true
      }
      // Price crosses below VWMA
      else if (prevPrice >= prevVWMA && currPrice < currVWMA && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { vwma: currVWMA },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
