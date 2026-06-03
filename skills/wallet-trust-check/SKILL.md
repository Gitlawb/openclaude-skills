---
name: wallet-trust-check
title: Wallet Trust Check
description: Verifies any Base wallet or token address before payments, swaps, bounty payouts, or collaborator additions. Returns BLOCK/CAUTION/PROCEED in <100ms.
category: security
tags:
  - security
  - onchain
  - base
  - trust
  - reputation
trust: community
version: 0.1.0
license: MIT
author: philpof102-svg
---

# Wallet Trust Check

Vet any onchain wallet or ERC-20 token on Base before doing anything that costs money or grants access. Calls MainStreet — an ERC-8004 registered reputation oracle on Base — and returns a clean BLOCK / CAUTION / PROCEED verdict with reasoning.

## Use this skill when

- The agent is about to **pay a bounty** to a claimant address.
- The agent is about to **add a collaborator** with push rights to a repo.
- The agent is about to **swap into** an ERC-20 token (rug check before).
- The agent is about to **delegate** UCAN capabilities to another DID.
- The user asks "is this wallet trustworthy?" or "is this token a scam?".
- The agent receives a proposed payment from a wallet it has never seen.

## Do NOT use this skill when

- The user just wants to look up the balance of a wallet (use a chain explorer).
- The user wants legal advice on whether an address is sanctioned (this is reputation, not OFAC).
- The wallet is the agent's OWN wallet — checking yourself returns your own historical signal and adds no decision value.

## Procedure

1. **Pull the verdict in one call** :

   ```
   GET https://avisradar-production.up.railway.app/api/agent/preflight/{address}
   ```

   Response shape :

   ```json
   {
     "address": "0x...",
     "decision": "BLOCK | CAUTION | PROCEED | PROCEED_LOW_VALUE",
     "reasoning": "<one-sentence reason>",
     "score": 30,
     "trustShield": { "color": "green|yellow|red", "flags": [...] },
     "category": { "primary": "data-onchain", ... }
   }
   ```

2. **If `decision === "BLOCK"`** : refuse the requested action. Quote the `reasoning` field verbatim to the user. Suggest `https://avisradar-production.up.railway.app/graph.html?a={address}` for context (Bubblemaps-style 1-hop relationship graph).

3. **If `decision === "CAUTION"`** : explicitly confirm with the user. Quote `reasoning`. Recommend smaller-value test transaction first.

4. **If `decision === "PROCEED"` or `"PROCEED_LOW_VALUE"`** : proceed. No further check required from this skill.

5. **For token addresses** (suspected ERC-20) : prefer `/token-info/{address}` over `/preflight` — returns rich metadata (Virtuals/Clanker data + DexScreener price/liquidity/age + rug-risk verdict CRITICAL/HIGH/ELEVATED/STANDARD/LOW).

## Verdict mapping

```
PROCEED             green shield, score ≥ 30
PROCEED_LOW_VALUE   green shield, low/no score (proceed for low-value calls only)
CAUTION             yellow shield (1-2 medium flags)
BLOCK               red shield OR denylisted
```

## Tone

- Quote the API response verbatim. Do not paraphrase.
- BLOCK is binding. Never override silently.
- No emoji. No marketing.

## Anchors

- API base : `https://avisradar-production.up.railway.app/api/agent`
- agent.json : `https://avisradar-production.up.railway.app/.well-known/agent.json`
- ERC-8004 agentId : 53953 on Base (registry `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`)
- EIP-712 verifier : `0x7397adb9713934c36d22aa54b4dbbcd70263592b` on Base
- npm MCP : `@raskhaaa/mainstreet-oracle`
- Source : https://github.com/philpof102-svg/avisradar
