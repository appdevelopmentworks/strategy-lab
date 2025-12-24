/**
 * Monte Carlo Simulation API
 */

import { NextRequest, NextResponse } from 'next/server'
import { runMonteCarloSimulation, runBootstrapSimulation } from '@/lib/optimization'
import type { Trade } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      trades, 
      initialCapital = 1000000,
      simulations = 1000,
      confidenceLevel = 0.95,
      method = 'shuffle', // 'shuffle' or 'bootstrap'
    } = body
    
    if (!trades || trades.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Trades data is required' },
        { status: 400 }
      )
    }
    
    // Convert date strings to Date objects
    const parsedTrades: Trade[] = trades.map((t: { entryDate: string; exitDate: string; entryPrice: number; exitPrice: number; type: string; profitPct: number; profitAmount: number; holdingDays: number }) => ({
      ...t,
      entryDate: new Date(t.entryDate),
      exitDate: new Date(t.exitDate),
    }))
    
    // Run simulation based on method
    const result = method === 'bootstrap'
      ? runBootstrapSimulation({
          trades: parsedTrades,
          initialCapital,
          simulations,
          confidenceLevel,
        })
      : runMonteCarloSimulation({
          trades: parsedTrades,
          initialCapital,
          simulations,
          confidenceLevel,
        })
    
    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Monte Carlo simulation failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Simulation failed' },
      { status: 500 }
    )
  }
}
