'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Trophy, Target } from 'lucide-react'
import type { BacktestResult } from '@/types'

interface MultiTickerComparisonProps {
  results: BacktestResult[]
}

interface TickerSummary {
  ticker: string
  bestStrategy: string
  bestStrategyId: string
  bestWinRate: number
  bestReturn: number
  avgWinRate: number
  avgReturn: number
  totalStrategies: number
  profitableStrategies: number
}

interface StrategyPerformance {
  strategyId: string
  strategyName: string
  tickers: { ticker: string; winRate: number; totalReturn: number }[]
  avgWinRate: number
  avgReturn: number
  consistency: number // How consistent across tickers
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function MultiTickerComparison({ results }: MultiTickerComparisonProps) {
  // Group results by ticker
  const tickerSummaries = useMemo((): TickerSummary[] => {
    const tickerMap = new Map<string, BacktestResult[]>()
    
    results.forEach(r => {
      const existing = tickerMap.get(r.ticker) || []
      existing.push(r)
      tickerMap.set(r.ticker, existing)
    })
    
    return Array.from(tickerMap.entries()).map(([ticker, tickerResults]) => {
      const sorted = [...tickerResults].sort((a, b) => b.metrics.winRate - a.metrics.winRate)
      const best = sorted[0]
      
      const avgWinRate = tickerResults.reduce((sum, r) => sum + r.metrics.winRate, 0) / tickerResults.length
      const avgReturn = tickerResults.reduce((sum, r) => sum + r.metrics.totalReturn, 0) / tickerResults.length
      const profitableStrategies = tickerResults.filter(r => r.metrics.totalReturn > 0).length
      
      return {
        ticker,
        bestStrategy: best.strategyNameJa,
        bestStrategyId: best.strategyId,
        bestWinRate: best.metrics.winRate,
        bestReturn: best.metrics.totalReturn,
        avgWinRate,
        avgReturn,
        totalStrategies: tickerResults.length,
        profitableStrategies,
      }
    })
  }, [results])

  // Group results by strategy and calculate cross-ticker performance
  const strategyPerformance = useMemo((): StrategyPerformance[] => {
    const strategyMap = new Map<string, BacktestResult[]>()
    
    results.forEach(r => {
      const existing = strategyMap.get(r.strategyId) || []
      existing.push(r)
      strategyMap.set(r.strategyId, existing)
    })
    
    return Array.from(strategyMap.entries())
      .map(([strategyId, strategyResults]) => {
        const tickers = strategyResults.map(r => ({
          ticker: r.ticker,
          winRate: r.metrics.winRate,
          totalReturn: r.metrics.totalReturn,
        }))
        
        const avgWinRate = tickers.reduce((sum, t) => sum + t.winRate, 0) / tickers.length
        const avgReturn = tickers.reduce((sum, t) => sum + t.totalReturn, 0) / tickers.length
        
        // Calculate consistency (lower std dev = more consistent)
        const winRateStdDev = Math.sqrt(
          tickers.reduce((sum, t) => sum + Math.pow(t.winRate - avgWinRate, 2), 0) / tickers.length
        )
        const consistency = Math.max(0, 100 - winRateStdDev * 2)
        
        return {
          strategyId,
          strategyName: strategyResults[0].strategyNameJa,
          tickers,
          avgWinRate,
          avgReturn,
          consistency,
        }
      })
      .sort((a, b) => b.avgWinRate - a.avgWinRate)
      .slice(0, 10) // Top 10 strategies
  }, [results])

  // Chart data for ticker comparison
  const tickerChartData = useMemo(() => {
    return tickerSummaries.map(t => ({
      ticker: t.ticker,
      '平均勝率': Number(t.avgWinRate.toFixed(1)),
      'ベスト勝率': Number(t.bestWinRate.toFixed(1)),
      '平均リターン': Number(t.avgReturn.toFixed(1)),
    }))
  }, [tickerSummaries])

  // Chart data for strategy comparison across tickers
  const strategyChartData = useMemo(() => {
    return strategyPerformance.slice(0, 8).map(s => ({
      name: s.strategyName.length > 10 ? s.strategyName.slice(0, 10) + '...' : s.strategyName,
      fullName: s.strategyName,
      '平均勝率': Number(s.avgWinRate.toFixed(1)),
      '一貫性': Number(s.consistency.toFixed(1)),
    }))
  }, [strategyPerformance])

  // Find best overall strategy
  const bestOverallStrategy = useMemo(() => {
    if (strategyPerformance.length === 0) return null
    return strategyPerformance.reduce((best, curr) => 
      (curr.avgWinRate * curr.consistency) > (best.avgWinRate * best.consistency) ? curr : best
    )
  }, [strategyPerformance])

  const uniqueTickers = useMemo(() => [...new Set(results.map(r => r.ticker))], [results])

  if (uniqueTickers.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>複数銘柄比較</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>複数銘柄を分析すると、ここに比較結果が表示されます</p>
          <p className="text-sm mt-2">現在: {uniqueTickers.length}銘柄</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              分析銘柄数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTickers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {uniqueTickers.join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              テスト戦略数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {results.filter(r => r.metrics.totalReturn > 0).length} 戦略がプラス収益
            </p>
          </CardContent>
        </Card>

        {bestOverallStrategy && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                ベスト戦略
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{bestOverallStrategy.strategyName}</div>
              <p className="text-xs text-muted-foreground mt-1">
                平均勝率: {bestOverallStrategy.avgWinRate.toFixed(1)}% / 
                一貫性: {bestOverallStrategy.consistency.toFixed(0)}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ticker Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>銘柄別パフォーマンス</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">銘柄</th>
                  <th className="text-left py-2 px-3">ベスト戦略</th>
                  <th className="text-right py-2 px-3">勝率</th>
                  <th className="text-right py-2 px-3">リターン</th>
                  <th className="text-right py-2 px-3">平均勝率</th>
                  <th className="text-right py-2 px-3">収益戦略</th>
                </tr>
              </thead>
              <tbody>
                {tickerSummaries.map((t, idx) => (
                  <tr key={t.ticker} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">
                      <Badge variant="outline" style={{ borderColor: COLORS[idx % COLORS.length] }}>
                        {t.ticker}
                      </Badge>
                    </td>
                    <td className="py-2 px-3">{t.bestStrategy}</td>
                    <td className="py-2 px-3 text-right font-mono">
                      {t.bestWinRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <span className={t.bestReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {t.bestReturn >= 0 ? '+' : ''}{t.bestReturn.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                      {t.avgWinRate.toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-right">
                      {t.profitableStrategies}/{t.totalStrategies}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticker Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">銘柄別勝率比較</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tickerChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="ticker" width={60} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ベスト勝率" fill="#3b82f6" />
                <Bar dataKey="平均勝率" fill="#93c5fd" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Strategy Consistency Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">戦略別パフォーマンス（Top 8）</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strategyChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name]}
                  labelFormatter={(label) => {
                    const item = strategyChartData.find(d => d.name === label)
                    return item?.fullName || label
                  }}
                />
                <Legend />
                <Bar dataKey="平均勝率" fill="#10b981" />
                <Bar dataKey="一貫性" fill="#6ee7b7" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cross-Ticker Strategy Performance */}
      <Card>
        <CardHeader>
          <CardTitle>戦略別クロスティッカー分析（Top 10）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">戦略</th>
                  {uniqueTickers.map(ticker => (
                    <th key={ticker} className="text-center py-2 px-3">{ticker}</th>
                  ))}
                  <th className="text-right py-2 px-3">平均</th>
                  <th className="text-right py-2 px-3">一貫性</th>
                </tr>
              </thead>
              <tbody>
                {strategyPerformance.map(s => (
                  <tr key={s.strategyId} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-3 font-medium">{s.strategyName}</td>
                    {uniqueTickers.map(ticker => {
                      const tickerData = s.tickers.find(t => t.ticker === ticker)
                      return (
                        <td key={ticker} className="text-center py-2 px-3 font-mono">
                          {tickerData ? (
                            <span className={tickerData.winRate >= 50 ? 'text-green-600' : 'text-red-600'}>
                              {tickerData.winRate.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="text-right py-2 px-3 font-mono font-medium">
                      {s.avgWinRate.toFixed(1)}%
                    </td>
                    <td className="text-right py-2 px-3">
                      <Badge variant={s.consistency >= 80 ? 'default' : s.consistency >= 60 ? 'secondary' : 'outline'}>
                        {s.consistency.toFixed(0)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>分析インサイト</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Best performing ticker */}
            {tickerSummaries.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium">最もパフォーマンスが良い銘柄</span>
                </div>
                <p className="text-lg font-bold">
                  {[...tickerSummaries].sort((a, b) => b.bestWinRate - a.bestWinRate)[0].ticker}
                </p>
                <p className="text-sm text-muted-foreground">
                  ベスト勝率: {[...tickerSummaries].sort((a, b) => b.bestWinRate - a.bestWinRate)[0].bestWinRate.toFixed(1)}%
                </p>
              </div>
            )}

            {/* Most consistent strategy */}
            {strategyPerformance.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">最も一貫性のある戦略</span>
                </div>
                <p className="text-lg font-bold">
                  {[...strategyPerformance].sort((a, b) => b.consistency - a.consistency)[0].strategyName}
                </p>
                <p className="text-sm text-muted-foreground">
                  一貫性スコア: {[...strategyPerformance].sort((a, b) => b.consistency - a.consistency)[0].consistency.toFixed(0)}%
                </p>
              </div>
            )}

            {/* Worst performing ticker */}
            {tickerSummaries.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="font-medium">改善が必要な銘柄</span>
                </div>
                <p className="text-lg font-bold">
                  {[...tickerSummaries].sort((a, b) => a.avgWinRate - b.avgWinRate)[0].ticker}
                </p>
                <p className="text-sm text-muted-foreground">
                  平均勝率: {[...tickerSummaries].sort((a, b) => a.avgWinRate - b.avgWinRate)[0].avgWinRate.toFixed(1)}%
                </p>
              </div>
            )}

            {/* Profitable ratio */}
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">収益性サマリー</span>
              </div>
              <p className="text-lg font-bold">
                {((results.filter(r => r.metrics.totalReturn > 0).length / results.length) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {results.filter(r => r.metrics.totalReturn > 0).length}/{results.length} 戦略がプラス収益
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
