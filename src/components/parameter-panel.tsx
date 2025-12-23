'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { strategyRegistry, getDefaultParams } from '@/lib/strategies/registry'
import type { BacktestResult, BacktestMetrics, StrategyParams, OHLCV } from '@/types'
import { formatPercent, formatNumber, getValueColor, debounce } from '@/lib/utils'

interface ParameterPanelProps {
  selectedResult: BacktestResult | null
  stockData: OHLCV[]
  onParameterChange: (strategyId: string, params: StrategyParams) => Promise<BacktestMetrics | null>
}

const STORAGE_KEY_PREFIX = 'strategylab-params-'
const PRESETS_KEY = 'strategylab-presets'

interface Preset {
  name: string
  strategyId: string
  params: StrategyParams
}

export function ParameterPanel({ selectedResult, stockData, onParameterChange }: ParameterPanelProps) {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('')
  const [params, setParams] = useState<StrategyParams>({})
  const [originalMetrics, setOriginalMetrics] = useState<BacktestMetrics | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<BacktestMetrics | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetName, setPresetName] = useState('')

  // Get strategy info
  const strategyInfo = strategyRegistry.find(s => s.id === selectedStrategyId)

  // Load presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(PRESETS_KEY)
    if (saved) {
      try {
        setPresets(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load presets:', e)
      }
    }
  }, [])

  // Update when selected result changes
  useEffect(() => {
    if (selectedResult) {
      setSelectedStrategyId(selectedResult.strategyId)
      setParams(selectedResult.parameters)
      setOriginalMetrics(selectedResult.metrics)
      setCurrentMetrics(selectedResult.metrics)
    }
  }, [selectedResult])

  // Load saved params when strategy changes
  useEffect(() => {
    if (!selectedStrategyId) return

    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${selectedStrategyId}`)
    if (saved) {
      try {
        const savedParams = JSON.parse(saved)
        setParams(savedParams)
      } catch (e) {
        console.error('Failed to load saved params:', e)
        // Fall back to defaults
        setParams(getDefaultParams(selectedStrategyId))
      }
    } else if (!selectedResult || selectedResult.strategyId !== selectedStrategyId) {
      // Use defaults if no saved params and not from selected result
      setParams(getDefaultParams(selectedStrategyId))
    }
  }, [selectedStrategyId, selectedResult])

  // Debounced recalculation
  const debouncedRecalculate = useCallback(
    debounce(async (strategyId: string, newParams: StrategyParams) => {
      if (!strategyId || stockData.length === 0) return

      setIsCalculating(true)
      try {
        const metrics = await onParameterChange(strategyId, newParams)
        if (metrics) {
          setCurrentMetrics(metrics)
        }
      } catch (error) {
        console.error('Recalculation failed:', error)
      } finally {
        setIsCalculating(false)
      }
    }, 500),
    [stockData, onParameterChange]
  )

  // Handle parameter change
  const handleParamChange = (paramName: string, value: number) => {
    const newParams = { ...params, [paramName]: value }
    setParams(newParams)
    debouncedRecalculate(selectedStrategyId, newParams)
  }

  // Save to localStorage
  const handleSave = () => {
    if (!selectedStrategyId) return
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${selectedStrategyId}`, JSON.stringify(params))
  }

  // Reset to defaults
  const handleReset = () => {
    if (!selectedStrategyId) return
    const defaults = getDefaultParams(selectedStrategyId)
    setParams(defaults)
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${selectedStrategyId}`)
    debouncedRecalculate(selectedStrategyId, defaults)
  }

  // Save as preset
  const handleSavePreset = () => {
    if (!selectedStrategyId || !presetName.trim()) return

    const newPreset: Preset = {
      name: presetName.trim(),
      strategyId: selectedStrategyId,
      params: { ...params },
    }

    const updatedPresets = [...presets.filter(p => 
      !(p.strategyId === selectedStrategyId && p.name === presetName.trim())
    ), newPreset]

    setPresets(updatedPresets)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updatedPresets))
    setPresetName('')
  }

  // Load preset
  const handleLoadPreset = (preset: Preset) => {
    setParams(preset.params)
    debouncedRecalculate(selectedStrategyId, preset.params)
  }

  // Calculate diff
  const getDiff = (current: number, original: number): { value: number; formatted: string } => {
    const diff = current - original
    const formatted = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)
    return { value: diff, formatted }
  }

  // Get presets for current strategy
  const strategyPresets = presets.filter(p => p.strategyId === selectedStrategyId)

  if (!selectedStrategyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>パラメーター調整</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p>結果一覧タブから戦略を選択してください</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>パラメーター調整</CardTitle>
            {strategyInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                {strategyInfo.nameJa} ({strategyInfo.id})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              リセット
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Strategy Selector */}
        <div className="space-y-2">
          <Label>戦略選択</Label>
          <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {strategyRegistry.map(strategy => (
                <SelectItem key={strategy.id} value={strategy.id}>
                  {strategy.nameJa} ({strategy.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Parameters */}
        {strategyInfo && (
          <div className="space-y-4">
            {strategyInfo.parameters.map(paramDef => {
              const value = params[paramDef.name] ?? paramDef.default

              return (
                <div key={paramDef.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={paramDef.name}>{paramDef.labelJa}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={paramDef.name}
                        type="number"
                        value={value}
                        onChange={(e) => {
                          const numValue = parseFloat(e.target.value)
                          if (!isNaN(numValue)) {
                            handleParamChange(paramDef.name, numValue)
                          }
                        }}
                        min={paramDef.min}
                        max={paramDef.max}
                        step={paramDef.step}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground w-8">{paramDef.min}</span>
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => handleParamChange(paramDef.name, v)}
                      min={paramDef.min}
                      max={paramDef.max}
                      step={paramDef.step}
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">{paramDef.max}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Results Preview */}
        {currentMetrics && originalMetrics && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">結果プレビュー</h4>
              {isCalculating && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">勝率:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{formatNumber(currentMetrics.winRate, 1)}%</span>
                  {(() => {
                    const diff = getDiff(currentMetrics.winRate, originalMetrics.winRate)
                    return (
                      <span className={`text-xs ${getValueColor(diff.value)}`}>
                        ({diff.formatted})
                      </span>
                    )
                  })()}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">リターン:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getValueColor(currentMetrics.totalReturn)}`}>
                    {formatPercent(currentMetrics.totalReturn)}
                  </span>
                  {(() => {
                    const diff = getDiff(currentMetrics.totalReturn, originalMetrics.totalReturn)
                    return (
                      <span className={`text-xs ${getValueColor(diff.value)}`}>
                        ({diff.formatted})
                      </span>
                    )
                  })()}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">トレード数:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currentMetrics.totalTrades}</span>
                  {(() => {
                    const diff = getDiff(currentMetrics.totalTrades, originalMetrics.totalTrades)
                    return diff.value !== 0 && (
                      <span className={`text-xs ${getValueColor(diff.value)}`}>
                        ({diff.formatted})
                      </span>
                    )
                  })()}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">PF:</span>
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${getValueColor(currentMetrics.profitFactor - 1)}`}>
                    {formatNumber(currentMetrics.profitFactor, 2)}
                  </span>
                  {(() => {
                    const diff = getDiff(currentMetrics.profitFactor, originalMetrics.profitFactor)
                    return (
                      <span className={`text-xs ${getValueColor(diff.value)}`}>
                        ({diff.formatted})
                      </span>
                    )
                  })()}
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">最大DD:</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {formatPercent(-currentMetrics.maxDrawdown)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">シャープ:</span>
                <span className={`font-medium ${getValueColor(currentMetrics.sharpeRatio)}`}>
                  {formatNumber(currentMetrics.sharpeRatio, 2)}
                </span>
              </div>
            </div>
            
            {/* Improvement Indicator */}
            {currentMetrics.totalReturn > originalMetrics.totalReturn && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                <TrendingUp className="h-4 w-4" />
                <span>パフォーマンスが向上しました！</span>
              </div>
            )}
            {currentMetrics.totalReturn < originalMetrics.totalReturn && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <TrendingDown className="h-4 w-4" />
                <span>パフォーマンスが低下しました</span>
              </div>
            )}
          </div>
        )}

        {/* Presets */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">プリセット</h4>
          
          {/* Save Preset */}
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="プリセット名"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              保存
            </Button>
          </div>
          
          {/* Preset List */}
          {strategyPresets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {strategyPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              保存されたプリセットはありません
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
