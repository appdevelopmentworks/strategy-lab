/**
 * Walk-Forward Optimization API
 */

import { NextRequest, NextResponse } from 'next/server'
import { runWalkForward, evaluateOverfitRisk, getWalkForwardRecommendation } from '@/lib/optimization'
import type { OHLCV, OptimizationTarget } from '@/types'

interface WalkForwardRequestBody {
  strategyId: string
  stockData: Array<{
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
  parameterRanges: Array<{
    name: string
    min: number
    max: number
    step: number
  }>
  objective: OptimizationTarget
  windowCount: number
  trainRatio: number
  anchoredStart?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: WalkForwardRequestBody = await request.json()
    
    const {
      strategyId,
      stockData,
      parameterRanges,
      objective,
      windowCount,
      trainRatio,
      anchoredStart,
    } = body
    
    // Validate inputs
    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required' },
        { status: 400 }
      )
    }
    
    if (!stockData || stockData.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Insufficient stock data (minimum 100 data points)' },
        { status: 400 }
      )
    }
    
    if (!parameterRanges || parameterRanges.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Parameter ranges are required' },
        { status: 400 }
      )
    }
    
    // Convert stock data to OHLCV format
    const ohlcvData: OHLCV[] = stockData.map(d => ({
      date: new Date(d.date),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }))
    
    // Run walk-forward optimization
    const result = runWalkForward({
      strategyId,
      stockData: ohlcvData,
      parameterRanges,
      objective,
      windowCount: windowCount || 5,
      trainRatio: trainRatio || 0.7,
      anchoredStart: anchoredStart ?? false,
    })
    
    // Add risk evaluation and recommendation
    const overfitRisk = evaluateOverfitRisk(result)
    const recommendation = getWalkForwardRecommendation(result)
    
    // Convert dates to ISO strings for JSON
    const serializedResult = {
      ...result,
      windows: result.windows.map(w => ({
        ...w,
        trainStart: w.trainStart.toISOString(),
        trainEnd: w.trainEnd.toISOString(),
        testStart: w.testStart.toISOString(),
        testEnd: w.testEnd.toISOString(),
      })),
      overfitRisk,
      recommendation,
    }
    
    return NextResponse.json({
      success: true,
      data: serializedResult,
    })
  } catch (error) {
    console.error('Walk-forward optimization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Walk-forward optimization failed' 
      },
      { status: 500 }
    )
  }
}
