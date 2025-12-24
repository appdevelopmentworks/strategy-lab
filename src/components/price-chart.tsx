'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, LineData, Time } from 'lightweight-charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CandlestickChart, LineChart as LineChartIcon, TrendingUp, TrendingDown } from 'lucide-react'
import type { OHLCV, Signal, BacktestResult } from '@/types'

interface PriceChartProps {
  stockData: OHLCV[]
  signals: Signal[]
  strategyName?: string
  ticker?: string
}

type ChartType = 'candlestick' | 'line'
type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'

const timeRangeLabels: Record<TimeRange, string> = {
  '1M': '1ヶ月',
  '3M': '3ヶ月',
  '6M': '6ヶ月',
  '1Y': '1年',
  'ALL': '全期間',
}

const timeRangeDays: Record<TimeRange, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'ALL': 9999,
}

export function PriceChart({ stockData, signals, strategyName, ticker }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null)
  
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL')
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean
    x: number
    y: number
    data: {
      date: string
      open?: number
      high?: number
      low?: number
      close: number
      signal?: Signal
    } | null
  }>({ visible: false, x: 0, y: 0, data: null })

  // Filter data by time range
  const getFilteredData = useCallback(() => {
    if (timeRange === 'ALL') return stockData
    
    const days = timeRangeDays[timeRange]
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return stockData.filter(d => new Date(d.date) >= cutoffDate)
  }, [stockData, timeRange])

  // Create signal map for quick lookup
  const signalMap = useCallback(() => {
    const map = new Map<string, Signal>()
    signals.forEach(signal => {
      const dateKey = new Date(signal.date).toISOString().split('T')[0]
      map.set(dateKey, signal)
    })
    return map
  }, [signals])

  useEffect(() => {
    if (!chartContainerRef.current || stockData.length === 0) return

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(156, 163, 175, 0.1)' },
        horzLines: { color: 'rgba(156, 163, 175, 0.1)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(156, 163, 175, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
    })

    chartRef.current = chart

    // Get filtered data
    const filteredData = getFilteredData()
    const signalLookup = signalMap()

    // Create series based on chart type
    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      })

      const candleData: CandlestickData[] = filteredData.map(d => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))

      candlestickSeries.setData(candleData)
      seriesRef.current = candlestickSeries

      // Add markers for signals
      const markers = filteredData
        .map(d => {
          const dateKey = new Date(d.date).toISOString().split('T')[0]
          const signal = signalLookup.get(dateKey)
          if (!signal || signal.type === 'HOLD') return null
          
          return {
            time: (new Date(d.date).getTime() / 1000) as Time,
            position: signal.type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
            color: signal.type === 'BUY' ? '#22c55e' : '#ef4444',
            shape: signal.type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
            text: signal.type === 'BUY' ? 'Entry' : 'Exit',
          }
        })
        .filter((m): m is NonNullable<typeof m> => m !== null)

      candlestickSeries.setMarkers(markers)
    } else {
      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      })

      const lineData: LineData[] = filteredData.map(d => ({
        time: (new Date(d.date).getTime() / 1000) as Time,
        value: d.close,
      }))

      lineSeries.setData(lineData)
      seriesRef.current = lineSeries

      // Add markers for signals
      const markers = filteredData
        .map(d => {
          const dateKey = new Date(d.date).toISOString().split('T')[0]
          const signal = signalLookup.get(dateKey)
          if (!signal || signal.type === 'HOLD') return null
          
          return {
            time: (new Date(d.date).getTime() / 1000) as Time,
            position: signal.type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
            color: signal.type === 'BUY' ? '#22c55e' : '#ef4444',
            shape: signal.type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
            text: signal.type === 'BUY' ? 'Entry' : 'Exit',
          }
        })
        .filter((m): m is NonNullable<typeof m> => m !== null)

      lineSeries.setMarkers(markers)
    }

    // Fit content
    chart.timeScale().fitContent()

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Crosshair move handler for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setTooltipData(prev => ({ ...prev, visible: false }))
        return
      }

      const timestamp = (param.time as number) * 1000
      const date = new Date(timestamp)
      const dateKey = date.toISOString().split('T')[0]
      
      const dataPoint = filteredData.find(d => 
        new Date(d.date).toISOString().split('T')[0] === dateKey
      )
      
      if (!dataPoint) {
        setTooltipData(prev => ({ ...prev, visible: false }))
        return
      }

      const signal = signalLookup.get(dateKey)

      setTooltipData({
        visible: true,
        x: param.point.x,
        y: param.point.y,
        data: {
          date: date.toLocaleDateString('ja-JP'),
          open: dataPoint.open,
          high: dataPoint.high,
          low: dataPoint.low,
          close: dataPoint.close,
          signal,
        },
      })
    })

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [stockData, signals, chartType, timeRange, getFilteredData, signalMap])

  // Calculate signal counts
  const buySignals = signals.filter(s => s.type === 'BUY').length
  const sellSignals = signals.filter(s => s.type === 'SELL').length

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              価格チャート
              {ticker && <span className="text-primary">({ticker})</span>}
            </CardTitle>
            {strategyName && (
              <p className="text-sm text-muted-foreground mt-1">
                戦略: {strategyName}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Signal Summary */}
            <div className="flex items-center gap-3 mr-4 text-sm">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                エントリー: {buySignals}
              </span>
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                <TrendingDown className="h-4 w-4" />
                決済: {sellSignals}
              </span>
              <span className="text-xs text-muted-foreground">
                ※ロングのみ
              </span>
            </div>
            
            {/* Time Range */}
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(timeRangeLabels) as TimeRange[]).map((range) => (
                  <SelectItem key={range} value={range}>
                    {timeRangeLabels[range]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Chart Type Toggle */}
            <div className="flex rounded-md border">
              <Button
                variant={chartType === 'candlestick' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('candlestick')}
                className="rounded-r-none"
              >
                <CandlestickChart className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setChartType('line')}
                className="rounded-l-none"
              >
                <LineChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <div 
            ref={chartContainerRef} 
            className="h-[400px] md:h-[500px] w-full"
          />
          
          {/* Custom Tooltip */}
          {tooltipData.visible && tooltipData.data && (
            <div
              className="absolute z-50 pointer-events-none bg-popover border rounded-lg shadow-lg p-3 text-sm"
              style={{
                left: Math.min(tooltipData.x + 10, (chartContainerRef.current?.clientWidth || 0) - 200),
                top: Math.max(tooltipData.y - 100, 10),
              }}
            >
              <div className="font-medium mb-2">{tooltipData.data.date}</div>
              
              {chartType === 'candlestick' && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">始値:</span>
                  <span>{tooltipData.data.open?.toFixed(2)}</span>
                  <span className="text-muted-foreground">高値:</span>
                  <span>{tooltipData.data.high?.toFixed(2)}</span>
                  <span className="text-muted-foreground">安値:</span>
                  <span>{tooltipData.data.low?.toFixed(2)}</span>
                  <span className="text-muted-foreground">終値:</span>
                  <span className="font-medium">{tooltipData.data.close.toFixed(2)}</span>
                </div>
              )}
              
              {chartType === 'line' && (
                <div className="text-xs">
                  <span className="text-muted-foreground">価格: </span>
                  <span className="font-medium">{tooltipData.data.close.toFixed(2)}</span>
                </div>
              )}
              
              {tooltipData.data.signal && (
                <div className={`mt-2 pt-2 border-t flex items-center gap-2 ${
                  tooltipData.data.signal.type === 'BUY' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {tooltipData.data.signal.type === 'BUY' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-medium">
                    {tooltipData.data.signal.type === 'BUY' ? 'Entry' : 'Exit'}
                  </span>
                </div>
              )}
              
              {tooltipData.data.signal?.indicatorValues && (
                <div className="mt-1 text-xs text-muted-foreground">
                  {Object.entries(tooltipData.data.signal.indicatorValues).map(([key, value]) => (
                    <div key={key}>
                      {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {stockData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
