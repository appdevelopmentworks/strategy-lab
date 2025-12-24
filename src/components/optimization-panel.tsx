'use client'

import { useState, useCallback } from 'react'
import { Search, Play, Loader2, TrendingUp, BarChart3, AlertTriangle, Layers, RefreshCw, CheckCircle, XCircle, AlertCircle, PieChart } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
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
  ScatterChart,
  Scatter,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts'

interface OptimizationPanelProps {
  selectedResult: BacktestResult | null
  stockData: OHLCV[]
  allResults?: BacktestResult[]
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

interface WalkForwardResult {
  strategyId: string
  ticker: string
  objective: string
  windowCount: number
  trainRatio: number
  windows: Array<{
    windowIndex: number
    trainStart: string
    trainEnd: string
    testStart: string
    testEnd: string
    bestParams: StrategyParams
    trainMetrics: BacktestMetrics
    testMetrics: BacktestMetrics
    trainScore: number
    testScore: number
  }>
  aggregatedTrainMetrics: {
    avgWinRate: number
    avgReturn: number
    avgPF: number
    avgSharpe: number
  }
  aggregatedTestMetrics: {
    avgWinRate: number
    avgReturn: number
    avgPF: number
    avgSharpe: number
  }
  overfitRatio: number
  robustnessScore: number
  consistency: number
  overfitRisk: 'low' | 'medium' | 'high'
  recommendation: string
  executionTimeMs: number
}

interface PortfolioResult {
  method: string
  methodDescription: string
  assets: Array<{
    id: string
    ticker: string
    strategyId: string
    strategyName: string
    weight: number
    metrics: BacktestMetrics
  }>
  weights: number[]
  combinedMetrics: {
    expectedReturn: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    diversificationRatio: number
  }
  correlationMatrix: number[][]
  efficientFrontier?: {
    points: Array<{
      return: number
      volatility: number
      sharpe: number
      weights: number[]
    }>
  }
  executionTimeMs: number
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F', '#FFBB28', '#FF8042', '#0088FE']

export function OptimizationPanel({ selectedResult, stockData, allResults = [] }: OptimizationPanelProps) {
  const [activeTab, setActiveTab] = useState('grid-search')
  const [isRunning, setIsRunning] = useState(false)
  const [objective, setObjective] = useState<'winRate' | 'totalReturn' | 'profitFactor' | 'sharpeRatio'>('winRate')
  const [gridSearchResult, setGridSearchResult] = useState<GridSearchResult | null>(null)
  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloResult | null>(null)
  const [walkForwardResult, setWalkForwardResult] = useState<WalkForwardResult | null>(null)
  const [portfolioResult, setPortfolioResult] = useState<PortfolioResult | null>(null)
  const [simulations, setSimulations] = useState('1000')
  const [parameterRanges, setParameterRanges] = useState<ParameterRange[]>([])
  
  // Walk-forward settings
  const [windowCount, setWindowCount] = useState('5')
  const [trainRatio, setTrainRatio] = useState('0.7')
  const [anchoredStart, setAnchoredStart] = useState(false)
  
  // Portfolio settings
  const [portfolioMethod, setPortfolioMethod] = useState<string>('equal')
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])

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

  // Run Walk-Forward
  const runWalkForward = async () => {
    if (!selectedResult || !stockData.length) return
    
    setIsRunning(true)
    setWalkForwardResult(null)
    
    try {
      const enabledRanges = parameterRanges
        .filter(r => r.enabled)
        .map(r => ({
          name: r.name,
          min: r.min,
          max: r.max,
          step: r.step,
        }))
      
      const response = await fetch('/api/optimize/walk-forward', {
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
          windowCount: parseInt(windowCount),
          trainRatio: parseFloat(trainRatio),
          anchoredStart,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setWalkForwardResult(result.data)
      } else {
        console.error('Walk-forward failed:', result.error)
      }
    } catch (error) {
      console.error('Walk-forward error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Run Portfolio Optimization
  const runPortfolioOptimization = async () => {
    if (selectedAssets.length < 2) return
    
    setIsRunning(true)
    setPortfolioResult(null)
    
    try {
      const assets = allResults
        .filter(r => selectedAssets.includes(`${r.ticker}-${r.strategyId}`))
        .map(r => ({
          id: `${r.ticker}-${r.strategyId}`,
          ticker: r.ticker,
          strategyId: r.strategyId,
          strategyName: r.strategyNameJa,
          metrics: r.metrics,
          equityCurve: r.equity.map(e => ({
            date: e.date.toISOString(),
            equity: e.equity,
            drawdown: e.drawdown,
          })),
        }))
      
      const response = await fetch('/api/optimize/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assets,
          method: portfolioMethod,
          riskFreeRate: 0.02,
          constraints: {
            minWeight: 0.05,
            maxWeight: 0.5,
          },
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setPortfolioResult(result.data)
      } else {
        console.error('Portfolio optimization failed:', result.error)
      }
    } catch (error) {
      console.error('Portfolio optimization error:', error)
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

  // Toggle asset selection
  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  if (!selectedResult && activeTab !== 'portfolio') {
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
          {selectedResult && (
            <CardDescription>
              選択中: {selectedResult.strategyNameJa} ({selectedResult.ticker})
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="grid-search">グリッドサーチ</TabsTrigger>
              <TabsTrigger value="monte-carlo">モンテカルロ</TabsTrigger>
              <TabsTrigger value="walk-forward">
                <RefreshCw className="h-3 w-3 mr-1" />
                WF検証
              </TabsTrigger>
              <TabsTrigger value="portfolio">
                <PieChart className="h-3 w-3 mr-1" />
                ポートフォリオ
              </TabsTrigger>
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
                  disabled={isRunning || !selectedResult?.trades.length}
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
            
            {/* Walk-Forward Tab */}
            <TabsContent value="walk-forward" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>ウォークフォワード検証</strong>は、データを複数の訓練/検証期間に分割し、
                    各期間で最適化したパラメーターが未来のデータでも有効かを検証します。
                    過学習（オーバーフィッティング）のリスクを評価できます。
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>目標関数:</Label>
                    <Select value={objective} onValueChange={(v) => setObjective(v as typeof objective)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="winRate">勝率</SelectItem>
                        <SelectItem value="totalReturn">総リターン</SelectItem>
                        <SelectItem value="profitFactor">PF</SelectItem>
                        <SelectItem value="sharpeRatio">シャープレシオ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>ウィンドウ数:</Label>
                    <Select value={windowCount} onValueChange={setWindowCount}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>訓練比率:</Label>
                    <Select value={trainRatio} onValueChange={setTrainRatio}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">50%</SelectItem>
                        <SelectItem value="0.6">60%</SelectItem>
                        <SelectItem value="0.7">70%</SelectItem>
                        <SelectItem value="0.8">80%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={initializeRanges} 
                      variant="outline" 
                      size="sm"
                      disabled={!strategyInfo}
                      className="w-full"
                    >
                      パラメーター設定
                    </Button>
                  </div>
                </div>
                
                {/* Parameter Ranges (共通) */}
                {parameterRanges.length > 0 && (
                  <div className="space-y-2 p-3 border rounded-lg">
                    <Label className="text-xs">パラメーター範囲:</Label>
                    {parameterRanges.map((range, index) => (
                      <div key={range.name} className="grid grid-cols-6 gap-2 items-center text-sm">
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={range.enabled}
                            onChange={(e) => updateRange(index, 'enabled', e.target.checked)}
                            className="rounded"
                          />
                          <span className="truncate">{range.label}</span>
                        </div>
                        <Input
                          type="number"
                          value={range.min}
                          onChange={(e) => updateRange(index, 'min', parseFloat(e.target.value))}
                          disabled={!range.enabled}
                          className="h-8 text-xs"
                        />
                        <span className="text-center">〜</span>
                        <Input
                          type="number"
                          value={range.max}
                          onChange={(e) => updateRange(index, 'max', parseFloat(e.target.value))}
                          disabled={!range.enabled}
                          className="h-8 text-xs"
                        />
                        <Input
                          type="number"
                          value={range.step}
                          onChange={(e) => updateRange(index, 'step', parseFloat(e.target.value))}
                          disabled={!range.enabled}
                          className="h-8 text-xs"
                        />
                        <span className="text-xs text-muted-foreground">
                          {range.enabled ? Math.floor((range.max - range.min) / range.step) + 1 : 0}通り
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  onClick={runWalkForward} 
                  disabled={isRunning || parameterRanges.filter(r => r.enabled).length === 0}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ウォークフォワード検証中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      ウォークフォワード検証実行
                    </>
                  )}
                </Button>
              </div>
              
              {/* Walk-Forward Results */}
              {walkForwardResult && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      ウォークフォワード結果
                    </h4>
                    <Badge 
                      variant={
                        walkForwardResult.overfitRisk === 'low' ? 'default' :
                        walkForwardResult.overfitRisk === 'medium' ? 'secondary' : 'destructive'
                      }
                    >
                      {walkForwardResult.overfitRisk === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {walkForwardResult.overfitRisk === 'medium' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {walkForwardResult.overfitRisk === 'high' && <XCircle className="h-3 w-3 mr-1" />}
                      過学習リスク: {walkForwardResult.overfitRisk === 'low' ? '低' : walkForwardResult.overfitRisk === 'medium' ? '中' : '高'}
                    </Badge>
                  </div>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">堅牢性スコア</p>
                        <p className="text-2xl font-bold">{walkForwardResult.robustnessScore}</p>
                        <p className="text-xs text-muted-foreground">/100</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">一貫性</p>
                        <p className="text-2xl font-bold">{walkForwardResult.consistency.toFixed(0)}%</p>
                        <p className="text-xs text-muted-foreground">プラスリターン率</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">過学習比率</p>
                        <p className="text-2xl font-bold">{walkForwardResult.overfitRatio.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">訓練/検証</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">検証平均リターン</p>
                        <p className={`text-2xl font-bold ${walkForwardResult.aggregatedTestMetrics.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {walkForwardResult.aggregatedTestMetrics.avgReturn.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Train vs Test Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">訓練期間（平均）</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-1 text-sm">
                        <p>勝率: <span className="font-mono">{walkForwardResult.aggregatedTrainMetrics.avgWinRate.toFixed(1)}%</span></p>
                        <p>リターン: <span className="font-mono">{walkForwardResult.aggregatedTrainMetrics.avgReturn.toFixed(1)}%</span></p>
                        <p>PF: <span className="font-mono">{walkForwardResult.aggregatedTrainMetrics.avgPF.toFixed(2)}</span></p>
                        <p>シャープ: <span className="font-mono">{walkForwardResult.aggregatedTrainMetrics.avgSharpe.toFixed(2)}</span></p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">検証期間（平均）</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2 space-y-1 text-sm">
                        <p>勝率: <span className="font-mono">{walkForwardResult.aggregatedTestMetrics.avgWinRate.toFixed(1)}%</span></p>
                        <p>リターン: <span className="font-mono">{walkForwardResult.aggregatedTestMetrics.avgReturn.toFixed(1)}%</span></p>
                        <p>PF: <span className="font-mono">{walkForwardResult.aggregatedTestMetrics.avgPF.toFixed(2)}</span></p>
                        <p>シャープ: <span className="font-mono">{walkForwardResult.aggregatedTestMetrics.avgSharpe.toFixed(2)}</span></p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Window Details Chart */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">ウィンドウ別パフォーマンス</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={walkForwardResult.windows.map((w, i) => ({
                            window: `W${i + 1}`,
                            trainReturn: w.trainMetrics.totalReturn,
                            testReturn: w.testMetrics.totalReturn,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="window" />
                            <YAxis tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`]} />
                            <Legend />
                            <Bar dataKey="trainReturn" name="訓練" fill="#8884d8" />
                            <Bar dataKey="testReturn" name="検証" fill="#82ca9d" />
                            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recommendation */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">推奨事項</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <pre className="text-sm whitespace-pre-wrap">{walkForwardResult.recommendation}</pre>
                    </CardContent>
                  </Card>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>実行時間: {(walkForwardResult.executionTimeMs / 1000).toFixed(2)}秒</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>ポートフォリオ最適化</strong>は、複数の戦略/銘柄を組み合わせて
                    リスク分散されたポートフォリオを構築します。相関の低い戦略を組み合わせることで
                    リスク調整後リターンを改善できます。
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>最適化方法:</Label>
                    <Select value={portfolioMethod} onValueChange={setPortfolioMethod}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equal">均等配分</SelectItem>
                        <SelectItem value="risk_parity">リスクパリティ</SelectItem>
                        <SelectItem value="max_sharpe">最大シャープレシオ</SelectItem>
                        <SelectItem value="min_variance">最小分散</SelectItem>
                        <SelectItem value="max_return">最大リターン</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Asset Selection */}
                <div>
                  <Label>アセット選択（2つ以上）:</Label>
                  <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {allResults.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        バックテスト結果がありません。先にバックテストを実行してください。
                      </p>
                    ) : (
                      allResults.map(r => {
                        const assetId = `${r.ticker}-${r.strategyId}`
                        const isSelected = selectedAssets.includes(assetId)
                        return (
                          <div 
                            key={assetId}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${isSelected ? 'bg-primary/10' : ''}`}
                            onClick={() => toggleAssetSelection(assetId)}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded"
                              />
                              <span className="text-sm">{r.ticker}</span>
                              <span className="text-xs text-muted-foreground">{r.strategyNameJa}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.metrics.totalReturn.toFixed(1)}% / SR: {r.metrics.sharpeRatio.toFixed(2)}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    選択中: {selectedAssets.length}個
                  </p>
                </div>
                
                <Button 
                  onClick={runPortfolioOptimization} 
                  disabled={isRunning || selectedAssets.length < 2}
                  className="w-full"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ポートフォリオ最適化中...
                    </>
                  ) : (
                    <>
                      <Layers className="mr-2 h-4 w-4" />
                      ポートフォリオ最適化実行
                    </>
                  )}
                </Button>
              </div>
              
              {/* Portfolio Results */}
              {portfolioResult && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    ポートフォリオ結果
                    <Badge variant="outline">{portfolioResult.methodDescription}</Badge>
                  </h4>
                  
                  {/* Combined Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">期待リターン</p>
                        <p className={`text-2xl font-bold ${portfolioResult.combinedMetrics.expectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {portfolioResult.combinedMetrics.expectedReturn.toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">ボラティリティ</p>
                        <p className="text-2xl font-bold">{portfolioResult.combinedMetrics.volatility.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">シャープレシオ</p>
                        <p className="text-2xl font-bold">{portfolioResult.combinedMetrics.sharpeRatio.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">最大DD</p>
                        <p className="text-2xl font-bold text-red-600">{portfolioResult.combinedMetrics.maxDrawdown.toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="py-4">
                        <p className="text-xs text-muted-foreground">分散比率</p>
                        <p className="text-2xl font-bold">{portfolioResult.combinedMetrics.diversificationRatio.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Weight Allocation */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">ウェイト配分</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={portfolioResult.assets.map((a, i) => ({
                                  name: `${a.ticker}\n${a.strategyName}`,
                                  value: a.weight * 100,
                                }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                                label={({ name, value }) => `${value.toFixed(0)}%`}
                              >
                                {portfolioResult.assets.map((_, i) => (
                                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">アセット詳細</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {portfolioResult.assets.map((asset, i) => (
                            <div key={asset.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span>{asset.ticker}</span>
                                <span className="text-xs text-muted-foreground">{asset.strategyName}</span>
                              </div>
                              <span className="font-mono">{(asset.weight * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Correlation Matrix */}
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">相関行列</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full">
                          <thead>
                            <tr>
                              <th className="p-1"></th>
                              {portfolioResult.assets.map((a, i) => (
                                <th key={i} className="p-1 text-center">{a.ticker}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {portfolioResult.correlationMatrix.map((row, i) => (
                              <tr key={i}>
                                <td className="p-1 font-semibold">{portfolioResult.assets[i].ticker}</td>
                                {row.map((corr, j) => (
                                  <td 
                                    key={j} 
                                    className="p-1 text-center font-mono"
                                    style={{
                                      backgroundColor: i === j ? 'transparent' : 
                                        `rgba(${corr > 0 ? '34,197,94' : '239,68,68'}, ${Math.abs(corr) * 0.3})`
                                    }}
                                  >
                                    {corr.toFixed(2)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Efficient Frontier */}
                  {portfolioResult.efficientFrontier && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">効率的フロンティア</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="volatility" 
                                name="ボラティリティ" 
                                type="number"
                                tickFormatter={(v) => `${v.toFixed(0)}%`}
                              />
                              <YAxis 
                                dataKey="return" 
                                name="リターン" 
                                type="number"
                                tickFormatter={(v) => `${v.toFixed(0)}%`}
                              />
                              <Tooltip 
                                formatter={(value: number, name: string) => [
                                  `${value.toFixed(1)}%`, 
                                  name === 'return' ? 'リターン' : 'ボラティリティ'
                                ]}
                              />
                              <Scatter 
                                data={portfolioResult.efficientFrontier.points} 
                                fill="#8884d8"
                              >
                                {portfolioResult.efficientFrontier.points.map((_, i) => (
                                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                              </Scatter>
                              {/* Current Portfolio */}
                              <Scatter 
                                data={[{
                                  volatility: portfolioResult.combinedMetrics.volatility,
                                  return: portfolioResult.combinedMetrics.expectedReturn,
                                }]} 
                                fill="#ff7300"
                                shape="star"
                              />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <p>実行時間: {(portfolioResult.executionTimeMs / 1000).toFixed(2)}秒</p>
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
