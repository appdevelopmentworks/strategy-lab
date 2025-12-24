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

function formatValue(value: number, decimals: number = 2): string {
  if (value === Infinity) return 'Infinity'
  if (value === -Infinity) return '-Infinity'
  if (isNaN(value)) return 'N/A'
  return value.toFixed(decimals)
}

function metricsToCsv(result: BacktestResult): string {
  const { metrics } = result
  return `=== STRATEGY INFO ===
Strategy,${result.strategyNameJa} (${result.strategyId})
Ticker,${result.ticker}
Period,${result.period}

=== BASIC METRICS ===
Win Rate,${formatValue(metrics.winRate)}%
Total Trades,${metrics.totalTrades}
Winning Trades,${metrics.winningTrades}
Losing Trades,${metrics.losingTrades}
Average Win,${formatValue(metrics.avgWin)}%
Average Loss,${formatValue(metrics.avgLoss)}%
Total Return,${formatValue(metrics.totalReturn)}%
Profit Factor,${formatValue(metrics.profitFactor)}
Max Drawdown,${formatValue(metrics.maxDrawdown)}%
Sharpe Ratio,${formatValue(metrics.sharpeRatio)}
Max Consecutive Wins,${metrics.maxConsecutiveWins}
Max Consecutive Losses,${metrics.maxConsecutiveLosses}
Average Holding Period,${formatValue(metrics.avgHoldingPeriod, 1)} days

=== MONEY MANAGEMENT METRICS ===
Expectancy (per trade),${formatValue(metrics.expectancy)}%
Payoff Ratio,${formatValue(metrics.payoffRatio)}
Recovery Factor,${formatValue(metrics.recoveryFactor)}
Kelly Criterion,${formatValue(metrics.kellyPercent)}%
Daily Volatility,${formatValue(metrics.dailyVolatility)}%
Average ATR %,${formatValue(metrics.avgATRPercent)}%
CAGR,${formatValue(metrics.cagr)}%
Calmar Ratio,${formatValue(metrics.calmarRatio)}
Risk of Ruin (est),${formatValue(metrics.riskOfRuin)}%`
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
        metrics: {
          // Basic metrics
          winRate: data.metrics.winRate,
          totalTrades: data.metrics.totalTrades,
          winningTrades: data.metrics.winningTrades,
          losingTrades: data.metrics.losingTrades,
          avgWin: data.metrics.avgWin,
          avgLoss: data.metrics.avgLoss,
          totalReturn: data.metrics.totalReturn,
          profitFactor: data.metrics.profitFactor,
          maxDrawdown: data.metrics.maxDrawdown,
          sharpeRatio: data.metrics.sharpeRatio,
          maxConsecutiveWins: data.metrics.maxConsecutiveWins,
          maxConsecutiveLosses: data.metrics.maxConsecutiveLosses,
          avgHoldingPeriod: data.metrics.avgHoldingPeriod,
          grossProfit: data.metrics.grossProfit,
          grossLoss: data.metrics.grossLoss,
          // Money management metrics
          expectancy: data.metrics.expectancy,
          payoffRatio: data.metrics.payoffRatio,
          recoveryFactor: data.metrics.recoveryFactor,
          kellyPercent: data.metrics.kellyPercent,
          dailyVolatility: data.metrics.dailyVolatility,
          avgATRPercent: data.metrics.avgATRPercent,
          cagr: data.metrics.cagr,
          calmarRatio: data.metrics.calmarRatio,
          riskOfRuin: data.metrics.riskOfRuin,
        },
        // Separate money management section for easy access
        moneyManagement: {
          expectancy: data.metrics.expectancy,
          payoffRatio: data.metrics.payoffRatio,
          maxDrawdown: data.metrics.maxDrawdown,
          maxConsecutiveLosses: data.metrics.maxConsecutiveLosses,
          recoveryFactor: data.metrics.recoveryFactor,
          kellyPercent: data.metrics.kellyPercent,
          dailyVolatility: data.metrics.dailyVolatility,
          avgATRPercent: data.metrics.avgATRPercent,
          cagr: data.metrics.cagr,
          calmarRatio: data.metrics.calmarRatio,
          riskOfRuin: data.metrics.riskOfRuin,
        },
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
