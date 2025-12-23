'use client'

import { useState, useMemo } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BacktestResult, SortField, SortOrder } from '@/types'
import { formatPercent, formatNumber, getValueColor } from '@/lib/utils'

interface ResultsTableProps {
  results: BacktestResult[]
  onSelectStrategy: (result: BacktestResult) => void
  selectedStrategyId?: string
}

export function ResultsTable({ results, onSelectStrategy, selectedStrategyId }: ResultsTableProps) {
  const [sortField, setSortField] = useState<SortField>('winRate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [minWinRate, setMinWinRate] = useState('')
  const [minTrades, setMinTrades] = useState('')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results]

    // Apply filters
    if (minWinRate) {
      const min = parseFloat(minWinRate)
      if (!isNaN(min)) {
        filtered = filtered.filter(r => r.metrics.winRate >= min)
      }
    }

    if (minTrades) {
      const min = parseInt(minTrades)
      if (!isNaN(min)) {
        filtered = filtered.filter(r => r.metrics.totalTrades >= min)
      }
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a.metrics[sortField]
      const bValue = b.metrics[sortField]
      const diff = (aValue as number) - (bValue as number)
      return sortOrder === 'asc' ? diff : -diff
    })

    return filtered
  }, [results, sortField, sortOrder, minWinRate, minTrades])

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-8 px-2"
    >
      {label}
      {sortField === field ? (
        sortOrder === 'asc' ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>バックテスト結果</span>
          <span className="text-sm font-normal text-muted-foreground">
            {filteredAndSortedResults.length} / {results.length} 戦略
          </span>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="minWinRate" className="text-sm whitespace-nowrap">
              勝率 ≥
            </Label>
            <Input
              id="minWinRate"
              type="number"
              placeholder="50"
              value={minWinRate}
              onChange={(e) => setMinWinRate(e.target.value)}
              className="w-20 h-8"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="minTrades" className="text-sm whitespace-nowrap">
              トレード ≥
            </Label>
            <Input
              id="minTrades"
              type="number"
              placeholder="30"
              value={minTrades}
              onChange={(e) => setMinTrades(e.target.value)}
              className="w-20 h-8"
            />
            <span className="text-sm text-muted-foreground">回</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMinWinRate('')
              setMinTrades('')
            }}
          >
            リセット
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">戦略</th>
                <th className="text-right p-2">
                  <SortButton field="winRate" label="勝率" />
                </th>
                <th className="text-right p-2">
                  <SortButton field="totalTrades" label="回数" />
                </th>
                <th className="text-right p-2">平均益</th>
                <th className="text-right p-2">平均損</th>
                <th className="text-right p-2">
                  <SortButton field="totalReturn" label="リターン" />
                </th>
                <th className="text-right p-2">
                  <SortButton field="profitFactor" label="PF" />
                </th>
                <th className="text-right p-2">
                  <SortButton field="maxDrawdown" label="DD" />
                </th>
                <th className="text-right p-2">
                  <SortButton field="sharpeRatio" label="SR" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedResults.map((result) => (
                <tr
                  key={result.strategyId}
                  className={`border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedStrategyId === result.strategyId ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelectStrategy(result)}
                >
                  <td className="p-2">
                    <div className="font-medium">{result.strategyNameJa}</div>
                    <div className="text-xs text-muted-foreground">{result.strategyId}</div>
                  </td>
                  <td className={`text-right p-2 font-medium ${getValueColor(result.metrics.winRate - 50)}`}>
                    {formatNumber(result.metrics.winRate, 1)}%
                  </td>
                  <td className="text-right p-2">
                    {result.metrics.totalTrades}
                  </td>
                  <td className="text-right p-2 text-green-600 dark:text-green-400">
                    {formatPercent(result.metrics.avgWin)}
                  </td>
                  <td className="text-right p-2 text-red-600 dark:text-red-400">
                    {formatPercent(result.metrics.avgLoss)}
                  </td>
                  <td className={`text-right p-2 font-medium ${getValueColor(result.metrics.totalReturn)}`}>
                    <div className="flex items-center justify-end">
                      {result.metrics.totalReturn >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {formatPercent(result.metrics.totalReturn)}
                    </div>
                  </td>
                  <td className={`text-right p-2 ${getValueColor(result.metrics.profitFactor - 1)}`}>
                    {formatNumber(result.metrics.profitFactor, 2)}
                  </td>
                  <td className="text-right p-2 text-red-600 dark:text-red-400">
                    {formatPercent(-result.metrics.maxDrawdown)}
                  </td>
                  <td className={`text-right p-2 ${getValueColor(result.metrics.sharpeRatio)}`}>
                    {formatNumber(result.metrics.sharpeRatio, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAndSortedResults.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              条件に一致する戦略がありません
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
