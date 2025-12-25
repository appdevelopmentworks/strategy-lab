'use client'

import { X, BarChart3, LineChart, Settings, Search, Download, GitCompare, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HelpPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Slide Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l shadow-xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">使い方ガイド</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Quick Start */}
          <section>
            <h3 className="font-semibold text-primary mb-2">🚀 クイックスタート</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>ティッカーコードを入力（例: AAPL, 7203.T）</li>
              <li>期間を選択（1年〜10年）</li>
              <li>「分析開始」をクリック</li>
              <li>72戦略のバックテスト結果を確認</li>
            </ol>
          </section>

          {/* Tabs Guide */}
          <section>
            <h3 className="font-semibold text-primary mb-3">📑 タブの説明</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">結果一覧</p>
                  <p className="text-xs text-muted-foreground">全戦略のパフォーマンスを比較。勝率、リターン、PFでソート可能。</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <GitCompare className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">銘柄比較</p>
                  <p className="text-xs text-muted-foreground">複数銘柄のパフォーマンスを横断比較。</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <LineChart className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">チャート</p>
                  <p className="text-xs text-muted-foreground">価格チャートと売買シグナルを可視化。戦略を選択すると表示。</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Settings className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">パラメーター</p>
                  <p className="text-xs text-muted-foreground">戦略のパラメーターを調整してリアルタイム検証。</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Search className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">最適化</p>
                  <p className="text-xs text-muted-foreground">グリッドサーチ、モンテカルロ、ウォークフォワード分析。</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Download className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">エクスポート</p>
                  <p className="text-xs text-muted-foreground">PineScript、MQL4/5、Python形式で出力。</p>
                </div>
              </div>
            </div>
          </section>

          {/* Metrics Guide */}
          <section>
            <h3 className="font-semibold text-primary mb-3">📊 指標の見方</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">勝率</span>
                <span>勝ちトレード ÷ 総トレード</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">PF（プロフィットファクター）</span>
                <span>総利益 ÷ 総損失</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">DD（最大ドローダウン）</span>
                <span>最大下落率</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">SR（シャープレシオ）</span>
                <span>リスク調整後リターン</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">ケリー基準</span>
                <span>最適ポジションサイズ%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">カルマーレシオ</span>
                <span>CAGR ÷ 最大DD</span>
              </div>
            </div>
          </section>

          {/* Chart Signals */}
          <section>
            <h3 className="font-semibold text-primary mb-3">📈 チャートシグナル</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">Entry</span>
                <span className="text-muted-foreground">= 買いエントリー</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">Exit</span>
                <span className="text-muted-foreground">= 決済（売り）</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                ※ 現在はロング（買い）のみ対応しています
              </p>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="font-semibold text-primary mb-2">💡 Tips</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>複数銘柄を入力すると比較分析ができます</li>
              <li>結果テーブルの行をクリックで戦略を選択</li>
              <li>ウォークフォワード分析で過学習をチェック</li>
              <li>PF 1.5以上、DD -20%以下が一つの目安</li>
            </ul>
          </section>

          {/* Ticker Examples */}
          <section>
            <h3 className="font-semibold text-primary mb-2">🏷️ ティッカー例</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">米国株</p>
                <p className="text-xs text-muted-foreground">AAPL, NVDA, MSFT, GOOGL</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">日本株</p>
                <p className="text-xs text-muted-foreground">7203.T, 9984.T, 6758.T</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">指数</p>
                <p className="text-xs text-muted-foreground">^GSPC, ^N225, ^DJI</p>
              </div>
              <div className="p-2 rounded bg-muted/50">
                <p className="font-medium">ETF</p>
                <p className="text-xs text-muted-foreground">SPY, QQQ, VOO</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
