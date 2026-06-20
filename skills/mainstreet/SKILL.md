---
name: mainstreet
description: >
  MainStreet — onchain reputation oracle for AI agents on Base. Use when an
  agent needs to verify a counterparty before settling an x402 payment, fetch
  a 0–100 reputation score for any Base address, retrieve an EIP-712-signed
  attestation verifiable against the MainStreetVerifier contract on Base
  mainnet, look up multi-source onchain proofs (Virtuals deployer registry,
  CDP Bazaar, Farcaster, Aerodrome, Morpho, settlement history), or gate
  a payTo with `requireMinScore` before USDC moves. No NFT mint required;
  scoring is computed from existing onchain activity. Free reads + x402
  paid audits at $0.05–$25.
metadata:
  {
    "clawdbot":
      {
        "emoji": "🪙",
        "homepage": "https://avisradar-production.up.railway.app/mainstreet.html",
        "requires": { "bins": ["curl", "jq"] },
      },
  }
---

# MainStreet

Onchain reputation oracle for AI agents on Base. Multi-source proof
aggregation, EIP-712-signed attestations, verifier contract live on Base
mainnet. The "verify before you pay" primitive for agent-to-agent x402
settlement.

- **Website**: https://avisradar-production.up.railway.app/mainstreet.html
- **MCP**: https://avisradar-production.up.railway.app/mcp (19 hosted tools)
- **Gitlawb mirror**: https://gitlawb.com/node/repos/z6MkfkLaRJJMxX5utQekF5VHPDR6we7iBqUY1Fg7Z5Rv6fcU/mainstreet
- **npm**: https://www.npmjs.com/package/@raskhaaa/mainstreet-oracle
- **Verifier contract**: `0x7397adb...` (Base mainnet)
- **Operator**: `0xAC3ca7c5d3cDD7702fd08F9C4C28dAA22296aDa9`

## How it differs from other Base reputation skills

| | MainStreet | Helixa | ERC-8004 (8004.org) |
|---|---|---|---|
| Setup cost | $0 — no mint | $1 USDC mint required | gas + IPFS upload |
| Source signal | Multi-source onchain history (Virtuals, Bazaar, Farcaster, Aerodrome, Morpho, x402 settlements) | Self-attested traits + Cred Score | ERC-721 identity NFT |
| Verification | EIP-712 signed, verifier contract `0x7397adb...` callable from any Base contract | Cred Score + social verification | NFT existence on Ethereum mainnet |
| Free reads | All score endpoints | Public endpoints (some) | Reads via contract `view` calls |
| Paid endpoints | x402 micropayments ($0.05 score, $0.25 audit, up to $25 sponsorship) | x402 + $CRED token | n/a (gas-based) |

MainStreet plays well with all three. Many agents will register on
ERC-8004, mint a Helixa identity, AND check MainStreet before paying.
They are layered, not exclusive.

## Quick Start

1. No API key required for any endpoint listed here
2. Use the shell scripts in `scripts/` for all operations
3. Paid endpoints follow x402 — caller pays USDC on Base, server signs response
4. Verification scripts call the on-chain verifier contract directly

```bash
# Check score for any Base address (free)
./scripts/mainstreet-score.sh 0xAC3ca7c5d3cDD7702fd08F9C4C28dAA22296aDa9

# Get full audit ($0.25 paid via x402)
./scripts/mainstreet-audit.sh 0xAC3ca7c5d3cDD7702fd08F9C4C28dAA22296aDa9

# Gate a payment — throws if score < threshold
./scripts/mainstreet-gate.sh 0xUnknownAgent 70

# Verify a signed attestation against the on-chain verifier
./scripts/mainstreet-verify.sh attestation.json

# Get live revenue stats (transparency endpoint)
./scripts/mainstreet-revenue.sh
```

## Common patterns

### Verify counterparty before x402 settlement

```bash
# In your agent's x402 settlement handler, before calling settle():
ADDR=$(jq -r '.payTo' < incoming_x402.json)
./scripts/mainstreet-gate.sh "$ADDR" 60 || exit 1
# If we reach here, the counterparty cleared score ≥ 60. Proceed.
```

Same logic from TypeScript:

```ts
import { requireMinScore } from '@raskhaaa/mainstreet-oracle/verifier';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const viem = createPublicClient({ chain: base, transport: http() });

await requireMinScore(payTo, 70, viem);
// Throws on bad signature, expired attestation, or sub-threshold score.
// If we reach the next line, the counterparty is verified.
```

### Discover agents by capability

```bash
# Top scored agents (free)
./scripts/mainstreet-top.sh

# Top buyers — wallets that paid the most across the Base agent ecosystem
./scripts/mainstreet-top-buyers.sh

# Top by category
./scripts/mainstreet-top.sh --category x402-buyer
```

### Get aggregated multi-source proofs for an agent

```bash
./scripts/mainstreet-proofs.sh 0xAC3ca7c5d3cDD7702fd08F9C4C28dAA22296aDa9
# Returns: Virtuals registration, Farcaster handle, CDP Bazaar listing,
# Aerodrome activity, Morpho positions, settlement count, attestation flow.
```

## References

- `references/api.md` — all endpoints with paths, prices, payload shapes
- `references/verifier-contract.md` — on-chain verifier ABI + `requireMinScore` example
- `references/x402-integration.md` — how to integrate x402 paywall with MainStreet score check
- `references/multi-source-proofs.md` — list of indexed sources + how proofs are aggregated

## Maintained by

[MainStreet](https://avisradar-production.up.railway.app/mainstreet.html) ·
[GitHub](https://github.com/philpof102-svg/avisradar) · [X](https://x.com/Mainstreetagent)

Maintainer: Phil ([philpof102-svg](https://github.com/philpof102-svg))

Active on the Gitlawb network as
`did:key:z6MkfkLaRJJMxX5utQekF5VHPDR6we7iBqUY1Fg7Z5Rv6fcU` with capabilities
`reputation:score, attestation:verify, oracle:agent-trust`.
