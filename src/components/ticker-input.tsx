'use client'

import { useState } from 'react'
import { Play, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface TickerInputProps {
  onAnalyze: (config: AnalysisConfig) => void
  isLoading: boolean
}

export interface AnalysisConfig {
  tickers: string[]
  period: string
  minTrades: number
  objective: string
}

export function TickerInput({ onAnalyze, isLoading }: TickerInputProps) {
  const [tickerInput, setTickerInput] = useState('')
  const [period, setPeriod] = useState('1y')
  const [minTrades, setMinTrades] = useState('0')
  const [objective, setObjective] = useState('winRate')

  // Parse ticker input (comma or space separated)
  const parseTickers = (input: string): string[] => {
    return input
      .split(/[,\s]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0)
      .slice(0, 5) // Max 5 tickers
  }

  const currentTickers = parseTickers(tickerInput)

  const removeTicker = (tickerToRemove: string) => {
    const newTickers = currentTickers.filter(t => t !== tickerToRemove)
    setTickerInput(newTickers.join(', '))
  }

  const handleAnalyze = () => {
    if (currentTickers.length === 0) return
    
    onAnalyze({
      tickers: currentTickers,
      period,
      minTrades: parseInt(minTrades),
      objective,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAnalyze()
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Ticker Input */}
          <div className="space-y-2">
            <Label htmlFor="ticker">ティッカーコード（最大5銘柄、カンマまたはスペース区切り）</Label>
            <Input
              id="ticker"
              placeholder="例: AAPL, NVDA, MSFT または 7203.T"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            
            {/* Ticker Tags (preview) */}
            {currentTickers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentTickers.map(ticker => (
                  <span
                    key={ticker}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {ticker}
                    <button
                      type="button"
                      onClick={() => removeTicker(ticker)}
                      className="ml-2 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {currentTickers.length >= 5 && (
                  <span className="text-xs text-muted-foreground self-center">
                    (最大5銘柄)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>期間</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3mo">3ヶ月</SelectItem>
                  <SelectItem value="6mo">6ヶ月</SelectItem>
                  <SelectItem value="1y">1年</SelectItem>
                  <SelectItem value="3y">3年</SelectItem>
                  <SelectItem value="5y">5年</SelectItem>
                  <SelectItem value="10y">10年</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>最低トレード数</Label>
              <Select value={minTrades} onValueChange={setMinTrades}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0回以上</SelectItem>
                  <SelectItem value="10">10回以上</SelectItem>
                  <SelectItem value="20">20回以上</SelectItem>
                  <SelectItem value="30">30回以上</SelectItem>
                  <SelectItem value="50">50回以上</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>目標関数</Label>
              <Select value={objective} onValueChange={setObjective}>
                <SelectTrigger>
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

            <div className="flex items-end">
              <Button
                onClick={handleAnalyze}
                disabled={currentTickers.length === 0 || isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    分析開始
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
