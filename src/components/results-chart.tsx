'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BacktestResult, SortField } from '@/types'

interface ResultsChartProps {
  results: BacktestResult[]
  sortField: SortField
  onSortFieldChange: (field: SortField) => void
}

const COLORS = {
  positive: '#22c55e',  // green-500
  negative: '#ef4444',  // red-500
  neutral: '#3b82f6',   // blue-500
}

const fieldLabels: Record<SortField, string> = {
  winRate: '勝率 (%)',
  totalReturn: '総リターン (%)',
  profitFactor: 'プロフィットファクター',
  sharpeRatio: 'シャープレシオ',
  maxDrawdown: '最大ドローダウン (%)',
  totalTrades: 'トレード回数',
}

export function ResultsChart({ results, sortField, onSortFieldChange }: ResultsChartProps) {
  const chartData = useMemo(() => {
    return results
      .map(r => ({
        name: r.strategyNameJa,
        id: r.strategyId,
        value: r.metrics[sortField],
        isPositive: sortField === 'maxDrawdown' 
          ? r.metrics[sortField] < 10 
          : r.metrics[sortField] > (sortField === 'winRate' ? 50 : 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15) // Top 15
  }, [results, sortField])

  const getColor = (isPositive: boolean) => {
    if (sortField === 'totalTrades') return COLORS.neutral
    return isPositive ? COLORS.positive : COLORS.negative
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>戦略比較チャート</CardTitle>
          <Select value={sortField} onValueChange={(v) => onSortFieldChange(v as SortField)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="winRate">勝率</SelectItem>
              <SelectItem value="totalReturn">総リターン</SelectItem>
              <SelectItem value="profitFactor">PF</SelectItem>
              <SelectItem value="sharpeRatio">シャープレシオ</SelectItem>
              <SelectItem value="maxDrawdown">最大DD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                type="number"
                tickFormatter={(value) => 
                  sortField === 'profitFactor' || sortField === 'sharpeRatio'
                    ? value.toFixed(1)
                    : `${value.toFixed(0)}${sortField !== 'totalTrades' ? '%' : ''}`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  sortField === 'profitFactor' || sortField === 'sharpeRatio'
                    ? value.toFixed(2)
                    : `${value.toFixed(1)}${sortField !== 'totalTrades' ? '%' : '回'}`,
                  fieldLabels[sortField],
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.isPositive)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
