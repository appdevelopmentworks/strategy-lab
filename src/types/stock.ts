/**
 * Stock Data Types
 */

/** OHLCV (Open, High, Low, Close, Volume) data point */
export interface OHLCV {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjClose?: number
}

/** Stock data with metadata */
export interface StockData {
  ticker: string
  currency: string
  name?: string
  data: OHLCV[]
}

/** Period options for data fetching */
export type Period = '1y' | '3y' | '5y' | '10y'

/** Interval options for data fetching */
export type Interval = '1d' | '1wk' | '1mo'
