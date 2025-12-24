/**
 * Grid Search Optimization API
 */

import { NextRequest, NextResponse } from 'next/server'
import { runGridSearch, getDefaultParameterRanges, estimateCombinations } from '@/lib/optimization'
import type { OHLCV } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      strategyId, 
      stockData, 
      parameterRanges, 
      objective = 'winRate',
      maxCombinations = 5000,
    } = body
    
    if (!strategyId) {
      return NextResponse.json(
        { success: false, error: 'Strategy ID is required' },
        { status: 400 }
      )
    }
    
    if (!stockData || stockData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Stock data is required' },
        { status: 400 }
      )
    }
    
    // Convert date strings to Date objects
    const parsedStockData: OHLCV[] = stockData.map((d: { date: string; open: number; high: number; low: number; close: number; volume: number }) => ({
      ...d,
      date: new Date(d.date),
    }))
    
    // Use provided ranges or get defaults
    const ranges = parameterRanges && parameterRanges.length > 0 
      ? parameterRanges 
      : getDefaultParameterRanges(strategyId)
    
    if (ranges.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No parameters to optimize for this strategy' },
        { status: 400 }
      )
    }
    
    // Estimate combinations
    const estimatedCombinations = estimateCombinations(ranges)
    
    // Run grid search
    const result = runGridSearch({
      strategyId,
      stockData: parsedStockData,
      parameterRanges: ranges,
      objective,
      maxCombinations,
    })
    
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        estimatedCombinations,
      },
    })
  } catch (error) {
    console.error('Grid search failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Grid search failed' },
      { status: 500 }
    )
  }
}
