/**
 * Parabolic SAR Strategy (TF005)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { parabolicSar } from '@/lib/indicators'

export const ParabolicSARStrategy: Strategy = {
  id: 'TF005',
  name: 'Parabolic SAR',
  nameJa: 'パラボリックSAR',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const af = params.accelerationFactor ?? 0.02
    const maxAf = params.maxAcceleration ?? 0.2
    
    const sarValues = parabolicSar(data, af, maxAf)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currSar = sarValues[i]
      const prevSar = sarValues[i - 1]
      
      if (currSar === null || prevSar === null) continue
      
      const currPrice = data[i].close
      const prevPrice = data[i - 1].close
      
      // Price crosses above SAR - buy signal
      if (prevPrice <= prevSar && currPrice > currSar && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currPrice,
          indicatorValues: { sar: currSar },
        })
        inPosition = true
      }
      // Price crosses below SAR - sell signal
      else if (prevPrice >= prevSar && currPrice < currSar && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currPrice,
          indicatorValues: { sar: currSar },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
