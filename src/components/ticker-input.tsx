'use client'

import { useState } from 'react'
import { Play, X, Plus, Loader2 } from 'lucide-react'
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
  const [tickers, setTickers] = useState<string[]>(['AAPL'])
  const [currentInput, setCurrentInput] = useState('')
  const [period, setPeriod] = useState('5y')
  const [minTrades, setMinTrades] = useState('30')
  const [objective, setObjective] = useState('winRate')

  const addTicker = () => {
    const ticker = currentInput.trim().toUpperCase()
    if (ticker && !tickers.includes(ticker) && tickers.length < 5) {
      setTickers([...tickers, ticker])
      setCurrentInput('')
    }
  }

  const removeTicker = (tickerToRemove: string) => {
    setTickers(tickers.filter(t => t !== tickerToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTicker()
    }
  }

  const handleAnalyze = () => {
    if (tickers.length === 0) return
    
    onAnalyze({
      tickers,
      period,
      minTrades: parseInt(minTrades),
      objective,
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Ticker Input */}
          <div className="space-y-2">
            <Label htmlFor="ticker">ティッカーコード（最大5銘柄）</Label>
            <div className="flex space-x-2">
              <Input
                id="ticker"
                placeholder="AAPL, 7203.T など"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={tickers.length >= 5}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={addTicker}
                disabled={tickers.length >= 5 || !currentInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Ticker Tags */}
            <div className="flex flex-wrap gap-2">
              {tickers.map(ticker => (
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
            </div>
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
                disabled={tickers.length === 0 || isLoading}
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
