'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, TrendingUp, Zap, Target, BarChart3, Volume2, Shapes, Layers, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { strategyRegistry } from '@/lib/strategies/registry'
import type { StrategyCategory } from '@/types'

const categoryInfo: Record<StrategyCategory, { name: string, icon: React.ReactNode, description: string, color: string }> = {
  'trend-following': {
    name: 'トレンドフォロー',
    icon: <TrendingUp className="h-5 w-5" />,
    description: 'トレンドの方向に沿って取引する戦略',
    color: 'bg-blue-500',
  },
  'momentum': {
    name: 'モメンタム',
    icon: <Zap className="h-5 w-5" />,
    description: '価格の勢いを利用した戦略',
    color: 'bg-yellow-500',
  },
  'breakout': {
    name: 'ブレイクアウト',
    icon: <Target className="h-5 w-5" />,
    description: 'サポート・レジスタンスの突破を狙う戦略',
    color: 'bg-green-500',
  },
  'mean-reversion': {
    name: 'ミーンリバーサル',
    icon: <BarChart3 className="h-5 w-5" />,
    description: '平均への回帰を狙う逆張り戦略',
    color: 'bg-purple-500',
  },
  'volume': {
    name: 'ボリューム',
    icon: <Volume2 className="h-5 w-5" />,
    description: '出来高を分析する戦略',
    color: 'bg-orange-500',
  },
  'pattern': {
    name: 'パターン',
    icon: <Shapes className="h-5 w-5" />,
    description: 'チャートパターンを認識する戦略',
    color: 'bg-pink-500',
  },
  'composite': {
    name: '複合',
    icon: <Layers className="h-5 w-5" />,
    description: '複数の指標を組み合わせた戦略',
    color: 'bg-indigo-500',
  },
  'calendar': {
    name: 'カレンダー',
    icon: <Calendar className="h-5 w-5" />,
    description: '曜日・月などの時間要素を利用した戦略',
    color: 'bg-teal-500',
  },
}

const categoryOrder: StrategyCategory[] = [
  'trend-following',
  'momentum',
  'breakout',
  'mean-reversion',
  'volume',
  'pattern',
  'composite',
  'calendar',
]

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory | null>(null)

  // Group strategies by category
  const strategiesByCategory = categoryOrder.reduce((acc, category) => {
    acc[category] = strategyRegistry.filter(s => s.category === category)
    return acc
  }, {} as Record<StrategyCategory, typeof strategyRegistry>)

  // Filter strategies
  const filteredStrategies = strategyRegistry.filter(strategy => {
    const matchesSearch = searchQuery === '' ||
      strategy.nameJa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.descriptionJa.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === null || strategy.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group filtered strategies by category
  const filteredByCategory = categoryOrder.reduce((acc, category) => {
    const strategies = filteredStrategies.filter(s => s.category === category)
    if (strategies.length > 0) {
      acc[category] = strategies
    }
    return acc
  }, {} as Record<StrategyCategory, typeof strategyRegistry>)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/icon.png" 
              alt="StrategyLab" 
              width={28} 
              height={28}
              className="rounded"
            />
            <span className="font-bold text-xl">StrategyLab</span>
          </Link>
          <span className="mx-3 text-muted-foreground">/</span>
          <span className="text-muted-foreground">戦略ガイド</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              アプリに戻る
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">72種類のトレード戦略ガイド</h1>
          <p className="text-muted-foreground">
            StrategyLabで利用可能な全戦略の解説です。各戦略の概要、パラメーター、使い方を確認できます。
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="戦略名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              すべて ({strategyRegistry.length})
            </Button>
            {categoryOrder.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="gap-1"
              >
                {categoryInfo[category].icon}
                <span className="hidden md:inline">{categoryInfo[category].name}</span>
                <span className="text-xs">({strategiesByCategory[category].length})</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Category Overview */}
        {selectedCategory === null && searchQuery === '' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {categoryOrder.map(category => (
              <Card 
                key={category} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="pt-4">
                  <div className={`w-10 h-10 rounded-lg ${categoryInfo[category].color} text-white flex items-center justify-center mb-3`}>
                    {categoryInfo[category].icon}
                  </div>
                  <h3 className="font-semibold">{categoryInfo[category].name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{categoryInfo[category].description}</p>
                  <p className="text-sm font-medium text-primary mt-2">{strategiesByCategory[category].length} 戦略</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Strategy List */}
        <div className="space-y-8">
          {Object.entries(filteredByCategory).map(([category, strategies]) => (
            <section key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg ${categoryInfo[category as StrategyCategory].color} text-white flex items-center justify-center`}>
                  {categoryInfo[category as StrategyCategory].icon}
                </div>
                <h2 className="text-xl font-semibold">{categoryInfo[category as StrategyCategory].name}</h2>
                <Badge variant="secondary">{strategies.length}</Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {strategies.map(strategy => (
                  <Card key={strategy.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{strategy.nameJa}</CardTitle>
                          <p className="text-xs text-muted-foreground">{strategy.name}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{strategy.id}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{strategy.descriptionJa}</p>
                      
                      {strategy.parameters.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium mb-2">パラメーター:</p>
                          <div className="flex flex-wrap gap-1">
                            {strategy.parameters.map(param => (
                              <Badge key={param.name} variant="secondary" className="text-xs">
                                {param.labelJa}: {param.default}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* No Results */}
        {Object.keys(filteredByCategory).length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">「{searchQuery}」に一致する戦略が見つかりません</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>
              フィルターをクリア
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>StrategyLab v1.5.1 - 72種類のトレード戦略</p>
        </div>
      </footer>
    </div>
  )
}
