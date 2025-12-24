/**
 * Strategy Types
 */

/** Strategy category */
export type StrategyCategory =
  | 'trend-following'      // トレンドフォロー
  | 'momentum'             // モメンタム
  | 'breakout'             // ブレイクアウト
  | 'mean-reversion'       // ミーンリバーサル
  | 'volume'               // ボリューム
  | 'pattern'              // パターン認識
  | 'composite'            // 複合
  | 'calendar'             // カレンダー（曜日・月初月末・固定保有）

/** Parameter definition for a strategy */
export interface ParameterDefinition {
  name: string
  label: string
  labelJa: string
  type: 'number'
  default: number
  min: number
  max: number
  step: number
  description?: string
}

/** Strategy metadata */
export interface StrategyInfo {
  id: string
  name: string
  nameJa: string
  category: StrategyCategory
  description: string
  descriptionJa: string
  parameters: ParameterDefinition[]
}

/** Strategy parameters (runtime values) */
export type StrategyParams = Record<string, number>

/** Signal type */
export type SignalType = 'BUY' | 'SELL' | 'HOLD'

/** Trading signal */
export interface Signal {
  date: Date
  type: SignalType
  price: number
  indicatorValues?: Record<string, number>
}

/** Trade record */
export interface Trade {
  entryDate: Date
  entryPrice: number
  exitDate: Date
  exitPrice: number
  type: 'LONG' | 'SHORT'
  profitPct: number
  profitAmount: number
  holdingDays: number
}
