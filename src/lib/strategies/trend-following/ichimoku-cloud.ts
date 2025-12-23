/**
 * Ichimoku Cloud Break Strategy (TF007)
 */

import type { OHLCV, Signal, StrategyParams } from '@/types'
import type { Strategy } from '@/lib/backtest'
import { ichimoku } from '@/lib/indicators'

export const IchimokuCloudBreak: Strategy = {
  id: 'TF007',
  name: 'Ichimoku Cloud Break',
  nameJa: '一目均衡表・雲ブレイク',
  category: 'trend-following',
  
  generateSignals(data: OHLCV[], params: StrategyParams): Signal[] {
    const signals: Signal[] = []
    const tenkanPeriod = params.tenkanPeriod ?? 9
    const kijunPeriod = params.kijunPeriod ?? 26
    const senkouPeriod = params.senkouPeriod ?? 52
    
    const { tenkan, kijun, senkouA, senkouB } = ichimoku(data, tenkanPeriod, kijunPeriod, senkouPeriod)
    
    let inPosition = false
    
    for (let i = kijunPeriod + 1; i < data.length; i++) {
      const currSenkouA = senkouA[i - kijunPeriod]
      const currSenkouB = senkouB[i - kijunPeriod]
      const prevSenkouA = senkouA[i - kijunPeriod - 1]
      const prevSenkouB = senkouB[i - kijunPeriod - 1]
      
      if (currSenkouA === null || currSenkouB === null ||
          prevSenkouA === null || prevSenkouB === null) continue
      
      const cloudTop = Math.max(currSenkouA, currSenkouB)
      const cloudBottom = Math.min(currSenkouA, currSenkouB)
      const prevCloudTop = Math.max(prevSenkouA, prevSenkouB)
      
      const currClose = data[i].close
      const prevClose = data[i - 1].close
      
      // Price breaks above cloud
      if (prevClose <= prevCloudTop && currClose > cloudTop && !inPosition) {
        signals.push({
          date: data[i].date,
          type: 'BUY',
          price: currClose,
          indicatorValues: { cloudTop, cloudBottom },
        })
        inPosition = true
      }
      // Price breaks below cloud
      else if (prevClose >= cloudBottom && currClose < cloudBottom && inPosition) {
        signals.push({
          date: data[i].date,
          type: 'SELL',
          price: currClose,
          indicatorValues: { cloudTop, cloudBottom },
        })
        inPosition = false
      }
    }
    
    return signals
  },
}
