# StrategyLab 技術スタック仕様書

## 1. コア技術

| カテゴリ | 技術 | バージョン | 備考 |
|----------|------|-----------|------|
| **フレームワーク** | Next.js | 16.x | App Router、Turbopack使用 |
| **言語** | TypeScript | 5.1+ | 厳格モード有効 |
| **ランタイム** | Node.js | 20.9+ | Next.js 16の必須要件 |
| **パッケージマネージャ** | npm / pnpm | 最新 | pnpm推奨 |

---

## 2. フロントエンド

### 2.1 UIライブラリ

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| **shadcn/ui** | UIコンポーネント | Radix UIベース、カスタマイズ可能 |
| **Tailwind CSS** | スタイリング | v3.x |
| **Lucide React** | アイコン | shadcn/uiデフォルト |

### 2.2 チャートライブラリ

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| **Recharts** | 棒グラフ、ラインチャート | React向け、カスタマイズ容易 |
| **lightweight-charts** | ローソク足チャート | TradingView製、高性能 |

### 2.3 状態管理

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| **React Hooks** | ローカル状態 | useState, useReducer |
| **Context API** | グローバル状態 | 軽量な共有状態 |
| **Zustand** | 複雑な状態管理 | 必要に応じて導入 |

### 2.4 フォーム・バリデーション

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| **React Hook Form** | フォーム管理 | 高性能 |
| **Zod** | スキーマバリデーション | TypeScript親和性高 |

---

## 3. バックエンド（API Routes）

### 3.1 データ取得

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| **yahoo-finance2** | 株価データ取得 | yfinance互換のNode.js版 |

### 3.2 計算・分析

| ライブラリ | 用途 | 備考 |
|-----------|------|------|
| **technicalindicators** | テクニカル指標計算 | RSI, MACD, BB等 |
| **mathjs** | 数学計算 | 統計計算用 |

---

## 4. 開発ツール

### 4.1 コード品質

| ツール | 用途 | 備考 |
|--------|------|------|
| **Biome** | Linter & Formatter | Next.js 16推奨（ESLint非推奨） |
| **TypeScript** | 型チェック | strict mode |

### 4.2 テスト

| ツール | 用途 | 備考 |
|--------|------|------|
| **Vitest** | ユニットテスト | 高速、Vite互換 |
| **Playwright** | E2Eテスト | クロスブラウザ対応 |

### 4.3 その他

| ツール | 用途 | 備考 |
|--------|------|------|
| **Husky** | Git hooks | コミット前チェック |
| **lint-staged** | ステージファイルのみLint | 高速化 |

---

## 5. インフラ・デプロイ

| サービス | 用途 | 備考 |
|----------|------|------|
| **Vercel** | ホスティング | Next.js最適化 |
| **GitHub** | ソースコード管理 | CI/CD連携 |

---

## 6. プロジェクト構造

```
strategy-lab/
├── docs/                    # ドキュメント
├── public/                  # 静的ファイル
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── api/             # API Routes
│   │   │   ├── stock/
│   │   │   └── backtest/
│   │   └── (routes)/
│   │       ├── analyze/
│   │       ├── chart/
│   │       ├── optimize/
│   │       └── settings/
│   ├── components/          # UIコンポーネント
│   │   ├── ui/              # shadcn/ui
│   │   ├── charts/          # チャートコンポーネント
│   │   ├── backtest/        # バックテスト関連
│   │   └── common/          # 共通コンポーネント
│   ├── lib/                 # ユーティリティ
│   │   ├── strategies/      # 戦略ロジック
│   │   ├── indicators/      # テクニカル指標
│   │   ├── backtest/        # バックテストエンジン
│   │   ├── export/          # エクスポート機能
│   │   └── utils/           # 汎用ユーティリティ
│   ├── hooks/               # カスタムフック
│   ├── types/               # TypeScript型定義
│   └── constants/           # 定数定義
├── tests/                   # テストファイル
├── .env.local               # 環境変数（ローカル）
├── next.config.ts           # Next.js設定
├── tailwind.config.ts       # Tailwind設定
├── tsconfig.json            # TypeScript設定
└── package.json
```

---

## 7. Next.js 16 特有の設定

### 7.1 next.config.ts

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack（デフォルト有効）
  // Cache Components設定
  experimental: {
    // 必要に応じて追加
  },
}

export default nextConfig
```

### 7.2 proxy.ts（旧middleware.ts）

Next.js 16では `middleware.ts` が `proxy.ts` に変更されました。

```typescript
// src/proxy.ts
export function proxy(request: Request) {
  // ネットワーク境界の処理
}
```

---

## 8. 環境変数

| 変数名 | 用途 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | Yes |

---

## 9. 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2024-12-23 | 1.0 | 初版作成 |
