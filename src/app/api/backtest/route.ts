import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { strategies, strategyRegistry, getDefaultParams } from '@/lib/strategies/registry'
import { runBacktest } from '@/lib/backtest/engine'
import type { OHLCV, Period, BacktestResult } from '@/types'

// Period to date range mapping
const periodToDays: Record<Period, number> = {
  '1y': 365,
  '3y': 365 * 3,
  '5y': 365 * 5,
  '10y': 365 * 10,
}

interface BacktestAllRequest {
  tickers: string[]
  period: Period
  minTrades?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: BacktestAllRequest = await request.json()
    const { tickers, period, minTrades = 0 } = body

    if (!tickers || tickers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tickers provided', code: 'INVALID_TICKER' },
        { status: 400 }
      )
    }

    if (tickers.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 tickers allowed', code: 'INVALID_TICKER' },
        { status: 400 }
      )
    }

    const results: { ticker: string; results: BacktestResult[] }[] = []

    for (const ticker of tickers) {
      // Fetch stock data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodToDays[period])

      let stockData: OHLCV[]
      try {
        const historical = await yahooFinance.historical(ticker, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
        })

        stockData = historical.map(item => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
          adjClose: item.adjClose,
        }))
      } catch (error) {
        console.error(`Failed to fetch data for ${ticker}:`, error)
        continue
      }

      if (stockData.length < 200) {
        console.warn(`Insufficient data for ${ticker}: ${stockData.length} days`)
        continue
      }

      // Run backtest for each strategy
      const tickerResults: BacktestResult[] = []

      for (const strategy of strategies) {
        const info = strategyRegistry.find(s => s.id === strategy.id)
        if (!info) continue

        const params = getDefaultParams(strategy.id)
        
        try {
          const { signals, trades, equity, metrics } = runBacktest(
            strategy,
            stockData,
            params
          )

          // Apply minimum trades filter
          if (metrics.totalTrades < minTrades) continue

          tickerResults.push({
            strategyId: strategy.id,
            strategyName: strategy.name,
            strategyNameJa: info.nameJa,
            category: info.category,
            ticker,
            period,
            parameters: params,
            metrics,
            signals,
            trades,
            equity,
          })
        } catch (error) {
          console.error(`Backtest failed for ${strategy.id} on ${ticker}:`, error)
        }
      }

      results.push({ ticker, results: tickerResults })
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('Backtest error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Backtest failed',
        code: 'CALCULATION_ERROR',
      },
      { status: 500 }
    )
  }
}
