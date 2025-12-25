# CLAUDE.md - StrategyLab 開発ガイド

このドキュメントはClaude Codeでの開発を効率化するためのガイドです。

## プロジェクト概要

**StrategyLab** は72種類のトレード戦略を自動でバックテストし、最適な戦略とパラメーターを発見するためのWebアプリケーションです。

- **バージョン**: 1.5.1
- **開始日**: 2024-12-24
- **ステータス**: MVP完了

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript 5.1+ |
| UI | shadcn/ui, Tailwind CSS |
| チャート | Recharts, lightweight-charts |
| データソース | yahoo-finance2 (v3 chart API) |
| リンター | Biome |

## ディレクトリ構造

```
strategy-lab/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # APIエンドポイント
│   │   │   ├── backtest/      # バックテストAPI
│   │   │   ├── export/        # エクスポートAPI
│   │   │   ├── optimize/      # 最適化API群
│   │   │   │   ├── grid-search/
│   │   │   │   ├── monte-carlo/
│   │   │   │   ├── walk-forward/
│   │   │   │   └── portfolio/
│   │   │   └── stock/[ticker]/ # 株価取得API
│   │   ├── docs/              # 戦略ガイドページ
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # メインページ
│   │   └── globals.css        # グローバルCSS
│   ├── components/            # UIコンポーネント
│   │   ├── ui/               # shadcn/ui基本コンポーネント
│   │   ├── header.tsx        # ヘッダー（ナビゲーション）
│   │   ├── help-panel.tsx    # 使い方ヘルプ（スライドパネル）
│   │   ├── price-chart.tsx   # 価格チャート（lightweight-charts）
│   │   ├── results-table.tsx # 結果テーブル
│   │   ├── optimization-panel.tsx # 最適化パネル
│   │   ├── export-panel.tsx  # エクスポートパネル
│   │   └── ...
│   ├── lib/
│   │   ├── backtest/         # バックテストエンジン
│   │   │   └── engine.ts
│   │   ├── indicators/       # テクニカル指標
│   │   │   ├── basic.ts      # 基本指標（SMA, EMA, RSI等）
│   │   │   └── extended.ts   # 拡張指標
│   │   ├── optimization/     # 最適化ロジック
│   │   │   ├── grid-search.ts
│   │   │   ├── monte-carlo.ts
│   │   │   ├── walk-forward.ts
│   │   │   └── portfolio.ts
│   │   └── strategies/       # トレード戦略（72種類）
│   │       ├── registry.ts   # 戦略レジストリ（全戦略のメタデータ）
│   │       ├── trend-following/
│   │       ├── momentum/
│   │       ├── breakout/
│   │       ├── mean-reversion/
│   │       ├── volume/
│   │       ├── pattern/
│   │       ├── composite/
│   │       └── calendar/
│   └── types/                # TypeScript型定義
│       └── index.ts
├── public/                   # 静的ファイル（アイコン等）
├── docs/                     # 設計ドキュメント
└── CLAUDE.md                 # このファイル
```

## 重要ファイル

### 戦略関連
- `src/lib/strategies/registry.ts` - **全72戦略のメタデータ**（ID, 名前, パラメーター定義）
- `src/lib/strategies/*/` - 各戦略の実装

### API
- `src/app/api/stock/[ticker]/route.ts` - 株価取得（yahoo-finance2 v3）
- `src/app/api/backtest/route.ts` - バックテスト実行
- `src/app/api/optimize/*/route.ts` - 各種最適化

### UI
- `src/app/page.tsx` - メインページ（全体の状態管理）
- `src/components/header.tsx` - ヘッダー（ヘルプ・戦略ガイドへのリンク）
- `src/components/results-table.tsx` - 結果テーブル（ソート・フィルター）

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# リント
npm run lint

# 型チェック
npx tsc --noEmit
```

## コーディング規約

### TypeScript
- 厳格な型定義を使用
- `any`は避け、適切な型を定義
- nullチェックにはオプショナルチェーン(`?.`)とnullish coalescing(`??`)を使用

### コンポーネント
- 関数コンポーネント + フックを使用
- `'use client'`ディレクティブはクライアントコンポーネントのみに付与
- shadcn/uiコンポーネントを優先使用

### API
- App Router の Route Handlers を使用
- エラーハンドリングは try-catch で統一
- レスポンスは `NextResponse.json()` を使用

## よくある開発タスク

### 新しい戦略を追加する

1. `src/lib/strategies/{category}/` に戦略ファイルを作成
2. `src/lib/strategies/registry.ts` の `strategies` 配列に追加
3. `src/lib/strategies/registry.ts` の `strategyRegistry` にメタデータ追加

```typescript
// 戦略の基本構造
export const NewStrategy: Strategy = {
  id: 'XX001',
  name: 'New Strategy',
  category: 'trend-following',
  defaultParams: { period: 14 },
  execute: (data, params) => {
    // シグナル生成ロジック
    return signals
  }
}
```

### 新しい指標を追加する

1. `src/lib/indicators/basic.ts` または `extended.ts` に関数追加
2. 戦略内で import して使用

### UIコンポーネントを追加する

1. `npx shadcn@latest add {component}` でshadcn/uiコンポーネント追加
2. または `src/components/` にカスタムコンポーネント作成

## データフロー

```
[ユーザー入力]
    ↓
[/api/stock/[ticker]] → Yahoo Finance API → 株価データ
    ↓
[/api/backtest] → バックテストエンジン → 結果
    ↓
[ResultsTable / PriceChart / OptimizationPanel]
    ↓
[/api/export] → CSV / JSON / PineScript / MQL
```

## 注意事項

### yahoo-finance2 v3
- `historical()` は非推奨、`chart()` を使用
- `suppressNotices(['ripHistorical', 'yahooSurvey'])` で警告抑制
- nullデータのフィルタリングが必要

```typescript
yahooFinance.suppressNotices(['ripHistorical', 'yahooSurvey'])
const result = await yahooFinance.chart(ticker, { period1, period2 })
const data = result.quotes
  .filter(item => item.open !== null && item.high !== null && ...)
  .map(item => ({ date: item.date, open: item.open!, ... }))
```

### 期間と最低データ日数
短期間（3ヶ月など）では長期指標（200日MA等）が機能しない。
期間別の最低データ日数マッピングが `/api/backtest/route.ts` に定義済み。

### ロングオンリー
現在はロング（買い）のみ対応。チャートシグナルは「Entry」「Exit」表記。

## トラブルシューティング

### ビルドエラー
```bash
# 型エラーの確認
npx tsc --noEmit

# キャッシュクリア
rm -rf .next
npm run build
```

### データ取得エラー
- ティッカーコード確認（日本株は `.T` 付き: `7203.T`）
- Yahoo Finance APIの一時的な問題の可能性

### チャートが表示されない
- lightweight-chartsはクライアントサイドのみ
- `'use client'` ディレクティブ確認

## 関連ドキュメント

- `README.md` - プロジェクト概要・使い方
- `TODO.md` - 開発進捗・実装済み機能一覧
- `docs/` - 詳細設計ドキュメント
  - `01_REQUIREMENTS.md` - 要件定義
  - `02_TECH_STACK.md` - 技術スタック詳細
  - `03_STRATEGIES.md` - 戦略仕様
  - `04_UI_DESIGN.md` - UI設計
  - `05_DEVELOPMENT_PHASES.md` - 開発フェーズ
  - `06_API_SPEC.md` - API仕様
  - `07_EXPORT_SPEC.md` - エクスポート仕様

## 更新履歴

- 2024-12-25: v1.5.1 - CLAUDE.md作成、MVP完了
