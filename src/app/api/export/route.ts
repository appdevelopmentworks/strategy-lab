import { NextRequest, NextResponse } from 'next/server'
import type { BacktestResult, Signal, Trade } from '@/types'

interface ExportRequest {
  format: 'csv' | 'json'
  data: BacktestResult
  includeSignals?: boolean
  includeTrades?: boolean
  includeEquity?: boolean
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}

function signalsToCsv(signals: Signal[]): string {
  const header = 'Date,Type,Price,Indicator Values'
  const rows = signals.map(s => {
    const indicatorStr = s.indicatorValues 
      ? Object.entries(s.indicatorValues).map(([k, v]) => `${k}:${v.toFixed(2)}`).join(';')
      : ''
    return `${formatDate(s.date)},${s.type},${s.price.toFixed(2)},${indicatorStr}`
  })
  return [header, ...rows].join('\n')
}

function tradesToCsv(trades: Trade[]): string {
  const header = 'Entry Date,Entry Price,Exit Date,Exit Price,Type,Profit %,Profit Amount,Holding Days'
  const rows = trades.map(t => 
    `${formatDate(t.entryDate)},${t.entryPrice.toFixed(2)},${formatDate(t.exitDate)},${t.exitPrice.toFixed(2)},${t.type},${t.profitPct.toFixed(2)},${t.profitAmount.toFixed(2)},${t.holdingDays}`
  )
  return [header, ...rows].join('\n')
}

function metricsToCsv(result: BacktestResult): string {
  const { metrics } = result
  return `Strategy,${result.strategyNameJa} (${result.strategyId})
Ticker,${result.ticker}
Period,${result.period}

Win Rate,${metrics.winRate.toFixed(2)}%
Total Trades,${metrics.totalTrades}
Winning Trades,${metrics.winningTrades}
Losing Trades,${metrics.losingTrades}
Average Win,${metrics.avgWin.toFixed(2)}%
Average Loss,${metrics.avgLoss.toFixed(2)}%
Total Return,${metrics.totalReturn.toFixed(2)}%
Profit Factor,${metrics.profitFactor.toFixed(2)}
Max Drawdown,${metrics.maxDrawdown.toFixed(2)}%
Sharpe Ratio,${metrics.sharpeRatio.toFixed(2)}
Max Consecutive Wins,${metrics.maxConsecutiveWins}
Max Consecutive Losses,${metrics.maxConsecutiveLosses}
Average Holding Period,${metrics.avgHoldingPeriod.toFixed(1)} days`
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { format, data, includeSignals = true, includeTrades = true } = body

    if (format === 'json') {
      const exportData = {
        meta: {
          strategyId: data.strategyId,
          strategyName: data.strategyName,
          strategyNameJa: data.strategyNameJa,
          ticker: data.ticker,
          period: data.period,
          parameters: data.parameters,
          exportedAt: new Date().toISOString(),
        },
        metrics: data.metrics,
        signals: includeSignals ? data.signals : undefined,
        trades: includeTrades ? data.trades : undefined,
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${data.strategyId}_${data.ticker}_export.json"`,
        },
      })
    }

    // CSV format
    let csvContent = metricsToCsv(data)
    
    if (includeSignals && data.signals.length > 0) {
      csvContent += '\n\n=== SIGNALS ===\n' + signalsToCsv(data.signals)
    }
    
    if (includeTrades && data.trades.length > 0) {
      csvContent += '\n\n=== TRADES ===\n' + tradesToCsv(data.trades)
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${data.strategyId}_${data.ticker}_export.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    )
  }
}
