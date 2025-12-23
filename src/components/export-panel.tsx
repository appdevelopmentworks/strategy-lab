'use client'

import { useState } from 'react'
import { Download, FileJson, FileSpreadsheet, Code, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BacktestResult } from '@/types'

interface ExportPanelProps {
  selectedResult: BacktestResult | null
  onClose?: () => void
}

type ExportFormat = 'csv' | 'json' | 'pinescript' | 'mql4' | 'mql5'

export function ExportPanel({ selectedResult, onClose }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [includeSignals, setIncludeSignals] = useState(true)
  const [includeTrades, setIncludeTrades] = useState(true)

  const handleExport = async () => {
    if (!selectedResult) return

    setIsExporting(true)

    try {
      if (exportFormat === 'csv' || exportFormat === 'json') {
        // Data export
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            format: exportFormat,
            data: {
              ...selectedResult,
              signals: selectedResult.signals.map(s => ({
                ...s,
                date: s.date instanceof Date ? s.date.toISOString() : s.date,
              })),
              trades: selectedResult.trades.map(t => ({
                ...t,
                entryDate: t.entryDate instanceof Date ? t.entryDate.toISOString() : t.entryDate,
                exitDate: t.exitDate instanceof Date ? t.exitDate.toISOString() : t.exitDate,
              })),
            },
            includeSignals,
            includeTrades,
          }),
        })

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedResult.strategyId}_${selectedResult.ticker}_export.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        // Code export
        const response = await fetch('/api/export/code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            strategyId: selectedResult.strategyId,
            strategyName: selectedResult.strategyNameJa,
            format: exportFormat,
            parameters: selectedResult.parameters,
          }),
        })

        const blob = await response.blob()
        const extension = exportFormat === 'pinescript' ? 'pine' : exportFormat
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedResult.strategyId}_strategy.${extension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (!selectedResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            エクスポート
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          <p>結果一覧タブから戦略を選択してください</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            エクスポート
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {selectedResult.strategyNameJa} ({selectedResult.ticker})
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <Label>エクスポート形式</Label>
          <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV（スプレッドシート）
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  JSON（データ）
                </div>
              </SelectItem>
              <SelectItem value="pinescript">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  PineScript（TradingView）
                </div>
              </SelectItem>
              <SelectItem value="mql4">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  MQL4（MetaTrader 4）
                </div>
              </SelectItem>
              <SelectItem value="mql5">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  MQL5（MetaTrader 5）
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options for data export */}
        {(exportFormat === 'csv' || exportFormat === 'json') && (
          <div className="space-y-3">
            <Label>オプション</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeSignals}
                  onChange={(e) => setIncludeSignals(e.target.checked)}
                  className="rounded border-gray-300"
                />
                シグナルデータを含める
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeTrades}
                  onChange={(e) => setIncludeTrades(e.target.checked)}
                  className="rounded border-gray-300"
                />
                取引履歴を含める
              </label>
            </div>
          </div>
        )}

        {/* Export info */}
        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">エクスポート内容</h4>
          {(exportFormat === 'csv' || exportFormat === 'json') ? (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>戦略情報とパラメーター</li>
              <li>パフォーマンス指標</li>
              {includeSignals && <li>売買シグナル一覧</li>}
              {includeTrades && <li>取引履歴（エントリー/エグジット）</li>}
            </ul>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>戦略ロジックのテンプレート</li>
              <li>現在のパラメーター設定</li>
              <li>エントリー/エグジット条件</li>
            </ul>
          )}
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full"
          size="lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              エクスポート中...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              ダウンロード
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
