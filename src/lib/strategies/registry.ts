/**
 * Strategy Registry
 * 
 * Central registry for all 62 trading strategies with metadata and definitions.
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
import { 
  DMIStrategy, 
  KAMAStrategy, 
  HeikenAshiStrategy, 
  TripleMAStrategy,
  AroonStrategy,
  ChoppinessStrategy,
} from './trend-following/extended'

// Momentum strategies
import { RSIcontrarian } from './momentum/rsi-contrarian'
import { RSItrend } from './momentum/rsi-trend'
import { StochasticStrategy } from './momentum/stochastic'
import { CCIStrategy } from './momentum/cci'
import { WilliamsRStrategy } from './momentum/williams-r'
import { ROCStrategy } from './momentum/roc'
import { MomentumStrategy } from './momentum/momentum'
import { RCIStrategy } from './momentum/rci'
import { TRIXStrategy, DEMAStrategy, ForceIndexStrategy } from './momentum/extended'

// Breakout strategies
import { BollingerBreakout } from './breakout/bollinger-breakout'
import { DonchianBreakout } from './breakout/donchian-breakout'
import { KeltnerBreakout } from './breakout/keltner-breakout'
import { Week52HighBreakout } from './breakout/week52-high'
import { ATRBreakout } from './breakout/atr-breakout'
import { 
  BollingerSqueezeStrategy, 
  ATRTrailingStopStrategy, 
  ChandelierExitStrategy,
  GapStrategy,
  VolatilityBreakoutStrategy,
} from './breakout/extended'

// Mean Reversion strategies
import { BollingerReversion } from './mean-reversion/bollinger-reversion'
import { RSIDivergence } from './mean-reversion/rsi-divergence'
import { MADeviation } from './mean-reversion/ma-deviation'
import { ZScoreStrategy } from './mean-reversion/zscore'
import { EnvelopeStrategy } from './mean-reversion/extended'

// Volume strategies
import { OBVStrategy } from './volume/obv'
import { MFIStrategy } from './volume/mfi'
import { VWAPReversal, VolumeBreakout } from './volume/vwap-volume'
import { CMFStrategy, VolumeSpikeStrategy, VWMAStrategy } from './volume/extended'

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
import { SeasonalityStrategy, WeeklyPivotStrategy } from './composite/extended'

// Calendar strategies
import { calendarStrategies } from './calendar'

/**
 * All registered strategies (72 total)
 */
export const strategies: Strategy[] = [
  // Trend Following (13)
  SMAcrossover,
  EMAcrossover,
  MACDsignal,
  ADXtrend,
  ParabolicSARStrategy,
  SuperTrendStrategy,
  IchimokuCloudBreak,
  DMIStrategy,
  KAMAStrategy,
  HeikenAshiStrategy,
  TripleMAStrategy,
  AroonStrategy,
  ChoppinessStrategy,
  // Momentum (11)
  RSIcontrarian,
  RSItrend,
  StochasticStrategy,
  CCIStrategy,
  WilliamsRStrategy,
  ROCStrategy,
  MomentumStrategy,
  RCIStrategy,
  TRIXStrategy,
  DEMAStrategy,
  ForceIndexStrategy,
  // Breakout (10)
  BollingerBreakout,
  DonchianBreakout,
  KeltnerBreakout,
  Week52HighBreakout,
  ATRBreakout,
  BollingerSqueezeStrategy,
  ATRTrailingStopStrategy,
  ChandelierExitStrategy,
  GapStrategy,
  VolatilityBreakoutStrategy,
  // Mean Reversion (5)
  BollingerReversion,
  RSIDivergence,
  MADeviation,
  ZScoreStrategy,
  EnvelopeStrategy,
  // Volume (7)
  OBVStrategy,
  MFIStrategy,
  VWAPReversal,
  VolumeBreakout,
  CMFStrategy,
  VolumeSpikeStrategy,
  VWMAStrategy,
  // Pattern (5)
  GoldenCross,
  DeadCross,
  IchimokuSanku,
  DoubleBottom,
  HeadAndShoulders,
  // Composite (11)
  MACDRSIStrategy,
  TurtleStrategy,
  TrendMomentum,
  VolatilityAdjusted,
  MARibbon,
  HighLowChannel,
  PivotPointsStrategy,
  FibonacciStrategy,
  HighLowBreakout,
  SeasonalityStrategy,
  WeeklyPivotStrategy,
  // Calendar (10)
  ...calendarStrategies,
]

/**
 * Strategy metadata registry
 */
export const strategyRegistry: StrategyInfo[] = [
  // ===== Trend Following (13) =====
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
  {
    id: 'TF008',
    name: 'DMI',
    nameJa: 'DMI（方向性指数）',
    category: 'trend-following',
    description: '+DI and -DI crossover with ADX filter',
    descriptionJa: '+DIと-DIのクロスでADXフィルター付きエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'adxThreshold', label: 'ADX Threshold', labelJa: 'ADX閾値', type: 'number', default: 25, min: 15, max: 40, step: 5 },
    ],
  },
  {
    id: 'TF009',
    name: 'KAMA',
    nameJa: 'KAMA（適応型MA）',
    category: 'trend-following',
    description: 'Kaufman Adaptive Moving Average crossover',
    descriptionJa: 'カウフマン適応型移動平均のクロス',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 10, min: 5, max: 20, step: 1 },
      { name: 'fastSC', label: 'Fast SC', labelJa: '高速SC', type: 'number', default: 2, min: 2, max: 5, step: 1 },
      { name: 'slowSC', label: 'Slow SC', labelJa: '低速SC', type: 'number', default: 30, min: 20, max: 50, step: 5 },
    ],
  },
  {
    id: 'TF010',
    name: 'Heiken Ashi',
    nameJa: '平均足',
    category: 'trend-following',
    description: 'Trade on consecutive Heiken Ashi candles',
    descriptionJa: '平均足の連続陽線/陰線でエントリー',
    parameters: [
      { name: 'consecutiveCandles', label: 'Consecutive Candles', labelJa: '連続本数', type: 'number', default: 2, min: 2, max: 5, step: 1 },
    ],
  },
  {
    id: 'TF011',
    name: 'Triple MA',
    nameJa: 'トリプルMA',
    category: 'trend-following',
    description: 'Three MA alignment for strong trend',
    descriptionJa: '3本のMAが整列したら強いトレンド',
    parameters: [
      { name: 'shortPeriod', label: 'Short', labelJa: '短期', type: 'number', default: 5, min: 3, max: 10, step: 1 },
      { name: 'mediumPeriod', label: 'Medium', labelJa: '中期', type: 'number', default: 20, min: 10, max: 30, step: 5 },
      { name: 'longPeriod', label: 'Long', labelJa: '長期', type: 'number', default: 50, min: 30, max: 100, step: 10 },
    ],
  },
  {
    id: 'TF012',
    name: 'Aroon',
    nameJa: 'アルーン',
    category: 'trend-following',
    description: 'Aroon Up/Down crossover strategy',
    descriptionJa: 'アルーン指標のクロスでエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 25, min: 10, max: 50, step: 5 },
      { name: 'threshold', label: 'Threshold', labelJa: '閾値', type: 'number', default: 50, min: 30, max: 70, step: 10 },
    ],
  },
  {
    id: 'TF013',
    name: 'Choppiness Index',
    nameJa: 'チョピネス指数',
    category: 'trend-following',
    description: 'Trade when market is trending (low choppiness)',
    descriptionJa: 'チョピネスが低い時（トレンド発生時）にエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'trendThreshold', label: 'Trend Threshold', labelJa: 'トレンド閾値', type: 'number', default: 38.2, min: 30, max: 50, step: 2 },
      { name: 'maPeriod', label: 'MA Period', labelJa: 'MA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
    ],
  },

  // ===== Momentum (11) =====
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
  {
    id: 'MO009',
    name: 'TRIX',
    nameJa: 'TRIX',
    category: 'momentum',
    description: 'Triple EMA oscillator crossover',
    descriptionJa: 'トリプルEMAオシレーターのシグナルクロス',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
    ],
  },
  {
    id: 'MO010',
    name: 'DEMA Cross',
    nameJa: 'DEMAクロス',
    category: 'momentum',
    description: 'Double EMA crossover for faster signals',
    descriptionJa: 'ダブルEMAのクロスで高速シグナル',
    parameters: [
      { name: 'shortPeriod', label: 'Short Period', labelJa: '短期期間', type: 'number', default: 12, min: 5, max: 20, step: 1 },
      { name: 'longPeriod', label: 'Long Period', labelJa: '長期期間', type: 'number', default: 26, min: 15, max: 50, step: 1 },
    ],
  },
  {
    id: 'MO011',
    name: 'Force Index',
    nameJa: 'フォースインデックス',
    category: 'momentum',
    description: 'Elder Force Index zero line crossover',
    descriptionJa: 'エルダーのフォースインデックスのゼロラインクロス',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 13, min: 5, max: 21, step: 1 },
    ],
  },

  // ===== Breakout (10) =====
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
  {
    id: 'BO006',
    name: 'Bollinger Squeeze',
    nameJa: 'ボリンジャースクイーズ',
    category: 'breakout',
    description: 'Trade breakout after volatility squeeze',
    descriptionJa: 'ボラティリティ収縮後のブレイクアウト',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'stdDev', label: 'Std Dev', labelJa: '標準偏差', type: 'number', default: 2, min: 1, max: 3, step: 0.5 },
      { name: 'squeezeLookback', label: 'Squeeze Lookback', labelJa: 'スクイーズ期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
    ],
  },
  {
    id: 'BO007',
    name: 'ATR Trailing Stop',
    nameJa: 'ATRトレーリングストップ',
    category: 'breakout',
    description: 'ATR-based trailing stop strategy',
    descriptionJa: 'ATRベースのトレーリングストップ',
    parameters: [
      { name: 'atrPeriod', label: 'ATR Period', labelJa: 'ATR期間', type: 'number', default: 14, min: 7, max: 28, step: 1 },
      { name: 'multiplier', label: 'Multiplier', labelJa: '乗数', type: 'number', default: 3, min: 1, max: 5, step: 0.5 },
      { name: 'maPeriod', label: 'MA Period', labelJa: 'MA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
    ],
  },
  {
    id: 'BO008',
    name: 'Chandelier Exit',
    nameJa: 'シャンデリアエグジット',
    category: 'breakout',
    description: 'Chandelier exit trailing stop',
    descriptionJa: 'シャンデリアエグジットのトレーリングストップ',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 22, min: 10, max: 40, step: 2 },
      { name: 'multiplier', label: 'Multiplier', labelJa: '乗数', type: 'number', default: 3, min: 1, max: 5, step: 0.5 },
    ],
  },
  {
    id: 'BO009',
    name: 'Gap',
    nameJa: 'ギャップ戦略',
    category: 'breakout',
    description: 'Trade on price gaps',
    descriptionJa: 'ギャップ発生時にエントリー',
    parameters: [
      { name: 'gapThreshold', label: 'Gap Threshold %', labelJa: 'ギャップ閾値%', type: 'number', default: 2, min: 1, max: 5, step: 0.5 },
      { name: 'holdDays', label: 'Hold Days', labelJa: '保有日数', type: 'number', default: 3, min: 1, max: 10, step: 1 },
    ],
  },
  {
    id: 'BO010',
    name: 'Volatility Breakout',
    nameJa: 'ボラティリティブレイクアウト',
    category: 'breakout',
    description: 'Trade on abnormal volatility expansion',
    descriptionJa: '異常なボラティリティ拡大時にエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'multiplier', label: 'Multiplier', labelJa: '乗数', type: 'number', default: 2, min: 1.5, max: 4, step: 0.5 },
      { name: 'holdDays', label: 'Hold Days', labelJa: '保有日数', type: 'number', default: 3, min: 1, max: 10, step: 1 },
    ],
  },

  // ===== Mean Reversion (5) =====
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
  {
    id: 'MR005',
    name: 'Envelope',
    nameJa: 'エンベロープ',
    category: 'mean-reversion',
    description: 'Trade at envelope bands',
    descriptionJa: 'エンベロープバンドで逆張りエントリー',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 25, min: 10, max: 50, step: 5 },
      { name: 'percentage', label: 'Percentage', labelJa: '乖離率%', type: 'number', default: 2.5, min: 1, max: 5, step: 0.5 },
    ],
  },

  // ===== Volume (7) =====
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
  {
    id: 'VO005',
    name: 'CMF',
    nameJa: 'CMF（チャイキンマネーフロー）',
    category: 'volume',
    description: 'Chaikin Money Flow crossover',
    descriptionJa: 'チャイキンマネーフローの閾値クロス',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 40, step: 5 },
      { name: 'buyThreshold', label: 'Buy Threshold', labelJa: '買い閾値', type: 'number', default: 0.05, min: 0.01, max: 0.15, step: 0.01 },
      { name: 'sellThreshold', label: 'Sell Threshold', labelJa: '売り閾値', type: 'number', default: -0.05, min: -0.15, max: -0.01, step: 0.01 },
    ],
  },
  {
    id: 'VO006',
    name: 'Volume Spike',
    nameJa: '出来高スパイク',
    category: 'volume',
    description: 'Trade on volume spikes',
    descriptionJa: '出来高スパイク発生時にエントリー',
    parameters: [
      { name: 'maPeriod', label: 'MA Period', labelJa: 'MA期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
      { name: 'spikeMultiplier', label: 'Spike Multiplier', labelJa: 'スパイク倍率', type: 'number', default: 2.5, min: 1.5, max: 5, step: 0.5 },
    ],
  },
  {
    id: 'VO007',
    name: 'VWMA',
    nameJa: 'VWMA（出来高加重MA）',
    category: 'volume',
    description: 'Volume Weighted Moving Average crossover',
    descriptionJa: '出来高加重移動平均のクロス',
    parameters: [
      { name: 'period', label: 'Period', labelJa: '期間', type: 'number', default: 20, min: 10, max: 50, step: 5 },
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
    description: 'Ichimoku bullish alignment',
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

  // ===== Composite (11) =====
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
  {
    id: 'CO010',
    name: 'Seasonality',
    nameJa: '季節性戦略',
    category: 'composite',
    description: 'Trade based on monthly seasonality patterns',
    descriptionJa: '月別季節性パターン（Sell in May等）',
    parameters: [],
  },
  {
    id: 'CO011',
    name: 'Weekly Pivot Points',
    nameJa: '週足ピボット',
    category: 'composite',
    description: 'Weekly pivot point strategy',
    descriptionJa: '週足ベースのピボットポイント',
    parameters: [
      { name: 'threshold', label: 'Threshold', labelJa: '閾値', type: 'number', default: 0.02, min: 0.01, max: 0.05, step: 0.01 },
    ],
  },

  // ===== Calendar (10) =====
  {
    id: 'CA001',
    name: 'Monday Buy / Friday Sell',
    nameJa: '月曜買い・金曜売り',
    category: 'calendar',
    description: 'Buy on Monday, sell on Friday',
    descriptionJa: '月曜日に買い、金曜日に売り（週内トレード）',
    parameters: [],
  },
  {
    id: 'CA002',
    name: 'Friday Buy / Monday Sell',
    nameJa: '金曜買い・月曜売り',
    category: 'calendar',
    description: 'Buy on Friday, sell on Monday (weekend effect)',
    descriptionJa: '金曜日に買い、月曜日に売り（週末効果）',
    parameters: [],
  },
  {
    id: 'CA003',
    name: 'Tuesday Buy / Thursday Sell',
    nameJa: '火曜買い・木曜売り',
    category: 'calendar',
    description: 'Mid-week trading strategy',
    descriptionJa: '火曜日に買い、木曜日に売り（週中トレード）',
    parameters: [],
  },
  {
    id: 'CA004',
    name: 'Month Start Buy / End Sell',
    nameJa: '月初買い・月末売り',
    category: 'calendar',
    description: 'Buy at month start, sell at month end',
    descriptionJa: '月初に買い、月末に売り',
    parameters: [],
  },
  {
    id: 'CA005',
    name: 'Month End Buy / Start Sell',
    nameJa: '月末買い・月初売り',
    category: 'calendar',
    description: 'Turn of month effect strategy',
    descriptionJa: '月末に買い、月初に売り（月替わり効果）',
    parameters: [],
  },
  {
    id: 'FH001',
    name: '1-Day Hold',
    nameJa: '1日保有',
    category: 'calendar',
    description: 'Fixed 1-day holding period',
    descriptionJa: '固定1日間保有して売り',
    parameters: [
      { name: 'holdingDays', label: 'Holding Days', labelJa: '保有日数', type: 'number', default: 1, min: 1, max: 60, step: 1 },
    ],
  },
  {
    id: 'FH002',
    name: '3-Day Hold',
    nameJa: '3日保有',
    category: 'calendar',
    description: 'Fixed 3-day holding period',
    descriptionJa: '固定3日間保有して売り',
    parameters: [
      { name: 'holdingDays', label: 'Holding Days', labelJa: '保有日数', type: 'number', default: 3, min: 1, max: 60, step: 1 },
    ],
  },
  {
    id: 'FH003',
    name: '5-Day Hold',
    nameJa: '5日保有',
    category: 'calendar',
    description: 'Fixed 5-day holding period (weekly)',
    descriptionJa: '固定5日間保有して売り（週間）',
    parameters: [
      { name: 'holdingDays', label: 'Holding Days', labelJa: '保有日数', type: 'number', default: 5, min: 1, max: 60, step: 1 },
    ],
  },
  {
    id: 'FH004',
    name: '10-Day Hold',
    nameJa: '10日保有',
    category: 'calendar',
    description: 'Fixed 10-day holding period (2 weeks)',
    descriptionJa: '固定10日間保有して売り（2週間）',
    parameters: [
      { name: 'holdingDays', label: 'Holding Days', labelJa: '保有日数', type: 'number', default: 10, min: 1, max: 60, step: 1 },
    ],
  },
  {
    id: 'FH005',
    name: '20-Day Hold',
    nameJa: '20日保有',
    category: 'calendar',
    description: 'Fixed 20-day holding period (monthly)',
    descriptionJa: '固定20日間保有して売り（月間）',
    parameters: [
      { name: 'holdingDays', label: 'Holding Days', labelJa: '保有日数', type: 'number', default: 20, min: 1, max: 60, step: 1 },
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
