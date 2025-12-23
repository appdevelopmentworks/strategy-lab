import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import type { OHLCV, Period } from '@/types'

// Period to date range mapping
const periodToDays: Record<Period, number> = {
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
    startDate.setDate(startDate.getDate() - periodToDays[period])

    // Fetch data from Yahoo Finance
    const result = await yahooFinance.historical(ticker, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    })

    // Transform data
    const data: OHLCV[] = result.map(item => ({
      date: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      adjClose: item.adjClose,
    }))

    // Get quote for metadata
    const quote = await yahooFinance.quote(ticker)

    return NextResponse.json({
      success: true,
      data: {
        ticker,
        currency: quote.currency || 'USD',
        name: quote.shortName || quote.longName || ticker,
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
