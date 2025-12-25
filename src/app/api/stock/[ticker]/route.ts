import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import type { OHLCV, Period } from '@/types'

// Suppress deprecation notices
yahooFinance.suppressNotices(['ripHistorical', 'yahooSurvey'])

// Period to date range mapping
const periodToDays: Record<string, number> = {
  '1mo': 30,
  '3mo': 90,
  '6mo': 180,
  '1y': 365,
  '3y': 365 * 3,
  '5y': 365 * 5,
  '10y': 365 * 10,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || '5y') as Period

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    const days = periodToDays[period] || 365 * 5 // Default to 5 years
    startDate.setDate(startDate.getDate() - days)

    // Fetch data from Yahoo Finance using chart() API (v3)
    const result = await yahooFinance.chart(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    })

    // Transform data from chart response
    const data: OHLCV[] = result.quotes
      .filter(item => item.open !== null && item.high !== null && item.low !== null && item.close !== null)
      .map(item => ({
        date: item.date,
        open: item.open!,
        high: item.high!,
        low: item.low!,
        close: item.close!,
        volume: item.volume || 0,
        adjClose: item.adjclose,
      }))

    // Get metadata from chart result
    const meta = result.meta

    return NextResponse.json({
      success: true,
      data: {
        ticker,
        currency: meta.currency || 'USD',
        name: meta.shortName || meta.longName || ticker,
        data,
      },
    })
  } catch (error) {
    console.error('Stock data fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stock data',
        code: 'DATA_FETCH_ERROR',
      },
      { status: 500 }
    )
  }
}
