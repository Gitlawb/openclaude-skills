---
name: btc-market-signal
description: >
  btc_market_signal — a READ-ONLY, INFORMATIONAL BTC market-regime read for AI agents.
  It reports the current regime (trending up / down vs chop), a directional bias when
  trending, a conviction score, and a regime-conditional breakout strategy's out-of-sample
  Sharpe — and it ABSTAINS in chop. Crucial honesty flag baked into every response: that
  breakout pattern is BTC-sample-specific and does NOT generalize to ETH/SOL/BNB (it loses
  on them), so it is sample-specific, NOT proven alpha — treat the read as INFORMATIONAL,
  not a tradeable edge. BTC only. NOT a trade and NOT investment advice; the calling agent
  must never auto-execute on it; there is no order/sign/transfer method. Composes with the
  `mainstreet` reputation skill (counterparty trust + a market regime read, one ecosystem).
metadata:
  {
    "clawdbot":
      {
        "emoji": "📈",
        "homepage": "https://github.com/Gitlawb/openclaude-skills/tree/main/skills/btc-market-signal",
        "requires": { "bins": ["node"] },
      },
  }
---

# btc_market_signal

A READ-ONLY MCP tool that gives an agent an **honest, calibrated BTC regime read** — and is
candid about the limits of its own edge. Built on a self-verifying quant desk (regime detection,
breakout, backtest, **walk-forward + cross-asset validation**).

## The tool
```
btc_market_signal()  →  {
  asset: "BTC",
  decision: "SIGNAL" | "ABSTAIN",
  regime: "BULL" | "BEAR" | "NEUTRAL",
  directionBias: "long-bias" | "short-bias" | "neutral" | null,
  conviction: 0..1,                         // trend strength (efficiency ratio)
  credibility: {
    outOfSampleSharpe,                       // BTC, cost-aware, ~0.2–0.5 (realistic, not 1.5)
    robustEdge,                              // survives BTC OOS + costs + a param grid
    generalizesAcrossAssets: false,          // ← but it does NOT generalize to ETH/SOL/BNB
    caveat: "BTC-sample-specific — informational, not proven alpha"
  },
  execution: "FORBIDDEN — read-only signal …",
  disclaimer: "NOT a trade, NOT investment advice."
}
```

## Why it's different: radical honesty about its own edge
Most market tools sell a confident call. This one:
1. **Abstains in chop** — returns ABSTAIN when there's no clean trend, instead of a guess.
2. **Reports the out-of-sample, cost-aware number** — never a flattering in-sample backtest.
3. **Admits it does not generalize** — the underlying breakout edge tests well on BTC but *loses*
   on ETH/SOL/BNB, so it flags `generalizesAcrossAssets: false` and tells the agent to treat the
   read as **informational, not proven alpha.** A tool that tells you "I have no durable edge here"
   is exactly what an autonomous agent needs to avoid acting on noise.

## 🛑 Safety
- **READ-ONLY**: returns a signal; there is no order / sign / transfer / execute method anywhere.
- **BTC only.** **Not investment advice.** Every result carries `execution: FORBIDDEN`.

## Attach it
Ships as an MCP server (JSON-RPC 2.0, protocol 2024-11-05):
- **stdio:** `{ "mcpServers": { "btc-signal": { "command": "node", "args": ["btc-mcp-server.js"] } } }`
- **HTTP** (OpenGateway/OpenClaude agents): POST JSON-RPC `tools/call` to the **live hosted endpoint** `https://fleet-mcp-production-56fd.up.railway.app/` (`GET /health` for liveness) — or self-host the transport. Read-only; geo-resilient price feed (Binance→Kraken→CoinGecko fallback).

Pairs with the `mainstreet` skill: an agent can check counterparty reputation **and** get an honest
market regime read from the same session.
