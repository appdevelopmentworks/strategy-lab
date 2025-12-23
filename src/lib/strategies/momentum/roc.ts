/**
 * Rate of Change Strategy (MO006)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { roc } from '@/lib/indicators'

export const ROCStrategy: Strategy = {
  id: 'MO006',
  name: 'ROC',
  nameJa: 'ROC（変化率）',
  category: 'momentum',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const period = params.period ?? 12
    const threshold = params.threshold ?? 0
    
    const closes = data.map(d => d.close)
    const rocValues = roc(closes, period)
    
    let inPosition = false
    
    for (let i = 1; i < data.length; i++) {
      const currROC = rocValues[i]
      const prevROC = rocValues[i - 1]
      
      if (currROC === null || prevROC === null) continue
      
      // ROC crosses above threshold - buy signal
      if (prevROC <= threshold && currROC > threshold && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: data[i].close,
          indicatorValues: { roc: currROC },
        })
        inPosition = true
      }
      // ROC crosses below threshold - sell signal
      else if (prevROC >= threshold && currROC < threshold && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: data[i].close,
          indicatorValues: { roc: currROC },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
