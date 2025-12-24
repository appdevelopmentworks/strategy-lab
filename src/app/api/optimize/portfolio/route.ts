/**
 * Portfolio Optimization API
 */

import { NextRequest, NextResponse } from 'next/server'
import { runPortfolioOptimization, getMethodDescription } from '@/lib/optimization'
import type { PortfolioOptMethod } from '@/lib/optimization'
import type { BacktestMetrics, EquityPoint } from '@/types'

interface PortfolioAssetInput {
  id: string
  ticker: string
  strategyId: string
  strategyName: string
  metrics: BacktestMetrics
  equityCurve: Array<{
    date: string
    equity: number
    drawdown: number
  }>
  returns?: number[]
}

interface PortfolioRequestBody {
  assets: PortfolioAssetInput[]
  method: PortfolioOptMethod
  riskFreeRate?: number
  constraints?: {
    minWeight?: number
    maxWeight?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: PortfolioRequestBody = await request.json()
    
    const { assets, method, riskFreeRate, constraints } = body
    
    // Validate inputs
    if (!assets || assets.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 assets are required' },
        { status: 400 }
      )
    }
    
    if (!method) {
      return NextResponse.json(
        { success: false, error: 'Optimization method is required' },
        { status: 400 }
      )
    }
    
    // Convert equity curves to proper format
    const processedAssets = assets.map(asset => ({
      id: asset.id,
      ticker: asset.ticker,
      strategyId: asset.strategyId,
      strategyName: asset.strategyName,
      metrics: asset.metrics,
      equityCurve: asset.equityCurve.map(e => ({
        date: new Date(e.date),
        equity: e.equity,
        drawdown: e.drawdown,
      })) as EquityPoint[],
      returns: asset.returns || [],
    }))
    
    // Run portfolio optimization
    const result = runPortfolioOptimization({
      assets: processedAssets,
      method,
      riskFreeRate: riskFreeRate ?? 0.02,
      constraints,
    })
    
    // Add method description
    const methodDescription = getMethodDescription(method)
    
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        methodDescription,
      },
    })
  } catch (error) {
    console.error('Portfolio optimization error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Portfolio optimization failed' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Return available methods
 */
export async function GET() {
  const methods: Array<{ value: PortfolioOptMethod; label: string; description: string }> = [
    { value: 'equal', label: '均等配分', description: '全資産に同じウェイトを配分' },
    { value: 'risk_parity', label: 'リスクパリティ', description: '各資産のリスク貢献度を均等化' },
    { value: 'max_sharpe', label: '最大シャープ', description: 'リスク調整後リターンを最大化' },
    { value: 'min_variance', label: '最小分散', description: 'ポートフォリオ全体のボラティリティを最小化' },
    { value: 'max_return', label: '最大リターン', description: '期待リターンを最大化（高リスク）' },
  ]
  
  return NextResponse.json({
    success: true,
    data: methods,
  })
}
