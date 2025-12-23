/**
 * Strategy Registry
 * 
 * Central registry for all 42 trading strategies with metadata and definitions.
 */

import type { StrategyInfo, StrategyCategory } from '@/types'
import type { Strategy } from '@/lib/backtest'

// Trend Following strategies
import { SMAcrossover } from './trend-following/sma-crossover'
import { EMAcrossover } from './trend-following/ema-crossover'
import { MACDsignal } from './trend-following/macd-signal'
import { ADXtrend } from './trend-following/adx-trend'
import { ParabolicSARStrategy } from './trend-following/parabolic-sar'
import { SuperTrendStrategy } from './trend-following/supertrend'
import { IchimokuCloudBreak } from './trend-following/ichimoku-cloud'

// Momentum strategies
import { RSIcontrarian } from './momentum/rsi-contrarian'
import { RSItrend } from './momentum/rsi-trend'
import { StochasticStrategy } from './momentum/stochastic'
import { CCIStrategy } from './momentum/cci'
import { WilliamsRStrategy } from './momentum/williams-r'
import { ROCStrategy } from './momentum/roc'
import { MomentumStrategy } from './momentum/momentum'
import { RCIStrategy } from './momentum/rci'

// Breakout strategies
import { BollingerBreakout } from './breakout/bollinger-breakout'
import { DonchianBreakout } from './breakout/donchian-breakout'
import { KeltnerBreakout } from './breakout/keltner-breakout'
import { Week52HighBreakout } from './breakout/week52-high'
import { ATRBreakout } from './breakout/atr-breakout'

// Mean Reversion strategies
import { BollingerReversion } from './mean-reversion/bollinger-reversion'
import { RSIDivergence } from './mean-reversion/rsi-divergence'
import { MADeviation } from './mean-reversion/ma-deviation'
import { ZScoreStrategy } from './mean-reversion/zscore'

// Volume strategies
import { OBVStrategy } from './volume/obv'
import { MFIStrategy } from './volume/mfi'
import { VWAPReversal, VolumeBreakout } from './volume/vwap-volume'

// Pattern strategies
import { GoldenCross } from './pattern/golden-cross'
import { DeadCross, IchimokuSanku, DoubleBottom, HeadAndShoulders } from './pattern/patterns'

// Composite strategies
import { MACDRSIStrategy } from './composite/macd-rsi'
import { TurtleStrategy } from './composite/turtle'
import { 
  TrendMomentum, 
  VolatilityAdjusted, 
  MARibbon, 
  HighLowChannel,
  PivotPointsStrategy,
  FibonacciStrategy,
  HighLowBreakout,
} from './composite/composite-strategies'

/**
 * All registered strategies (42 total)
 */
export const strategies: Strategy[] = [
  // Trend Following (7)
  SMAcrossover,
  EMAcrossover,
  MACDsignal,
  ADXtrend,
  ParabolicSARStrategy,
  SuperTrendStrategy,
  IchimokuCloudBreak,
  // Momentum (8)
  RSIcontrarian,
  RSItrend,
  StochasticStrategy,
  CCIStrategy,
  WilliamsRStrategy,
  ROCStrategy,
  MomentumStrategy,
  RCIStrategy,
  // Breakout (5)
  BollingerBreakout,
  DonchianBreakout,
  KeltnerBreakout,
  Week52HighBreakout,
  ATRBreakout,
  // Mean Reversion (4)
  BollingerReversion,
  RSIDivergence,
  MADeviation,
  ZScoreStrategy,
  // Volume (4)
  OBVStrategy,
  MFIStrategy,
  VWAPReversal,
  VolumeBreakout,
  // Pattern (5)
  GoldenCross,
  DeadCross,
  IchimokuSanku,
  DoubleBottom,
  HeadAndShoulders,
  // Composite (9)
  MACDRSIStrategy,
  TurtleStrategy,
  TrendMomentum,
  VolatilityAdjusted,
  MARibbon,
  HighLowChannel,
  PivotPointsStrategy,
  FibonacciStrategy,
  HighLowBreakout,
]

/**
 * Strategy metadata registry
 */
export const strategyRegistry: StrategyInfo[] = [
  // ===== Trend Following (7) =====
  {
    id: 'TF001',
    name: 'SMA Crossover',
    nameJa: 'SMAクロスオーバー',
    category: 'trend-following',
    description: 'Buy when short-term SMA crosses above long-term SMA',
    descriptionJa: '短期SMAが長期SMAを上抜けで買い、下抜けで売り',
    parameters: [
      { name: 'shortPeriod', label: 'Short Period', labelJa: '短期期間', type: 'number', default: 10, min: 5, max: 50, step: 5 },
      { name: 'longPeriod', label: 'Long Period', labelJa: '長期期間', type: 'number', default: 50, min: 20, max: 200, step: 10 },
    ],
  },
  {
    id: 'TF002',
    name: 'EMA Crossover',
    nameJa: 'EMAクロスオーバー',
    category: 'trend-following',
    description: 'Buy when short-term EMA crosses above long-term EMA',
    descriptionJa: '短期EMAが長期EMAを上抜けで買い、下抜けで売り',
    parameters: [
      { name: 'shortPeriod', label: 'Short Period', labelJa: '短期期間', type: 'number', default: 12, min: 5, max: 50, step: 1 },
      { name: 'longPeriod', label: 'Long Period', labelJa: '長期期間', type: 'number', default: 26, min: 20, max: 200, step: 1 },
    ],
  },
  {
    id: 'TF003',
    name: 'MACD Signal',
    nameJa: 'MACDシグナル',
    category: 'trend-following',
    description: 'Buy when MACD crosses above signal line',
    descriptionJa: 'MACDラインがシグナルラインを上抜けで買い、下抜けで売り',
    parameters: [
      { name: 'fastPeriod', label: 'Fast Period', labelJa: '短期期間', type: 'number', default: 12, min: 5, max: 20, step: 1 },
      { name: 'slowPeriod', label: 'Slow Period', labelJa: '長期期間', type: 'number', default: 26, min: 15, max: 40, step: 1 },
      { name: 'signalPeriod', label: 'Signal Period', labelJa: 'シグナル期間', type: 'number', default: 9, min: 3, max: 15, step: 1 },
    ],
  },
  {
    id: 'TF004',
    name: 'ADX Trend',
    nameJa: 'ADXトレンド',
    category: 'trend-following',
    description: 'Trade with +DI/-DI crossover when ADX shows strong trend',
    descriptionJa: 'ADXが閾値以上で+DIが-DIを上抜けで買い',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'threshold', label: 'ADX Threshold', labelJa: 'ADX閾値', type: 'number', default: 25, min: 15, max: 40, step: 5 },
    ],
  },
  {
    id: 'TF005',
    name: 'Parabolic SAR',
    nameJa: 'パラボリックSAR',
    category: 'trend-following',
    description: 'Trade on Parabolic SAR reversals',
    descriptionJa: 'パラボリックSARの反転でエントリー',
    parameters: [
      { name: 'accelerationFactor', label: 'Acceleration', labelJa: '加速係数', type: 'number', default: 0.02, min: 0.01, max: 0.1, step: 0.01 },
      { name: 'maxAcceleration', label: 'Max Acceleration', labelJa: '最大加速', type: 'number', default: 0.2, min: 0.1, max: 0.5, step: 0.05 },
    ],
  },
  {
    id: 'TF006',
    name: 'SuperTrend',
    nameJa: 'スーパートレンド',
    category: 'trend-following',
    description: 'Trade on SuperTrend direction changes',
    descriptionJa: 'スーパートレンドの方向転換でエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 10, min: 5, max: 20, step: 1 },
      { name: 'multiplier', label: 'Multiplier', labelJa: '乗数', type: 'number', default: 3, min: 1, max: 5, step: 0.5 },
    ],
  },
  {
    id: 'TF007',
    name: 'Ichimoku Cloud Break',
    nameJa: '一目均衡表・雲ブレイク',
    category: 'trend-following',
    description: 'Buy when price breaks above the Ichimoku cloud',
    descriptionJa: '価格が雲を上抜けで買い、下抜けで売り',
    parameters: [
      { name: 'tenkanPeriod', label: 'Tenkan', labelJa: '転換線', type: 'number', default: 9, min: 5, max: 15, step: 1 },
      { name: 'kijunPeriod', label: 'Kijun', labelJa: '基準線', type: 'number', default: 26, min: 15, max: 40, step: 1 },
      { name: 'senkouPeriod', label: 'Senkou', labelJa: '先行スパン', type: 'number', default: 52, min: 30, max: 80, step: 1 },
    ],
  },

  // ===== Momentum (8) =====
  {
    id: 'MO001',
    name: 'RSI Trend',
    nameJa: 'RSI順張り',
    category: 'momentum',
    description: 'Buy when RSI crosses above 50',
    descriptionJa: 'RSIが50を上抜けで買い、下抜けで売り',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 5, max: 30, step: 1 },
      { name: 'threshold', label: 'Threshold', labelJa: '閾値', type: 'number', default: 50, min: 40, max: 60, step: 5 },
    ],
  },
  {
    id: 'MO002',
    name: 'RSI Contrarian',
    nameJa: 'RSI逆張り',
    category: 'momentum',
    description: 'Buy when RSI is oversold, sell when overbought',
    descriptionJa: 'RSIが売られすぎで買い、買われすぎで売り',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 5, max: 30, step: 1 },
      { name: 'oversold', label: 'Oversold', labelJa: '売られすぎ', type: 'number', default: 30, min: 10, max: 40, step: 5 },
      { name: 'overbought', label: 'Overbought', labelJa: '買われすぎ', type: 'number', default: 70, min: 60, max: 90, step: 5 },
    ],
  },
  {
    id: 'MO003',
    name: 'Stochastic',
    nameJa: 'ストキャスティクス',
    category: 'momentum',
    description: '%K crosses above %D in oversold zone',
    descriptionJa: '%Kが%Dを上抜けで買い（売られすぎ時）',
    parameters: [
      { name: 'kPeriod', label: '%K Period', labelJa: '%K期間', type: 'number', default: 14, min: 5, max: 21, step: 1 },
      { name: 'dPeriod', label: '%D Period', labelJa: '%D期間', type: 'number', default: 3, min: 1, max: 10, step: 1 },
      { name: 'oversold', label: 'Oversold', labelJa: '売られすぎ', type: 'number', default: 20, min: 10, max: 30, step: 5 },
      { name: 'overbought', label: 'Overbought', labelJa: '買われすぎ', type: 'number', default: 80, min: 70, max: 90, step: 5 },
    ],
  },
  {
    id: 'MO004',
    name: 'CCI',
    nameJa: 'CCI',
    category: 'momentum',
    description: 'Trade on CCI crossing oversold/overbought levels',
    descriptionJa: 'CCIが売られすぎ/買われすぎを抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 40, step: 5 },
      { name: 'oversold', label: 'Oversold', labelJa: '売られすぎ', type: 'number', default: -100, min: -200, max: -50, step: 25 },
      { name: 'overbought', label: 'Overbought', labelJa: '買われすぎ', type: 'number', default: 100, min: 50, max: 200, step: 25 },
    ],
  },
  {
    id: 'MO005',
    name: 'Williams %R',
    nameJa: 'ウィリアムズ%R',
    category: 'momentum',
    description: 'Trade on Williams %R crossing levels',
    descriptionJa: 'ウィリアムズ%Rが閾値を抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'oversold', label: 'Oversold', labelJa: '売られすぎ', type: 'number', default: -80, min: -95, max: -70, step: 5 },
      { name: 'overbought', label: 'Overbought', labelJa: '買われすぎ', type: 'number', default: -20, min: -30, max: -5, step: 5 },
    ],
  },
  {
    id: 'MO006',
    name: 'ROC',
    nameJa: 'ROC（変化率）',
    category: 'momentum',
    description: 'Trade on Rate of Change crossing zero',
    descriptionJa: 'ROCがゼロを上抜け/下抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 12, min: 5, max: 30, step: 1 },
      { name: 'threshold', label: 'Threshold', labelJa: '閾値', type: 'number', default: 0, min: -5, max: 5, step: 1 },
    ],
  },
  {
    id: 'MO007',
    name: 'Momentum',
    nameJa: 'モメンタム',
    category: 'momentum',
    description: 'Trade on Momentum crossing zero',
    descriptionJa: 'モメンタムがゼロを上抜け/下抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 10, min: 5, max: 30, step: 1 },
    ],
  },
  {
    id: 'MO008',
    name: 'RCI',
    nameJa: 'RCI（順位相関指数）',
    category: 'momentum',
    description: 'Trade on RCI crossing overbought/oversold levels',
    descriptionJa: 'RCIが売られすぎ/買われすぎを抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 9, min: 5, max: 21, step: 1 },
      { name: 'oversold', label: 'Oversold', labelJa: '売られすぎ', type: 'number', default: -80, min: -95, max: -60, step: 5 },
      { name: 'overbought', label: 'Overbought', labelJa: '買われすぎ', type: 'number', default: 80, min: 60, max: 95, step: 5 },
    ],
  },

  // ===== Breakout (5) =====
  {
    id: 'BO001',
    name: 'Bollinger Breakout',
    nameJa: 'ボリンジャーバンド・ブレイクアウト',
    category: 'breakout',
    description: 'Buy when price breaks above upper band',
    descriptionJa: '上バンド突破で買い、下バンド突破で売り',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'stdDev', label: 'Std Dev', labelJa: '標準偏差', type: 'number', default: 2, min: 1, max: 3, step: 0.5 },
    ],
  },
  {
    id: 'BO002',
    name: 'Donchian Breakout',
    nameJa: 'ドンチャンチャネル',
    category: 'breakout',
    description: 'Buy when price makes new period high',
    descriptionJa: 'n日高値更新で買い、n日安値更新で売り',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 60, step: 5 },
    ],
  },
  {
    id: 'BO003',
    name: 'Keltner Channel Breakout',
    nameJa: 'ケルトナーチャネル',
    category: 'breakout',
    description: 'Trade on Keltner Channel breakouts',
    descriptionJa: 'ケルトナーチャネル突破でエントリー',
    parameters: [
      { name: 'emaPeriod', label: 'EMA Period', labelJa: 'EMA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'atrPeriod', label: 'ATR Period', labelJa: 'ATR期間', type: 'number', default: 10, min: 5, max: 20, step: 1 },
      { name: 'multiplier', label: 'Multiplier', labelJa: '乗数', type: 'number', default: 2, min: 1, max: 4, step: 0.5 },
    ],
  },
  {
    id: 'BO004',
    name: '52-Week High Breakout',
    nameJa: '52週高値ブレイク',
    category: 'breakout',
    description: 'Buy when price breaks 52-week high',
    descriptionJa: '52週高値更新で買い',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間（日）', type: 'number', default: 252, min: 126, max: 504, step: 21 },
      { name: 'exitPeriod', label: 'Exit Period', labelJa: '出口期間', type: 'number', default: 20, min: 10, max: 60, step: 5 },
    ],
  },
  {
    id: 'BO005',
    name: 'ATR Breakout',
    nameJa: 'ATRブレイクアウト',
    category: 'breakout',
    description: 'Trade on ATR-based channel breakouts',
    descriptionJa: 'ATRベースのチャネル突破でエントリー',
    parameters: [
      { name: 'atrPeriod', label: 'ATR Period', labelJa: 'ATR期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'multiplier', label: 'Multiplier', labelJa: '乗数', type: 'number', default: 2, min: 1, max: 4, step: 0.5 },
      { name: 'smaPeriod', label: 'SMA Period', labelJa: 'SMA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
    ],
  },

  // ===== Mean Reversion (4) =====
  {
    id: 'MR001',
    name: 'Bollinger Reversion',
    nameJa: 'ボリンジャーバンド逆張り',
    category: 'mean-reversion',
    description: 'Buy at lower band, sell at upper band',
    descriptionJa: '下バンドタッチで買い、上バンドタッチで売り',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'stdDev', label: 'Std Dev', labelJa: '標準偏差', type: 'number', default: 2, min: 1, max: 3, step: 0.5 },
    ],
  },
  {
    id: 'MR002',
    name: 'RSI Divergence',
    nameJa: 'RSIダイバージェンス',
    category: 'mean-reversion',
    description: 'Trade on price-RSI divergence patterns',
    descriptionJa: '価格とRSIの乖離（ダイバージェンス）でエントリー',
    parameters: [
      { name: 'period', label: 'RSI Period', labelJa: 'RSI期間', type: 'number', default: 14, min: 7, max: 21, step: 1 },
      { name: 'lookback', label: 'Lookback', labelJa: '検出期間', type: 'number', default: 10, min: 5, max: 20, step: 1 },
    ],
  },
  {
    id: 'MR003',
    name: 'MA Deviation',
    nameJa: '移動平均乖離率',
    category: 'mean-reversion',
    description: 'Trade when price deviates significantly from MA',
    descriptionJa: '移動平均から大きく乖離したらエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'buyThreshold', label: 'Buy Threshold', labelJa: '買い閾値(%)', type: 'number', default: -5, min: -15, max: -2, step: 1 },
      { name: 'sellThreshold', label: 'Sell Threshold', labelJa: '売り閾値(%)', type: 'number', default: 5, min: 2, max: 15, step: 1 },
    ],
  },
  {
    id: 'MR004',
    name: 'Z-Score',
    nameJa: 'Zスコア',
    category: 'mean-reversion',
    description: 'Trade on statistical Z-Score extremes',
    descriptionJa: 'Zスコアが極端な値でエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'buyThreshold', label: 'Buy Threshold', labelJa: '買い閾値', type: 'number', default: -2, min: -3, max: -1, step: 0.5 },
      { name: 'sellThreshold', label: 'Sell Threshold', labelJa: '売り閾値', type: 'number', default: 2, min: 1, max: 3, step: 0.5 },
    ],
  },

  // ===== Volume (4) =====
  {
    id: 'VO001',
    name: 'OBV',
    nameJa: 'OBV（出来高）',
    category: 'volume',
    description: 'Trade on OBV crossing its moving average',
    descriptionJa: 'OBVが移動平均を上抜け/下抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
    ],
  },
  {
    id: 'VO002',
    name: 'VWAP Reversal',
    nameJa: 'VWAPリバーサル',
    category: 'volume',
    description: 'Trade on price deviation from VWAP',
    descriptionJa: 'VWAPからの乖離で逆張りエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'threshold', label: 'Threshold %', labelJa: '閾値(%)', type: 'number', default: 2, min: 1, max: 5, step: 0.5 },
    ],
  },
  {
    id: 'VO003',
    name: 'Volume Breakout',
    nameJa: 'ボリュームブレイクアウト',
    category: 'volume',
    description: 'Trade on high volume breakouts',
    descriptionJa: '出来高急増でエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'volumeMultiplier', label: 'Volume Multiplier', labelJa: '出来高倍率', type: 'number', default: 2, min: 1.5, max: 4, step: 0.5 },
    ],
  },
  {
    id: 'VO004',
    name: 'MFI',
    nameJa: 'MFI（マネーフロー）',
    category: 'volume',
    description: 'Trade on MFI crossing oversold/overbought',
    descriptionJa: 'MFIが売られすぎ/買われすぎを抜けでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'oversold', label: 'Oversold', labelJa: '売られすぎ', type: 'number', default: 20, min: 10, max: 30, step: 5 },
      { name: 'overbought', label: 'Overbought', labelJa: '買われすぎ', type: 'number', default: 80, min: 70, max: 90, step: 5 },
    ],
  },

  // ===== Pattern (5) =====
  {
    id: 'PA001',
    name: 'Golden Cross',
    nameJa: 'ゴールデンクロス',
    category: 'pattern',
    description: 'Classic 50/200 SMA golden cross strategy',
    descriptionJa: '50日MAが200日MAを上抜けで買い',
    parameters: [
      { name: 'shortPeriod', label: 'Short Period', labelJa: '短期期間', type: 'number', default: 50, min: 20, max: 100, step: 10 },
      { name: 'longPeriod', label: 'Long Period', labelJa: '長期期間', type: 'number', default: 200, min: 100, max: 300, step: 20 },
    ],
  },
  {
    id: 'PA002',
    name: 'Dead Cross',
    nameJa: 'デッドクロス',
    category: 'pattern',
    description: 'Exit when 50 SMA crosses below 200 SMA',
    descriptionJa: '50日MAが200日MAを下抜けで売り',
    parameters: [
      { name: 'shortPeriod', label: 'Short Period', labelJa: '短期期間', type: 'number', default: 50, min: 20, max: 100, step: 10 },
      { name: 'longPeriod', label: 'Long Period', labelJa: '長期期間', type: 'number', default: 200, min: 100, max: 300, step: 20 },
    ],
  },
  {
    id: 'PA003',
    name: 'Ichimoku Sanku',
    nameJa: '三役好転',
    category: 'pattern',
    description: 'Ichimoku bullish alignment (Tenkan > Kijun, Price > Cloud, Chikou > Price)',
    descriptionJa: '転換線>基準線、価格>雲、遅行線>価格で買い',
    parameters: [
      { name: 'tenkanPeriod', label: 'Tenkan', labelJa: '転換線', type: 'number', default: 9, min: 5, max: 15, step: 1 },
      { name: 'kijunPeriod', label: 'Kijun', labelJa: '基準線', type: 'number', default: 26, min: 15, max: 40, step: 1 },
      { name: 'senkouPeriod', label: 'Senkou', labelJa: '先行スパン', type: 'number', default: 52, min: 30, max: 80, step: 1 },
    ],
  },
  {
    id: 'PA004',
    name: 'Double Bottom',
    nameJa: 'ダブルボトム',
    category: 'pattern',
    description: 'Detect W-shaped reversal pattern',
    descriptionJa: 'W字パターンを検出してエントリー',
    parameters: [
      { name: 'lookback', label: 'Lookback', labelJa: '検出期間', type: 'number', default: 60, min: 30, max: 120, step: 10 },
      { name: 'tolerance', label: 'Tolerance', labelJa: '許容誤差', type: 'number', default: 0.02, min: 0.01, max: 0.05, step: 0.01 },
    ],
  },
  {
    id: 'PA005',
    name: 'Head and Shoulders',
    nameJa: 'ヘッドアンドショルダー',
    category: 'pattern',
    description: 'Detect head and shoulders reversal pattern',
    descriptionJa: '天井パターンを検出して売り',
    parameters: [
      { name: 'lookback', label: 'Lookback', labelJa: '検出期間', type: 'number', default: 60, min: 30, max: 120, step: 10 },
      { name: 'tolerance', label: 'Tolerance', labelJa: '許容誤差', type: 'number', default: 0.02, min: 0.01, max: 0.05, step: 0.01 },
    ],
  },

  // ===== Composite (9) =====
  {
    id: 'CO001',
    name: 'MACD + RSI Filter',
    nameJa: 'MACD+RSIフィルター',
    category: 'composite',
    description: 'MACD signals filtered by RSI',
    descriptionJa: 'MACDシグナルをRSIでフィルタリング',
    parameters: [
      { name: 'fastPeriod', label: 'MACD Fast', labelJa: 'MACD短期', type: 'number', default: 12, min: 5, max: 20, step: 1 },
      { name: 'slowPeriod', label: 'MACD Slow', labelJa: 'MACD長期', type: 'number', default: 26, min: 15, max: 40, step: 1 },
      { name: 'signalPeriod', label: 'Signal', labelJa: 'シグナル', type: 'number', default: 9, min: 3, max: 15, step: 1 },
      { name: 'rsiPeriod', label: 'RSI Period', labelJa: 'RSI期間', type: 'number', default: 14, min: 7, max: 21, step: 1 },
      { name: 'rsiUpper', label: 'RSI Upper', labelJa: 'RSI上限', type: 'number', default: 70, min: 60, max: 80, step: 5 },
    ],
  },
  {
    id: 'CO002',
    name: 'Trend + Momentum',
    nameJa: 'トレンド+モメンタム',
    category: 'composite',
    description: 'EMA trend with RSI momentum confirmation',
    descriptionJa: 'EMAトレンド+RSIモメンタム確認',
    parameters: [
      { name: 'emaPeriod', label: 'EMA Period', labelJa: 'EMA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'rsiPeriod', label: 'RSI Period', labelJa: 'RSI期間', type: 'number', default: 14, min: 7, max: 21, step: 1 },
      { name: 'rsiThreshold', label: 'RSI Threshold', labelJa: 'RSI閾値', type: 'number', default: 50, min: 40, max: 60, step: 5 },
    ],
  },
  {
    id: 'CO003',
    name: 'Volatility Adjusted',
    nameJa: 'ボラティリティ調整',
    category: 'composite',
    description: 'ATR-based stop loss and take profit',
    descriptionJa: 'ATRベースのストップ/利確',
    parameters: [
      { name: 'atrPeriod', label: 'ATR Period', labelJa: 'ATR期間', type: 'number', default: 14, min: 7, max: 21, step: 1 },
      { name: 'smaPeriod', label: 'SMA Period', labelJa: 'SMA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'atrMultiplier', label: 'ATR Multiplier', labelJa: 'ATR乗数', type: 'number', default: 2, min: 1, max: 4, step: 0.5 },
    ],
  },
  {
    id: 'CO004',
    name: 'MA Ribbon',
    nameJa: '移動平均リボン',
    category: 'composite',
    description: 'Trade when multiple MAs align',
    descriptionJa: '複数MAが整列したらエントリー',
    parameters: [],
  },
  {
    id: 'CO005',
    name: 'High Low Channel',
    nameJa: '高値安値チャネル',
    category: 'composite',
    description: 'Trade on channel breakouts',
    descriptionJa: 'チャネルブレイクでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 60, step: 5 },
    ],
  },
  {
    id: 'CO006',
    name: 'Pivot Points',
    nameJa: 'ピボットポイント',
    category: 'composite',
    description: 'Trade bounces off pivot support/resistance',
    descriptionJa: 'ピボットレベルでの反発でエントリー',
    parameters: [],
  },
  {
    id: 'CO007',
    name: 'Fibonacci Retracement',
    nameJa: 'フィボナッチ',
    category: 'composite',
    description: 'Trade at Fibonacci retracement levels',
    descriptionJa: 'フィボナッチレベルでエントリー',
    parameters: [
      { name: 'lookback', label: 'Lookback', labelJa: '検出期間', type: 'number', default: 50, min: 20, max: 100, step: 10 },
    ],
  },
  {
    id: 'CO008',
    name: 'High Low Breakout',
    nameJa: 'ハイローブレイクアウト',
    category: 'composite',
    description: 'Trade on period high/low breakouts',
    descriptionJa: 'n日高値/安値更新でエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 10, min: 5, max: 30, step: 5 },
    ],
  },
  {
    id: 'CO009',
    name: 'Turtle Trading',
    nameJa: 'タートルズ',
    category: 'composite',
    description: 'Classic Turtle Trading breakout system',
    descriptionJa: 'タートルズのブレイクアウトシステム',
    parameters: [
      { name: 'entryPeriod', label: 'Entry Period', labelJa: 'エントリー期間', type: 'number', default: 20, min: 10, max: 55, step: 5 },
      { name: 'exitPeriod', label: 'Exit Period', labelJa: '出口期間', type: 'number', default: 10, min: 5, max: 20, step: 5 },
      { name: 'atrPeriod', label: 'ATR Period', labelJa: 'ATR期間', type: 'number', default: 20, min: 10, max: 30, step: 5 },
    ],
  },
]

/**
 * Get strategy by ID
 */
export function getStrategy(id: string): Strategy | undefined {
  return strategies.find(s => s.id === id)
}

/**
 * Get strategy info by ID
 */
export function getStrategyInfo(id: string): StrategyInfo | undefined {
  return strategyRegistry.find(s => s.id === id)
}

/**
 * Get strategies by category
 */
export function getStrategiesByCategory(category: StrategyCategory): StrategyInfo[] {
  return strategyRegistry.filter(s => s.category === category)
}

/**
 * Get default parameters for a strategy
 */
export function getDefaultParams(id: string): Record<string, number> {
  const info = getStrategyInfo(id)
  if (!info) return {}
  
  return info.parameters.reduce((acc, param) => {
    acc[param.name] = param.default
    return acc
  }, {} as Record<string, number>)
}
