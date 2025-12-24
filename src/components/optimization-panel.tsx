'use client'

import { useState, useCallback } from 'react'
import { Search, Play, Loader2, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import type { BacktestResult, OHLCV, StrategyParams, BacktestMetrics } from '@/types'
import { strategyRegistry } from '@/lib/strategies/registry'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts'

interface OptimizationPanelProps {
  selectedResult: BacktestResult | null
  stockData: OHLCV[]
}

interface ParameterRange {
  name: string
  label: string
  min: number
  max: number
  step: number
  enabled: boolean
}

interface GridSearchResult {
  bestParams: StrategyParams
  bestMetrics: BacktestMetrics
  bestScore: number
  allResults: {
    params: StrategyParams
    metrics: BacktestMetrics
    score: number
  }[]
  totalCombinations: number
  executedCombinations: number
  executionTimeMs: number
}

interface MonteCarloResult {
  originalMetrics: {
    totalReturn: number
    maxDrawdown: number
    sharpeRatio: number
    winRate: number
  }
  simulations: number
  returnDistribution: {
    mean: number
    median: number
    stdDev: number
    min: number
    max: number
    percentile5: number
    percentile25: number
    percentile75: number
    percentile95: number
  }
  drawdownDistribution: {
    mean: number
    median: number
    max: number
    percentile95: number
  }
  riskMetrics: {
    probabilityOfLoss: number
    probabilityOfRuin: number
    expectedShortfall: number
    valueAtRisk: number
  }
  sampleEquityCurves: number[][]
  executionTimeMs: number
}

export function OptimizationPanel({ selectedResult, stockData }: OptimizationPanelProps) {
  const [activeTab, setActiveTab] = useState('grid-search')
  const [isRunning, setIsRunning] = useState(false)
  const [objective, setObjective] = useState<'winRate' | 'totalReturn' | 'profitFactor' | 'sharpeRatio'>('winRate')
  const [gridSearchResult, setGridSearchResult] = useState<GridSearchResult | null>(null)
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null)
  const [simulations, setSimulations] = useState('1000')
  const [parameterRanges, setParameterRanges] = useState<ParameterRange[]>([])

  // Get strategy info
  const strategyInfo = selectedResult 
    ? strategyRegistry.find(s => s.id === selectedResult.strategyId)
    : null

  // Initialize parameter ranges when strategy changes
  const initializeRanges = useCallback(() => {
    if (!strategyInfo) return
    
    const ranges: ParameterRange[] = strategyInfo.parameters.map(param => ({
      name: param.name,
      label: param.labelJa || param.label,
      min: param.min,
      max: param.max,
      step: param.step,
      enabled: true,
    }))
    
    setParameterRanges(ranges)
  }, [strategyInfo])

  // Run Grid Search
  const runGridSearch = async () => {
    if (!selectedResult || !stockData.length) return
    
    setIsRunning(true)
    setGridSearchResult(null)
    
    try {
      const enabledRanges = parameterRanges
        .filter(r => r.enabled)
        .map(r => ({
          name: r.name,
          min: r.min,
          max: r.max,
          step: r.step,
        }))
      
      const response = await fetch('/api/optimize/grid-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId: selectedResult.strategyId,
          stockData: stockData.map(d => ({
            ...d,
            date: d.date.toISOString(),
          })),
          parameterRanges: enabledRanges,
          objective,
          maxCombinations: 5000,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setGridSearchResult(result.data)
      } else {
        console.error('Grid search failed:', result.error)
      }
    } catch (error) {
      console.error('Grid search error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Run Monte Carlo
  const runMonteCarlo = async () => {
    if (!selectedResult || !selectedResult.trades.length) return
    
    setIsRunning(true)
    setMonteCarloResult(null)
    
    try {
      const response = await fetch('/api/optimize/monte-carlo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trades: selectedResult.trades.map(t => ({
            ...t,
            entryDate: t.entryDate.toISOString(),
            exitDate: t.exitDate.toISOString(),
          })),
          initialCapital: 1000000,
          simulations: parseInt(simulations),
          confidenceLevel: 0.95,
          method: 'shuffle',
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMonteCarloResult(result.data)
      } else {
        console.error('Monte Carlo failed:', result.error)
      }
    } catch (error) {
      console.error('Monte Carlo error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Update parameter range
  const updateRange = (index: number, field: keyof ParameterRange, value: number | boolean) => {
    setParameterRanges(prev => prev.map((r, i) => 
      i === index ? { ...r, [field]: value } : r
    ))
  }

  if (!selectedResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>パラメーター最適化</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>最適化する戦略を選択してください</p>
            <p className="text-sm mt-2">結果一覧タブから戦略を選択してください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            パラメーター最適化
          </CardTitle>
          <CardDescription>
            選択中: {selectedResult.strategyNameJa} ({selectedResult.ticker})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid-search">グリッドサーチ</TabsTrigger>
              <TabsTrigger value="monte-carlo">モンテカルロ</TabsTrigger>
            </TabsList>
            
            {/* Grid Search Tab */}
            <TabsContent value="grid-search" className="space-y-4">
              <div className="grid gap-4">
                {/* Objective Selection */}
                <div className="flex items-center gap-4">
                  <Label>目標関数:</Label>
                  <Select value={objective} onValueChange={(v) => setObjective(v as typeof objective)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winRate">勝率</SelectItem>
                      <SelectItem value="totalReturn">総リターン</SelectItem>
                      <SelectItem value="profitFactor">PF</SelectItem>
                      <SelectItem value="sharpeRatio">シャープレシオ</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={initializeRanges} 
                    variant="outline" 
                    size="sm"
                    disabled={!strategyInfo}
                  >
                    範囲をリセット
                  </Button>
                </div>
                
                {/* Parameter Ranges */}
                {parameterRanges.length === 0 && (
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-muted-foreground mb-2">パラメーター範囲が未設定です</p>
                    <Button onClick={initializeRanges} variant="outline" size="sm">
                      デフォルト範囲を読み込む
                    </Button>
                  </div>
                )}
                
                {parameterRanges.length > 0 && (
                  <div className="space-y-3">
                    <Label>パラメーター範囲:</Label>
                    {parameterRanges.map((range, index) => (
                      <div key={range.name} className="grid grid-cols-6 gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={range.enabled}
                            onChange={(e) => updateRange(index, 'enabled', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm">{range.label}</span>
                        </div>
                        <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => updateRange(index, 'min', parseFloat(e.target.value))}
                          disabled={!range.enabled}
                          className="text-sm"
                        />
                        <span className="text-center text-muted-foreground">〜</span>
                        <Input
                          type="number"
                          value={range.max}
                          onChange={(e) => updateRange(index, 'max', parseFloat(e.target.value))}
                          disabled={!range.enabled}
                          className="text-sm"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">step:</span>
                          <Input
                            type="number"
                            value={range.step}
                            onChange={(e) => updateRange(index, 'step', parseFloat(e.target.value))}
                            disabled={!range.enabled}
                            className="text-sm"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {range.enabled ? Math.floor((range.max - range.min) / range.step) + 1 : 0}通り
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Run Button */}
                <Button 
                  onClick={runGridSearch} 
                  disabled={isRunning || parameterRanges.filter(r => r.enabled).length === 0}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      最適化実行中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      グリッドサーチ実行
                    </>
                  )}
                </Button>
              </div>
              
              {/* Grid Search Results */}
              {gridSearchResult && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    最適化結果
                  </h4>
                  
                  {/* Best Parameters */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">最適パラメーター</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(gridSearchResult.bestParams).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-muted-foreground">{key}</p>
                            <p className="font-mono font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Best Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">勝率</p>
                        <p className="text-2xl font-bold">{gridSearchResult.bestMetrics.winRate.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">総リターン</p>
                        <p className="text-2xl font-bold">{gridSearchResult.bestMetrics.totalReturn.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">PF</p>
                        <p className="text-2xl font-bold">{gridSearchResult.bestMetrics.profitFactor.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">トレード数</p>
                        <p className="text-2xl font-bold">{gridSearchResult.bestMetrics.totalTrades}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Execution Stats */}
                  <div className="text-sm text-muted-foreground">
                    <p>検証済み: {gridSearchResult.executedCombinations.toLocaleString()} / {gridSearchResult.totalCombinations.toLocaleString()} 組み合わせ</p>
                    <p>実行時間: {(gridSearchResult.executionTimeMs / 1000).toFixed(2)}秒</p>
                  </div>
                  
                  {/* Top Results Chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={gridSearchResult.allResults.slice(0, 20).map((r, i) => ({ ...r, rank: i + 1 }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rank" label={{ value: 'ランキング', position: 'bottom' }} />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [value.toFixed(2), 'スコア']}
                          labelFormatter={(label) => `#${label}`}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null
                            const data = payload[0].payload
                            return (
                              <div className="bg-background border rounded p-2 shadow-lg">
                                <p className="font-semibold">#{data.rank}</p>
                                <p>スコア: {data.score.toFixed(2)}</p>
                                <p>勝率: {data.metrics.winRate.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Object.entries(data.params).map(([k, v]) => `${k}=${v}`).join(', ')}
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Bar dataKey="score" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Monte Carlo Tab */}
            <TabsContent value="monte-carlo" className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <Label>シミュレーション回数:</Label>
                  <Select value={simulations} onValueChange={setSimulations}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100回</SelectItem>
                      <SelectItem value="500">500回</SelectItem>
                      <SelectItem value="1000">1,000回</SelectItem>
                      <SelectItem value="5000">5,000回</SelectItem>
                      <SelectItem value="10000">10,000回</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    モンテカルロシミュレーションは、トレード順序をランダムに並び替えて
                    統計的な信頼区間を計算します。戦略の堅牢性を評価できます。
                  </p>
                </div>
                
                <Button 
                  onClick={runMonteCarlo} 
                  disabled={isRunning || !selectedResult.trades.length}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      シミュレーション実行中...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      モンテカルロ実行
                    </>
                  )}
                </Button>
              </div>
              
              {/* Monte Carlo Results */}
              {monteCarloResult && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    シミュレーション結果 ({monteCarloResult.simulations.toLocaleString()}回)
                  </h4>
                  
                  {/* Original vs Simulated */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">オリジナル結果</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-1">
                        <p>リターン: <span className="font-mono">{monteCarloResult.originalMetrics.totalReturn.toFixed(1)}%</span></p>
                        <p>最大DD: <span className="font-mono">{monteCarloResult.originalMetrics.maxDrawdown.toFixed(1)}%</span></p>
                        <p>勝率: <span className="font-mono">{monteCarloResult.originalMetrics.winRate.toFixed(1)}%</span></p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">シミュレーション平均</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-1">
                        <p>リターン: <span className="font-mono">{monteCarloResult.returnDistribution.mean.toFixed(1)}%</span></p>
                        <p>最大DD: <span className="font-mono">{monteCarloResult.drawdownDistribution.mean.toFixed(1)}%</span></p>
                        <p>標準偏差: <span className="font-mono">{monteCarloResult.returnDistribution.stdDev.toFixed(1)}%</span></p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Return Distribution */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">リターン分布</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>5%タイル</span>
                          <span className="font-mono">{monteCarloResult.returnDistribution.percentile5.toFixed(1)}%</span>
                        </div>
                        <Progress value={50 + monteCarloResult.returnDistribution.percentile5 / 2} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span>中央値</span>
                          <span className="font-mono">{monteCarloResult.returnDistribution.median.toFixed(1)}%</span>
                        </div>
                        <Progress value={50 + monteCarloResult.returnDistribution.median / 2} className="h-2" />
                        
                        <div className="flex justify-between text-sm">
                          <span>95%タイル</span>
                          <span className="font-mono">{monteCarloResult.returnDistribution.percentile95.toFixed(1)}%</span>
                        </div>
                        <Progress value={50 + monteCarloResult.returnDistribution.percentile95 / 2} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Risk Metrics */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        リスク指標
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">損失確率</p>
                          <p className="text-lg font-semibold">{monteCarloResult.riskMetrics.probabilityOfLoss.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">破産確率 (DD&gt;50%)</p>
                          <p className="text-lg font-semibold">{monteCarloResult.riskMetrics.probabilityOfRuin.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">VaR (95%)</p>
                          <p className="text-lg font-semibold">{monteCarloResult.riskMetrics.valueAtRisk.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">期待ショートフォール</p>
                          <p className="text-lg font-semibold">{monteCarloResult.riskMetrics.expectedShortfall.toFixed(1)}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Sample Equity Curves */}
                  {monteCarloResult.sampleEquityCurves.length > 0 && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">サンプル資産曲線</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="index" hide />
                              <YAxis 
                                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                              />
                              <Tooltip 
                                formatter={(value: number) => [`¥${value.toLocaleString()}`, '資産']}
                              />
                              <ReferenceLine y={1000000} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                              {monteCarloResult.sampleEquityCurves.map((curve, i) => (
                                <Line
                                  key={i}
                                  data={curve.map((v, idx) => ({ index: idx, value: v }))}
                                  type="monotone"
                                  dataKey="value"
                                  stroke={`hsl(${i * 36}, 70%, 50%)`}
                                  strokeWidth={1}
                                  dot={false}
                                  opacity={0.7}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Execution Stats */}
                  <div className="text-sm text-muted-foreground">
                    <p>実行時間: {(monteCarloResult.executionTimeMs / 1000).toFixed(2)}秒</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
