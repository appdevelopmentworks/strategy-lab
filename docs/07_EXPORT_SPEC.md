# StrategyLab エクスポート仕様書

## 概要

本ドキュメントでは、StrategyLabのエクスポート機能の詳細仕様を定義します。
シグナルデータ出力とMQL/PineScriptコード生成の両方をサポートします。

---

## 1. シグナルデータ出力

### 1.1 CSV形式

```csv
date,ticker,signal,price,strategy_id,strategy_name,profit_pct,indicator_rsi,indicator_sma_short,indicator_sma_long
2024-01-15,AAPL,BUY,185.50,MO002,RSI逆張り,,28.5,,
2024-01-22,AAPL,SELL,192.30,MO002,RSI逆張り,3.67,72.1,,
2024-02-05,AAPL,BUY,178.20,MO002,RSI逆張り,,25.8,,
2024-02-15,AAPL,SELL,183.40,MO002,RSI逆張り,2.92,68.5,,
```

### 1.2 JSON形式

```json
{
  "meta": {
    "ticker": "AAPL",
    "strategy": {
      "id": "MO002",
      "name": "RSI逆張り",
      "parameters": {
        "period": 14,
        "oversold": 30,
        "overbought": 70
      }
    },
    "period": "5y",
    "generated_at": "2024-12-23T10:30:00Z"
  },
  "results": {
    "win_rate": 72.5,
    "total_trades": 45,
    "total_return": 156.2,
    "profit_factor": 2.4,
    "max_drawdown": -12.3,
    "sharpe_ratio": 1.85
  },
  "signals": [
    {
      "date": "2024-01-15",
      "type": "BUY",
      "price": 185.50,
      "indicators": {
        "rsi": 28.5
      }
    },
    {
      "date": "2024-01-22",
      "type": "SELL",
      "price": 192.30,
      "profit_pct": 3.67,
      "indicators": {
        "rsi": 72.1
      }
    }
  ]
}
```

---

## 2. MQLコード生成

### 2.1 MQL4 テンプレート（RSI逆張り例）

```mql4
//+------------------------------------------------------------------+
//| StrategyLab Auto-Generated Expert Advisor                        |
//| Strategy: RSI Contrarian (MO002)                                 |
//| Generated: 2024-12-23                                            |
//+------------------------------------------------------------------+
#property copyright "StrategyLab"
#property link      "https://strategy-lab.vercel.app"
#property version   "1.00"
#property strict

//--- Input Parameters
input int    RSI_Period    = 14;     // RSI Period
input int    RSI_Oversold  = 30;     // Oversold Level
input int    RSI_Overbought = 70;    // Overbought Level
input double LotSize       = 0.1;    // Lot Size
input int    StopLoss      = 100;    // Stop Loss (points)
input int    TakeProfit    = 200;    // Take Profit (points)
input int    MagicNumber   = 12345;  // Magic Number

//--- Global Variables
int rsiHandle;
double rsiBuffer[];

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   rsiHandle = iRSI(NULL, 0, RSI_Period, PRICE_CLOSE);
   if(rsiHandle == INVALID_HANDLE)
   {
      Print("Failed to create RSI indicator");
      return(INIT_FAILED);
   }
   ArraySetAsSeries(rsiBuffer, true);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(rsiHandle != INVALID_HANDLE)
      IndicatorRelease(rsiHandle);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- Check for new bar
   static datetime lastBar = 0;
   datetime currentBar = iTime(NULL, 0, 0);
   if(lastBar == currentBar) return;
   lastBar = currentBar;
   
   //--- Get RSI value
   if(CopyBuffer(rsiHandle, 0, 0, 3, rsiBuffer) < 3) return;
   double rsi = rsiBuffer[1];
   double rsiPrev = rsiBuffer[2];
   
   //--- Check existing positions
   bool hasPosition = false;
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderMagicNumber() == MagicNumber && OrderSymbol() == Symbol())
         {
            hasPosition = true;
            
            //--- Exit condition: RSI crosses overbought
            if(OrderType() == OP_BUY && rsiPrev < RSI_Overbought && rsi >= RSI_Overbought)
            {
               OrderClose(OrderTicket(), OrderLots(), Bid, 3, clrRed);
            }
            break;
         }
      }
   }
   
   //--- Entry condition: RSI crosses below oversold (Buy signal)
   if(!hasPosition && rsiPrev >= RSI_Oversold && rsi < RSI_Oversold)
   {
      double sl = Ask - StopLoss * Point;
      double tp = Ask + TakeProfit * Point;
      OrderSend(Symbol(), OP_BUY, LotSize, Ask, 3, sl, tp, "RSI Contrarian", MagicNumber, 0, clrGreen);
   }
}

//+------------------------------------------------------------------+
```

### 2.2 MQL5 テンプレート（RSI逆張り例）

```mql5
//+------------------------------------------------------------------+
//| StrategyLab Auto-Generated Expert Advisor                        |
//| Strategy: RSI Contrarian (MO002)                                 |
//| Generated: 2024-12-23                                            |
//+------------------------------------------------------------------+
#property copyright "StrategyLab"
#property link      "https://strategy-lab.vercel.app"
#property version   "1.00"

#include <Trade\Trade.mqh>

//--- Input Parameters
input int    RSI_Period     = 14;      // RSI Period
input int    RSI_Oversold   = 30;      // Oversold Level
input int    RSI_Overbought = 70;      // Overbought Level
input double LotSize        = 0.1;     // Lot Size
input int    StopLoss       = 100;     // Stop Loss (points)
input int    TakeProfit     = 200;     // Take Profit (points)
input ulong  MagicNumber    = 12345;   // Magic Number

//--- Global Variables
CTrade trade;
int rsiHandle;
double rsiBuffer[];

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(MagicNumber);
   
   rsiHandle = iRSI(_Symbol, PERIOD_CURRENT, RSI_Period, PRICE_CLOSE);
   if(rsiHandle == INVALID_HANDLE)
   {
      Print("Failed to create RSI indicator");
      return(INIT_FAILED);
   }
   
   ArraySetAsSeries(rsiBuffer, true);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(rsiHandle != INVALID_HANDLE)
      IndicatorRelease(rsiHandle);
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick()
{
   //--- Check for new bar
   static datetime lastBar = 0;
   datetime currentBar = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(lastBar == currentBar) return;
   lastBar = currentBar;
   
   //--- Get RSI values
   if(CopyBuffer(rsiHandle, 0, 0, 3, rsiBuffer) < 3) return;
   double rsi = rsiBuffer[1];
   double rsiPrev = rsiBuffer[2];
   
   //--- Check existing positions
   bool hasPosition = false;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
      {
         if(PositionGetInteger(POSITION_MAGIC) == MagicNumber && 
            PositionGetString(POSITION_SYMBOL) == _Symbol)
         {
            hasPosition = true;
            
            //--- Exit condition
            if(PositionGetInteger(POSITION_TYPE) == POSITION_TYPE_BUY && 
               rsiPrev < RSI_Overbought && rsi >= RSI_Overbought)
            {
               trade.PositionClose(ticket);
            }
            break;
         }
      }
   }
   
   //--- Entry condition
   if(!hasPosition && rsiPrev >= RSI_Oversold && rsi < RSI_Oversold)
   {
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double sl = ask - StopLoss * _Point;
      double tp = ask + TakeProfit * _Point;
      trade.Buy(LotSize, _Symbol, ask, sl, tp, "RSI Contrarian");
   }
}

//+------------------------------------------------------------------+
```

---

## 3. PineScript生成

### 3.1 インジケーター形式（RSI逆張り例）

```pine
// StrategyLab Auto-Generated Indicator
// Strategy: RSI Contrarian (MO002)
// Generated: 2024-12-23

//@version=5
indicator("RSI Contrarian Signals", overlay=true)

// Parameters
rsiPeriod = input.int(14, "RSI Period", minval=2, maxval=50)
oversoldLevel = input.int(30, "Oversold Level", minval=1, maxval=50)
overboughtLevel = input.int(70, "Overbought Level", minval=50, maxval=99)

// Calculate RSI
rsiValue = ta.rsi(close, rsiPeriod)

// Signal conditions
buySignal = ta.crossunder(rsiValue, oversoldLevel)
sellSignal = ta.crossover(rsiValue, overboughtLevel)

// Plot signals
plotshape(buySignal, title="Buy Signal", location=location.belowbar, 
          color=color.green, style=shape.triangleup, size=size.small, text="BUY")
plotshape(sellSignal, title="Sell Signal", location=location.abovebar, 
          color=color.red, style=shape.triangledown, size=size.small, text="SELL")

// RSI Panel
hline(oversoldLevel, "Oversold", color=color.green, linestyle=hline.style_dashed)
hline(overboughtLevel, "Overbought", color=color.red, linestyle=hline.style_dashed)

// Alerts
alertcondition(buySignal, title="RSI Buy Signal", message="RSI Contrarian: Buy Signal on {{ticker}}")
alertcondition(sellSignal, title="RSI Sell Signal", message="RSI Contrarian: Sell Signal on {{ticker}}")
```

### 3.2 ストラテジー形式（RSI逆張り例）

```pine
// StrategyLab Auto-Generated Strategy
// Strategy: RSI Contrarian (MO002)
// Generated: 2024-12-23

//@version=5
strategy("RSI Contrarian Strategy", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=100)

// Parameters
rsiPeriod = input.int(14, "RSI Period", minval=2, maxval=50)
oversoldLevel = input.int(30, "Oversold Level", minval=1, maxval=50)
overboughtLevel = input.int(70, "Overbought Level", minval=50, maxval=99)

// Risk Management
useStopLoss = input.bool(true, "Use Stop Loss")
stopLossPercent = input.float(5.0, "Stop Loss %", minval=0.1, maxval=20)
useTakeProfit = input.bool(true, "Use Take Profit")
takeProfitPercent = input.float(10.0, "Take Profit %", minval=0.1, maxval=50)

// Calculate RSI
rsiValue = ta.rsi(close, rsiPeriod)

// Signal conditions
buySignal = ta.crossunder(rsiValue, oversoldLevel)
sellSignal = ta.crossover(rsiValue, overboughtLevel)

// Execute trades
if (buySignal)
    stopLoss = useStopLoss ? close * (1 - stopLossPercent/100) : na
    takeProfit = useTakeProfit ? close * (1 + takeProfitPercent/100) : na
    strategy.entry("Long", strategy.long)
    if (useStopLoss)
        strategy.exit("Exit Long", "Long", stop=stopLoss, limit=takeProfit)

if (sellSignal)
    strategy.close("Long")

// Plot signals
plotshape(buySignal, title="Buy Signal", location=location.belowbar, 
          color=color.green, style=shape.triangleup, size=size.small)
plotshape(sellSignal, title="Sell Signal", location=location.abovebar, 
          color=color.red, style=shape.triangledown, size=size.small)

// Performance table
var table perfTable = table.new(position.top_right, 2, 4, bgcolor=color.new(color.black, 80))
if (barstate.islast)
    table.cell(perfTable, 0, 0, "Metric", text_color=color.white)
    table.cell(perfTable, 1, 0, "Value", text_color=color.white)
    table.cell(perfTable, 0, 1, "Net Profit", text_color=color.white)
    table.cell(perfTable, 1, 1, str.tostring(strategy.netprofit, "#.##"), text_color=color.green)
    table.cell(perfTable, 0, 2, "Win Rate", text_color=color.white)
    table.cell(perfTable, 1, 2, str.tostring(strategy.wintrades / strategy.closedtrades * 100, "#.#") + "%", text_color=color.green)
    table.cell(perfTable, 0, 3, "Total Trades", text_color=color.white)
    table.cell(perfTable, 1, 3, str.tostring(strategy.closedtrades), text_color=color.white)
```

---

## 4. 戦略別テンプレート対応表

| 戦略ID | MQL4 | MQL5 | Pine Indicator | Pine Strategy |
|--------|------|------|----------------|---------------|
| TF001 | ✅ | ✅ | ✅ | ✅ |
| TF002 | ✅ | ✅ | ✅ | ✅ |
| TF003 | ✅ | ✅ | ✅ | ✅ |
| MO001 | ✅ | ✅ | ✅ | ✅ |
| MO002 | ✅ | ✅ | ✅ | ✅ |
| MO003 | ✅ | ✅ | ✅ | ✅ |
| BO001 | ✅ | ✅ | ✅ | ✅ |
| BO002 | ✅ | ✅ | ✅ | ✅ |
| MR001 | ✅ | ✅ | ✅ | ✅ |
| PA001 | ✅ | ✅ | ✅ | ✅ |
| ... | ... | ... | ... | ... |

※ Phase 7で全40戦略のテンプレートを実装

---

## 5. パラメーター出力形式

### 5.1 JSON形式

```json
{
  "version": "1.0",
  "exported_at": "2024-12-23T10:30:00Z",
  "strategies": [
    {
      "id": "MO002",
      "name": "RSI逆張り",
      "parameters": {
        "period": 12,
        "oversold": 25,
        "overbought": 75
      },
      "optimized_for": "AAPL",
      "optimization_target": "winRate",
      "backtest_results": {
        "win_rate": 76.2,
        "total_return": 182.5,
        "profit_factor": 2.8
      }
    }
  ]
}
```

### 5.2 インポート処理

```typescript
interface ParameterImport {
  version: string
  strategies: {
    id: string
    parameters: Record<string, number>
  }[]
}

// LocalStorageに保存
function importParameters(data: ParameterImport): void {
  data.strategies.forEach(strategy => {
    localStorage.setItem(
      `strategy-params-${strategy.id}`,
      JSON.stringify(strategy.parameters)
    )
  })
}
```

---

## 6. ファイル命名規則

| 出力形式 | ファイル名例 |
|----------|-------------|
| CSV | `AAPL_MO002_signals_20241223.csv` |
| JSON | `AAPL_MO002_signals_20241223.json` |
| MQL4 | `RSI_Contrarian_MO002.mq4` |
| MQL5 | `RSI_Contrarian_MO002.mq5` |
| Pine Indicator | `RSI_Contrarian_Indicator.pine` |
| Pine Strategy | `RSI_Contrarian_Strategy.pine` |
| Parameters | `strategy_params_20241223.json` |

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2024-12-23 | 1.0 | 初版作成 |
