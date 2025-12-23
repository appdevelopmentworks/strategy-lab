# StrategyLab API仕様書

## 概要

本ドキュメントでは、StrategyLabのAPI Routes仕様を定義します。
Next.js 16のApp RouterのRoute Handlers形式で実装します。

---

## エンドポイント一覧

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/stock/:ticker` | 株価データ取得 |
| POST | `/api/backtest` | バックテスト実行 |
| POST | `/api/backtest/all` | 全戦略バックテスト |
| POST | `/api/optimize` | パラメーター最適化 |
| GET | `/api/strategies` | 戦略一覧取得 |
| GET | `/api/strategies/:id` | 戦略詳細取得 |
| POST | `/api/export/signals` | シグナルデータ出力 |
| POST | `/api/export/code` | コード生成 |

---

## 1. 株価データ取得

### GET `/api/stock/:ticker`

指定したティッカーの株価データを取得します。

#### リクエスト

| パラメーター | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| ticker | string | Yes | ティッカーコード（例: AAPL, 7203.T） |
| period | string | No | 期間（1y, 3y, 5y, 10y）デフォルト: 5y |
| interval | string | No | 間隔（1d, 1wk, 1mo）デフォルト: 1d |

#### レスポンス

```typescript
interface StockDataResponse {
  success: boolean
  data: {
    ticker: string
    currency: string
    data: OHLCV[]
  }
  error?: string
}

interface OHLCV {
  date: string      // ISO 8601形式
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjClose: number
}
```

#### 例

```bash
GET /api/stock/AAPL?period=5y&interval=1d
```

```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "currency": "USD",
    "data": [
      {
        "date": "2019-12-23T00:00:00.000Z",
        "open": 71.25,
        "high": 71.63,
        "low": 71.15,
        "close": 71.48,
        "volume": 75798500,
        "adjClose": 69.82
      }
    ]
  }
}
```

---

## 2. バックテスト実行

### POST `/api/backtest`

単一戦略のバックテストを実行します。

#### リクエスト

```typescript
interface BacktestRequest {
  ticker: string
  strategyId: string
  period: string          // 1y, 3y, 5y, 10y
  parameters?: Record<string, number>
}
```

#### レスポンス

```typescript
interface BacktestResponse {
  success: boolean
  data: {
    strategyId: string
    strategyName: string
    ticker: string
    period: string
    parameters: Record<string, number>
    results: BacktestResults
    signals: Signal[]
  }
  error?: string
}

interface BacktestResults {
  winRate: number               // 勝率（%）
  totalTrades: number           // トレード回数
  avgWin: number                // 平均利益（%）
  avgLoss: number               // 平均損失（%）
  totalReturn: number           // 総リターン（%）
  profitFactor: number          // プロフィットファクター
  maxDrawdown: number           // 最大ドローダウン（%）
  sharpeRatio: number           // シャープレシオ
  maxConsecutiveWins: number    // 最大連続勝ち
  maxConsecutiveLosses: number  // 最大連続負け
  avgHoldingPeriod: number      // 平均保有期間（日）
}

interface Signal {
  date: string
  type: 'BUY' | 'SELL'
  price: number
  indicatorValues?: Record<string, number>
}
```

#### 例

```bash
POST /api/backtest
Content-Type: application/json

{
  "ticker": "AAPL",
  "strategyId": "MO002",
  "period": "5y",
  "parameters": {
    "period": 14,
    "oversold": 30,
    "overbought": 70
  }
}
```

---

## 3. 全戦略バックテスト

### POST `/api/backtest/all`

指定した銘柄に対して全戦略のバックテストを実行します。

#### リクエスト

```typescript
interface BacktestAllRequest {
  tickers: string[]     // 最大5銘柄
  period: string
  minTrades?: number    // 最低トレード回数フィルター
}
```

#### レスポンス

```typescript
interface BacktestAllResponse {
  success: boolean
  data: {
    ticker: string
    results: StrategyResult[]
  }[]
  error?: string
}

interface StrategyResult {
  strategyId: string
  strategyName: string
  category: string
  results: BacktestResults
  parameters: Record<string, number>
}
```

---

## 4. パラメーター最適化

### POST `/api/optimize`

グリッドサーチによるパラメーター最適化を実行します。

#### リクエスト

```typescript
interface OptimizeRequest {
  ticker: string
  strategyId: string
  period: string
  objective: 'winRate' | 'totalReturn' | 'profitFactor' | 'sharpeRatio'
  parameterRanges: ParameterRange[]
  minTrades?: number
  walkForward?: boolean  // ウォークフォワード検証
  trainRatio?: number    // 学習データ比率（デフォルト: 0.7）
}

interface ParameterRange {
  name: string
  min: number
  max: number
  step: number
}
```

#### レスポンス

```typescript
interface OptimizeResponse {
  success: boolean
  data: {
    bestParameters: Record<string, number>
    bestScore: number
    objective: string
    trainResults?: BacktestResults  // ウォークフォワード時
    testResults?: BacktestResults   // ウォークフォワード時
    overfitRisk?: 'low' | 'medium' | 'high'
    allResults: OptimizationResult[]
  }
  error?: string
}

interface OptimizationResult {
  parameters: Record<string, number>
  score: number
  results: BacktestResults
}
```

#### 例

```bash
POST /api/optimize
Content-Type: application/json

{
  "ticker": "AAPL",
  "strategyId": "MO002",
  "period": "5y",
  "objective": "winRate",
  "parameterRanges": [
    { "name": "period", "min": 10, "max": 20, "step": 2 },
    { "name": "oversold", "min": 20, "max": 35, "step": 5 },
    { "name": "overbought", "min": 65, "max": 80, "step": 5 }
  ],
  "minTrades": 30,
  "walkForward": true,
  "trainRatio": 0.7
}
```

---

## 5. 戦略一覧取得

### GET `/api/strategies`

実装済み戦略の一覧を取得します。

#### レスポンス

```typescript
interface StrategiesResponse {
  success: boolean
  data: StrategyInfo[]
}

interface StrategyInfo {
  id: string
  name: string
  nameJa: string
  category: string
  description: string
  parameters: ParameterDefinition[]
}

interface ParameterDefinition {
  name: string
  type: 'number'
  default: number
  min: number
  max: number
  step: number
  description: string
}
```

---

## 6. 戦略詳細取得

### GET `/api/strategies/:id`

指定した戦略の詳細情報を取得します。

#### レスポンス

```typescript
interface StrategyDetailResponse {
  success: boolean
  data: StrategyInfo & {
    logic: string           // ロジック説明
    entryCondition: string  // エントリー条件
    exitCondition: string   // エグジット条件
    pros: string[]          // メリット
    cons: string[]          // デメリット
    bestFor: string[]       // 適した相場環境
  }
}
```

---

## 7. シグナルデータ出力

### POST `/api/export/signals`

バックテスト結果のシグナルデータを出力形式に変換します。

#### リクエスト

```typescript
interface ExportSignalsRequest {
  ticker: string
  strategyId: string
  parameters: Record<string, number>
  period: string
  format: 'csv' | 'json'
}
```

#### レスポンス

CSVまたはJSONデータ（Content-Dispositionヘッダー付き）

---

## 8. コード生成

### POST `/api/export/code`

指定した戦略のトレードコードを生成します。

#### リクエスト

```typescript
interface ExportCodeRequest {
  strategyId: string
  parameters: Record<string, number>
  format: 'mql4' | 'mql5' | 'pinescript-indicator' | 'pinescript-strategy'
}
```

#### レスポンス

```typescript
interface ExportCodeResponse {
  success: boolean
  data: {
    code: string
    filename: string
    language: string
  }
}
```

---

## エラーレスポンス

全エンドポイント共通のエラー形式：

```typescript
interface ErrorResponse {
  success: false
  error: string
  code: string
  details?: unknown
}
```

### エラーコード

| コード | 説明 |
|--------|------|
| `INVALID_TICKER` | 無効なティッカーコード |
| `INVALID_STRATEGY` | 存在しない戦略ID |
| `INVALID_PARAMETERS` | パラメーターエラー |
| `DATA_FETCH_ERROR` | データ取得エラー |
| `CALCULATION_ERROR` | 計算エラー |
| `RATE_LIMIT` | レート制限超過 |

---

## レート制限

| エンドポイント | 制限 |
|---------------|------|
| `/api/stock/*` | 100リクエスト/分 |
| `/api/backtest` | 30リクエスト/分 |
| `/api/backtest/all` | 10リクエスト/分 |
| `/api/optimize` | 5リクエスト/分 |

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2024-12-23 | 1.0 | 初版作成 |
