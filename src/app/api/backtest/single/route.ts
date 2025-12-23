import { NextRequest, NextResponse } from 'next/server'
import { getStrategy, getStrategyInfo } from '@/lib/strategies/registry'
import { runBacktest } from '@/lib/backtest/engine'
import type { OHLCV, StrategyParams } from '@/types'

interface SingleBacktestRequest {
  strategyId: string
  stockData: OHLCV[]
  parameters: StrategyParams
}

export async function POST(request: NextRequest) {
  try {
    const body: SingleBacktestRequest = await request.json()
    const { strategyId, stockData, parameters } = body

    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required', code: 'INVALID_STRATEGY' },
        { status: 400 }
      )
    }

    if (!stockData || stockData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stock data is required', code: 'INVALID_DATA' },
        { status: 400 }
      )
    }

    const strategy = getStrategy(strategyId)
    const strategyInfo = getStrategyInfo(strategyId)

    if (!strategy || !strategyInfo) {
      return NextResponse.json(
        { success: false, error: 'Strategy not found', code: 'INVALID_STRATEGY' },
        { status: 404 }
      )
    }

    // Convert date strings to Date objects if needed
    const processedData: OHLCV[] = stockData.map(d => ({
      ...d,
      date: typeof d.date === 'string' ? new Date(d.date) : d.date,
    }))

    // Run backtest with custom parameters
    const { signals, trades, equity, metrics } = runBacktest(
      strategy,
      processedData,
      parameters
    )

    return NextResponse.json({
      success: true,
      data: {
        strategyId,
        strategyName: strategy.name,
        strategyNameJa: strategyInfo.nameJa,
        parameters,
        metrics,
        signals: signals.map(s => ({
          ...s,
          date: s.date.toISOString(),
        })),
        trades: trades.map(t => ({
          ...t,
          entryDate: t.entryDate.toISOString(),
          exitDate: t.exitDate.toISOString(),
        })),
        equity: equity.map(e => ({
          ...e,
          date: e.date.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Single backtest error:', error)
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
