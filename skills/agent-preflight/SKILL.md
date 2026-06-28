---
name: agent-preflight
description: >
  agent_preflight — a READ-ONLY "safe to act" trust gate for autonomous agents. Given a
  counterparty wallet address, it returns a single verdict — PROCEED / CAUTION / BLOCK —
  backed by MainStreet's LIVE, on-chain-attested reputation (a trust-shield color, a 0–100
  score, and flags). It is the "safe-to-pay" complement to "allowed-to-pay" (KYT): KYT says
  a payment is permitted; this says the COUNTERPARTY has earned trust — and proves it. It
  FAILS CLOSED: an unknown / isolated / unverifiable address returns BLOCK (it never vouches
  by default). Every result carries a verifiability anchor (an EIP-712 attestation endpoint +
  the on-chain verifier contract) so the trust is checkable, not asserted. READ-ONLY: there is
  no order / sign / transfer / execute method — the calling agent decides and a human signs.
  Call it BEFORE paying, delegating to, or transacting with an agent you can't vouch for.
  Composes with the `mainstreet` reputation skill and `btc-market-signal` (one fleet, one endpoint).
metadata:
  {
    "clawdbot":
      {
        "emoji": "🛡️",
        "homepage": "https://github.com/Gitlawb/openclaude-skills/tree/main/skills/agent-preflight",
        "requires": { "bins": ["node"] },
      },
  }
---

# agent_preflight

The single call an autonomous agent makes **before it pays, delegates, or transacts** with a
counterparty. One verdict, backed by live on-chain reputation, fail-closed, and verifiable.

> "allowed to pay" (KYT) → the payment is permitted.
> **"safe to pay" (this) → the counterparty has EARNED trust — and it's provable on-chain.**

## The tool
```
agent_preflight({ counterparty, intent? })  →  {
  counterparty,
  verdict: "PROCEED" | "CAUTION" | "BLOCK",   // BLOCK is a hard stop
  reputation: {
    available,                                 // false → no verifiable signal
    score,                                     // 0..100 (null if unavailable)
    shieldColor,                               // "green" | "yellow" | "red" | null
    allowlisted,
    flags,                                     // [{ key, severity }]
    source: "MainStreet /api/agent/score — live, onchain-attested (EIP-712 on Base)"
  },
  reasons: [ "…" ],
  verify: {                                    // trust is verifiable, not asserted
    attestationEndpoint,                       // GET → signed EIP-712 attestation
    onchainVerifier: "0x7397adb9713934c36d22aa54b4dbbcd70263592b",
    note: "recover the signer == operator, or call requireMinScore() on-chain"
  },
  execution: "FORBIDDEN — read-only; the agent decides and a human signs.",
  disclaimer: "Read-only trust signal, not a guarantee."
}
```

## Why it's different
1. **One composed verdict, not hand-rolled gates.** Score + shield + flags collapse into PROCEED /
   CAUTION / BLOCK — drop it in front of any payment/delegation step.
2. **Fail-closed.** An unknown, isolated, or unverifiable counterparty returns **BLOCK** — it never
   vouches by default. "I can't verify this one" is exactly what an autonomous agent needs to hear.
3. **Verifiable, not asserted.** Every verdict ships the EIP-712 attestation endpoint and the on-chain
   verifier contract — *don't trust the read, verify it* (off-chain signer recovery or on-chain
   `requireMinScore()`).

## 🛑 Safety
- **READ-ONLY**: returns a verdict; there is no order / sign / transfer / execute method anywhere.
- The calling agent decides; a **human signs** any transaction. **Not financial advice.**

## Attach it
Ships as part of the Fleet MCP server (JSON-RPC 2.0, protocol 2024-11-05):
- **HTTP** (OpenGateway/OpenClaude/x402 agents): POST JSON-RPC `tools/call` to the **live hosted
  endpoint** `https://fleet-mcp-production-56fd.up.railway.app/` (`GET /health` for liveness).
- **stdio:** run the fleet MCP server and attach over stdio.

A ~20-line buyer-agent example (one `agent_preflight` call → pay / refuse) is in the fleet repo.
Pairs with `mainstreet` (the raw reputation oracle) and `btc-market-signal` (an honest market read)
— one agent, one ecosystem: **check who you're dealing with, then act.**
