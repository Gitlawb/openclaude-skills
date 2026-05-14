---
name: secret-in-client-bundle-check
title: Secret in Client Bundle Check
description: Detects API keys, tokens, and secrets accidentally bundled into client-side JavaScript before production deploy.
category: security
tags:
  - security
  - secrets
  - deployment
  - vibe-coding
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Secret in Client Bundle Check

The Moltbook incident leaked 1.5M tokens by shipping a service-role
key in the client bundle. Vibe coders, AI codegen tools, and
copy-pasted snippets all produce this class of bug. Build the project,
scan the BUILT artifacts (not source) for known secret patterns, scan
git history, separate safe public values from leaked private ones,
rank by severity.

## Use this skill when

- The user is about to deploy to production.
- The user asks "are any of my secrets leaking" or "is my app safe to
  ship".
- The user mentions accidentally hardcoding an API key.
- The user wants a pre-launch security check.
- The user had a security incident and wants to know if more keys are
  exposed.

## Do NOT use this skill when

- The user wants to set up secret management from scratch (Doppler, 1Password, Infisical). Different scope — that is provisioning, not detection.
- The user wants to ROTATE already-known leaked secrets. Different workflow — rotation playbook, not scanning.
- The user is shipping a secret that is INTENDED to be public — Stripe publishable key (`pk_...`), Supabase anon key, PostHog public key. These are designed to be in the client and protected by other layers (RLS, allowed origins). Do not flag them.

## Procedure

1. **Build the project first.** Source code might be tree-shaken or
   minified — the only ground truth is what actually got bundled.

   ```bash
   # Next.js — output goes to .next/
   npm run build

   # Vite (and most React/Vue/Svelte starters) — output goes to dist/
   npm run build

   # Astro — output goes to dist/

   # Remix — output goes to build/ and public/build/
   npm run build
   ```

2. **Scan the BUILT bundle for known secret patterns.** Run each
   command from the project root. Adjust the path to match the
   framework's output directory.

   ```bash
   # AWS access key IDs
   grep -rEho 'AKIA[0-9A-Z]{16}' .next/ dist/ build/ 2>/dev/null

   # Stripe LIVE keys (the dangerous ones)
   grep -rEho 'sk_live_[0-9a-zA-Z]{24,}' .next/ dist/ build/ 2>/dev/null
   grep -rEho 'rk_live_[0-9a-zA-Z]{24,}' .next/ dist/ build/ 2>/dev/null

   # OpenAI keys (project-scoped and legacy)
   grep -rEho 'sk-(proj-)?[a-zA-Z0-9_-]{20,}' .next/ dist/ build/ 2>/dev/null

   # Anthropic keys
   grep -rEho 'sk-ant-[a-zA-Z0-9_-]{20,}' .next/ dist/ build/ 2>/dev/null

   # Google API keys
   grep -rEho 'AIza[0-9A-Za-z_-]{35}' .next/ dist/ build/ 2>/dev/null

   # GitHub personal access tokens
   grep -rEho 'gh[ps]_[0-9A-Za-z]{36,}' .next/ dist/ build/ 2>/dev/null

   # Supabase service role (the dangerous one — anon key is fine)
   grep -rho 'service_role' .next/ dist/ build/ 2>/dev/null
   ```

   Any non-empty output is a finding. Run each pattern even if an
   earlier one hit — keys often come in clusters.

3. **Check what env vars the framework will expose to the client.**
   Different frameworks use different prefixes; only prefixed vars
   reach the bundle:

   - Next.js → `NEXT_PUBLIC_*`
   - Vite → `VITE_*`
   - Astro → `PUBLIC_*`
   - Remix / SvelteKit → all server env is hidden unless explicitly
     forwarded; check the framework docs.

   ```bash
   # List everything the framework will expose
   grep -hE '^(NEXT_PUBLIC_|VITE_|PUBLIC_)' .env* 2>/dev/null | sort -u
   ```

   For each one, ask: is this value SAFE to be public?
   - Stripe publishable (`pk_...`), Supabase URL, Supabase anon key,
     PostHog public, Sentry DSN → **SAFE**, by design.
   - Anything labeled "secret", "private", `..._KEY` that is not a
     publishable key, anything with `SERVICE_ROLE` in the name →
     **NOT SAFE**, rename to drop the public prefix.

4. **Check for hardcoded secrets in source.** Bundlers can constant-
   fold inline strings into the output, so a hardcoded key in source
   becomes a hardcoded key in the bundle.

   ```bash
   grep -rnE '(api[_-]?key|secret|token|password|bearer)[[:space:]]*[:=][[:space:]]*["\047][^"\047]{20,}' \
     --include="*.ts" --include="*.tsx" \
     --include="*.js" --include="*.jsx" \
     --include="*.mjs" --include="*.cjs" \
     app/ src/ pages/ components/ lib/ 2>/dev/null
   ```

   Each hit is a candidate. Review by eye — some matches are false
   positives (e.g. `apiKey: process.env.X` is fine; `apiKey:
   "sk-..."` is not).

5. **Check git history for committed secrets.** Even if the key was
   removed from the current code, GitHub indexes history. Once a
   real secret is in a public commit, it is compromised — rotation
   is mandatory, not optional.

   ```bash
   # Install once: https://github.com/trufflesecurity/trufflehog
   trufflehog git file://. --only-verified --no-update

   # Alternative: gitleaks
   # https://github.com/gitleaks/gitleaks
   gitleaks detect --source . --no-banner
   ```

   If anything is reported as VERIFIED:
   1. **Rotate the secret at the provider first** (Stripe dashboard,
      AWS IAM, OpenAI dashboard, etc).
   2. **Then** remove from history (`git filter-repo` / BFG) if the
      repo is public.
   3. Deleting the key from the current commit is NOT enough — git
      history still contains it.

6. **Check for committed `.env*` files.** Vercel and most hosts will
   not deploy `.env.local` (gitignored by default) but WILL deploy
   `.env.production` if it is committed.

   ```bash
   git ls-files | grep -E '^\.env|/\.env'
   ```

   Any `.env*` file tracked by git that contains real secrets is a
   leak. Move secrets to the host's project settings (Vercel
   Environment Variables, Netlify, etc) and add the file to
   `.gitignore`. Remember: removing the file from a tracked path
   does not remove it from history (see step 5).

7. **Summarize findings by severity:**

   - **CRITICAL** — live API keys (`sk_live_...`, `AKIA...`,
     production OpenAI / Anthropic) in the bundle; Supabase service
     role key anywhere in client code or bundle; committed `.env*`
     files containing real secrets; trufflehog VERIFIED hits in git
     history.
   - **HIGH** — test keys (`sk_test_...`) in production bundle (do
     not drain real accounts, but signal a workflow bug — production
     should not ship test keys).
   - **MEDIUM** — high-entropy strings in the bundle that match no
     known pattern (possibly custom tokens, possibly false positives).
   - **LOW** — `NEXT_PUBLIC_*` / `VITE_*` / `PUBLIC_*` vars with
     non-sensitive but undocumented values that ought to be reviewed.

   For each CRITICAL hit: state the file (or git ref) where the key
   appears, the provider, and the rotation URL.

## Examples

In scope: "Run a pre-launch security check on my Next.js app."

→ Run all of steps 1-6. Build, scan the built bundle for known
patterns, audit `NEXT_PUBLIC_*` vars, scan source, scan git history,
list committed `.env*` files. Summarize by severity. Block launch on
CRITICALs.

In scope: "I accidentally committed my OpenAI key three commits ago,
what do I do?"

→ Step 5 plus rotation. Rotate the key at platform.openai.com FIRST.
Then `trufflehog git file://. --only-verified` to confirm it is
detected so you know the scope. Then rewrite history if the repo is
public.

Out of scope: "How do I set up Doppler / Infisical / 1Password
Secrets?"

→ Secret management provisioning, not detection. Different skill.

Out of scope: "My Stripe publishable key is in my bundle — is that
bad?"

→ No. `pk_...` is designed for the client. Reassure briefly and exit.

## Self-check before responding

- Did I scan the BUILT bundle (`.next/`, `dist/`, `build/`), not just
  source? Source might tree-shake; the bundle is ground truth.
- Did I distinguish safe `NEXT_PUBLIC_*` / `VITE_*` / `PUBLIC_*` vars
  from leaked secrets?
- Did I run a git-history scan (trufflehog / gitleaks), not just
  check the current working tree?
- If a real secret was found, did I say ROTATE FIRST before any
  history rewrite or commit deletion?
- Did I rank findings by severity rather than dump a flat list?
- Did I avoid panic-language while still conveying urgency for live
  keys?
- Did I refrain from flagging known-public values (`pk_...`, Supabase
  anon key) as findings?
