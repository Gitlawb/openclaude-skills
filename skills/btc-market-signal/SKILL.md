---
name: btc-market-signal
description: >
  btc_market_signal — a READ-ONLY, calibrated BTC market-regime signal for AI agents.
  Use when an agent needs a credible directional read on BTC before forming a view:
  it returns the market regime (bull / neutral / bear), a directional bias, a conviction
  score, and the strategy blend's OUT-OF-SAMPLE (walk-forward) Sharpe as a credibility
  anchor — or an explicit ABSTAIN when there is no robust edge. It is the rare market
  oracle that says "I have no proven edge right now" instead of a confident guess: the
  in-sample backtest can look great (Sharpe 1.5) while the walk-forward is negative, and
  the tool reports the honest out-of-sample number. BTC only. NOT a trade and NOT
  investment advice — the calling agent must never auto-execute on it; there is no
  order/sign/transfer method. Exposed as an MCP server (stdio or HTTP), composes with
  the `mainstreet` reputation skill (counterparty trust + market read, one ecosystem).
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

A READ-ONLY MCP tool that hands an agent a **calibrated** BTC market read — or an honest
abstention. Built on a self-verifying quant desk (alpha-combination, regime detection,
stat-arb, backtest, **walk-forward out-of-sample validation**).

## The tool
```
btc_market_signal()  →  {
  asset: "BTC",
  decision: "SIGNAL" | "ABSTAIN",
  regime: "BULL" | "NEUTRAL" | "BEAR",
  directionBias: "long-bias" | "short-bias" | "neutral" | null,
  conviction: 0..1,                                 // halved when the regime is unstable
  credibility: { outOfSampleSharpe, inSampleSharpe, robustEdge },
  reasons: [...],                                   // why, on ABSTAIN
  execution: "FORBIDDEN — read-only signal …",
  disclaimer: "NOT a trade, NOT investment advice."
}
```

## Why it's different: it abstains
Most market tools emit a confident call. This one fits its strategy weights on the past and
scores them on the **unseen future** (walk-forward). If the edge doesn't survive out-of-sample
(`robustEdge: false`), the tool returns **ABSTAIN** rather than selling an overfit backtest.
That honest "no edge" is the feature an autonomous agent actually needs.

## 🛑 Safety
- **READ-ONLY**: returns a signal; there is no order / sign / transfer / execute method anywhere.
- **BTC only.** **Not investment advice.** Every result carries `execution: FORBIDDEN`.

## Attach it
The tool ships as an MCP server (JSON-RPC 2.0, protocol 2024-11-05):
- **stdio:** add to your MCP client config —
  `{ "mcpServers": { "btc-signal": { "command": "node", "args": ["btc-mcp-server.js"] } } }`
- **HTTP** (OpenGateway/OpenClaude agents): run the HTTP transport (`fleet-mcp-http.js`) and POST
  JSON-RPC to the endpoint; `GET /health` for liveness.

Pairs with the `mainstreet` skill: an agent can check counterparty reputation **and** get a
calibrated market read from the same session.
