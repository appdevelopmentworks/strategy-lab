'use client'

import { useState, useCallback } from 'react'
import { BarChart3, LineChart, Settings, Search, Download, Loader2, GitCompare } from 'lucide-react'
import { Header } from '@/components/header'
import { TickerInput, type AnalysisConfig } from '@/components/ticker-input'
import { ResultsTable } from '@/components/results-table'
import { ResultsChart } from '@/components/results-chart'
import { PriceChart } from '@/components/price-chart'
import { ParameterPanel } from '@/components/parameter-panel'
import { ExportPanel } from '@/components/export-panel'
import { MultiTickerComparison } from '@/components/multi-ticker-comparison'
import { OptimizationPanel } from '@/components/optimization-panel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BacktestResult, SortField, OHLCV, BacktestMetrics, StrategyParams } from '@/types'

export default function Home() {
  const [results, setResults] = useState<BacktestResult[]>([])
  const [stockDataMap, setStockDataMap] = useState<Map<string, OHLCV[]>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<BacktestResult | null>(null)
  const [chartSortField, setChartSortField] = useState<SortField>('winRate')
  const [activeTab, setActiveTab] = useState('results')
  const [currentTicker, setCurrentTicker] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [analyzedTickers, setAnalyzedTickers] = useState<string[]>([])

  const handleAnalyze = async (config: AnalysisConfig) => {
    setIsLoading(true)
    setError(null)
    setResults([])
    setSelectedResult(null)
    setStockDataMap(new Map())
    setAnalyzedTickers([])
    
    try {
      const newStockDataMap = new Map<string, OHLCV[]>()
      
      // Fetch stock data for all tickers
      for (const ticker of config.tickers) {
        const stockResponse = await fetch(`/api/stock/${ticker}?period=${config.period}`)
        const stockResult = await stockResponse.json()
        
        if (stockResult.success && stockResult.data) {
          const data = stockResult.data.data.map((d: { date: string; open: number; high: number; low: number; close: number; volume: number; adjClose?: number }) => ({
            ...d,
            date: new Date(d.date),
          }))
          newStockDataMap.set(ticker, data)
        }
      }
      
      setStockDataMap(newStockDataMap)
      setCurrentTicker(config.tickers[0])
      setAnalyzedTickers(config.tickers)
      
      const backtestResponse = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers: config.tickers,
          period: config.period,
          minTrades: config.minTrades,
        }),
      })
      
      const backtestResult = await backtestResponse.json()
      
      if (backtestResult.success && backtestResult.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allResults: BacktestResult[] = backtestResult.data.flatMap(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (tickerData: any) => 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tickerData.results.map((r: any) => ({
              ...r,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              signals: r.signals.map((s: any) => ({
                ...s,
                date: new Date(s.date),
              })),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              trades: r.trades.map((t: any) => ({
                ...t,
                entryDate: new Date(t.entryDate),
                exitDate: new Date(t.exitDate),
              })),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              equity: r.equity.map((e: any) => ({
                ...e,
                date: new Date(e.date),
              })),
            }))
        )
        setResults(allResults)
        
        // Auto-switch to comparison tab if multiple tickers
        if (config.tickers.length > 1) {
          setActiveTab('compare')
        }
      } else {
        setError(backtestResult.error || 'バックテストに失敗しました')
      }
    } catch (err) {
      console.error('Analysis failed:', err)
      setError('分析中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectStrategy = useCallback((result: BacktestResult) => {
    setSelectedResult(result)
    setCurrentTicker(result.ticker)
    setActiveTab('chart')
  }, [])

  const handleParameterChange = useCallback(async (
    strategyId: string,
    params: StrategyParams
  ): Promise<BacktestMetrics | null> => {
    const stockData = stockDataMap.get(currentTicker)
    if (!stockData || stockData.length === 0) return null

    try {
      const response = await fetch('/api/backtest/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyId,
          stockData: stockData.map(d => ({
            ...d,
            date: d.date.toISOString(),
          })),
          parameters: params,
        }),
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        const newResult: BacktestResult = {
          ...result.data,
          ticker: currentTicker,
          period: '5y',
          category: selectedResult?.category || 'unknown',
          signals: result.data.signals.map((s: { date: string; type: string; price: number; indicatorValues?: Record<string, number> }) => ({
            ...s,
            date: new Date(s.date),
          })),
          trades: result.data.trades.map((t: { entryDate: string; exitDate: string; entryPrice: number; exitPrice: number; type: string; profitPct: number; profitAmount: number; holdingDays: number }) => ({
            ...t,
            entryDate: new Date(t.entryDate),
            exitDate: new Date(t.exitDate),
          })),
          equity: result.data.equity.map((e: { date: string; equity: number; drawdown: number }) => ({
            ...e,
            date: new Date(e.date),
          })),
        }
        
        setSelectedResult(newResult)
        setResults(prev => prev.map(r => 
          r.strategyId === strategyId && r.ticker === currentTicker ? newResult : r
        ))
        
        return result.data.metrics
      }
      
      return null
    } catch (error) {
      console.error('Parameter change failed:', error)
      return null
    }
  }, [stockDataMap, currentTicker, selectedResult?.category])

  // Get current stock data based on selected result or current ticker
  const currentStockData = stockDataMap.get(currentTicker) || []

  // Filter results for current ticker (for single-ticker views)
  const currentTickerResults = results.filter(r => r.ticker === currentTicker)

  return (
    <div className="min-h-screen bg-background">
      <Header selectedResult={selectedResult} />
      
      <main className="container py-6 space-y-6">
        <TickerInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <Card>
            <CardContent className="py-12 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">バックテストを実行中...</p>
              <p className="text-sm text-muted-foreground mt-1">
                72戦略 × {analyzedTickers.length || 1}銘柄を分析中
              </p>
            </CardContent>
          </Card>
        )}
        
        {!isLoading && (results.length > 0 || currentStockData.length > 0) && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="results" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">結果一覧</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                <span className="hidden sm:inline">銘柄比較</span>
              </TabsTrigger>
              <TabsTrigger value="chart" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">チャート</span>
              </TabsTrigger>
              <TabsTrigger value="parameters" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">パラメーター</span>
              </TabsTrigger>
              <TabsTrigger value="optimize" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">最適化</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">エクスポート</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="results" className="space-y-4">
              {results.length > 0 ? (
                <div className="grid gap-4">
                  {/* Ticker selector if multiple tickers */}
                  {analyzedTickers.length > 1 && (
                    <Card>
                      <CardContent className="py-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">銘柄:</span>
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => setCurrentTicker('')}
                              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                currentTicker === '' 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              すべて ({results.length})
                            </button>
                            {analyzedTickers.map(ticker => {
                              const count = results.filter(r => r.ticker === ticker).length
                              return (
                                <button
                                  key={ticker}
                                  onClick={() => setCurrentTicker(ticker)}
                                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                    currentTicker === ticker 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                >
                                  {ticker} ({count})
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <ResultsChart
                    results={currentTicker ? currentTickerResults : results}
                    sortField={chartSortField}
                    onSortFieldChange={setChartSortField}
                  />
                  <ResultsTable
                    results={currentTicker ? currentTickerResults : results}
                    onSelectStrategy={handleSelectStrategy}
                    selectedStrategyId={selectedResult?.strategyId}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>バックテスト結果がありません</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="compare">
              <MultiTickerComparison results={results} />
            </TabsContent>
            
            <TabsContent value="chart">
              {currentStockData.length > 0 ? (
                <>
                  {/* Ticker selector for chart */}
                  {analyzedTickers.length > 1 && (
                    <Card className="mb-4">
                      <CardContent className="py-3">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium">表示銘柄:</span>
                          <div className="flex gap-2">
                            {analyzedTickers.map(ticker => (
                              <button
                                key={ticker}
                                onClick={() => setCurrentTicker(ticker)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                  currentTicker === ticker 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {ticker}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <PriceChart
                    stockData={currentStockData}
                    signals={selectedResult?.ticker === currentTicker ? selectedResult.signals : []}
                    strategyName={selectedResult?.ticker === currentTicker ? selectedResult.strategyNameJa : undefined}
                    ticker={currentTicker}
                  />
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>価格チャート</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[500px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>チャートを表示するにはティッカーを入力して分析を実行してください</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {currentStockData.length > 0 && (!selectedResult || selectedResult.ticker !== currentTicker) && (
                <Card className="mt-4">
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground text-center">
                      💡 ヒント: 結果一覧タブから戦略を選択すると、売買シグナルがチャート上に表示されます
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="parameters">
              <ParameterPanel
                selectedResult={selectedResult}
                stockData={selectedResult ? (stockDataMap.get(selectedResult.ticker) || []) : []}
                onParameterChange={handleParameterChange}
              />
            </TabsContent>
            
            <TabsContent value="optimize">
              <OptimizationPanel
                selectedResult={selectedResult}
                stockData={selectedResult ? (stockDataMap.get(selectedResult.ticker) || []) : []}
                allResults={results}
              />
            </TabsContent>
            
            <TabsContent value="export">
              <ExportPanel selectedResult={selectedResult} />
            </TabsContent>
          </Tabs>
        )}
        
        {!isLoading && results.length === 0 && currentStockData.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">StrategyLabへようこそ</p>
              <p>上のフォームにティッカーコードを入力して「分析開始」をクリックしてください</p>
              <p className="text-sm mt-2">
                例: AAPL（Apple）、NVDA（NVIDIA）、7203.T（トヨタ）
              </p>
              <p className="text-sm mt-4 text-primary">
                💡 複数銘柄を入力すると、銘柄間の戦略パフォーマンス比較ができます
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>StrategyLab v1.3 - システムトレード戦略バックテストツール</p>
          <p className="mt-1">72種類の戦略 × 複数銘柄対応 × パラメーター最適化</p>
        </div>
      </footer>
    </div>
  )
}
