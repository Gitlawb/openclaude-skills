---
name: provider-debug
title: Provider Debug
description: Diagnoses openclaude provider configuration problems and proposes fixes.
category: provider
tags:
  - openclaude
  - provider
  - debugging
  - configuration
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Provider Debug

A previously-working provider broke, or a switch between providers
didn't take. Read the user's actual config, identify the layer that's
wrong (model name, endpoint, flag conflict, request shape), and
propose the smallest fix plus a verification command.

## Use this skill when

- The user gets API errors after configuring a new provider — OpenAI,
  Gemini, Ollama, LM Studio, Bedrock, Vertex, GitHub Models, or
  Anthropic.
- The user sees "model not found", "invalid endpoint", or `400` /
  `401` / `403` / `404` from the provider.
- The user says "openclaude isn't connecting" or "I switched
  providers and now it's broken".
- The user shows a specific message like
  `Function tools with reasoning_effort are not supported for X in
  /v1/chat/completions` or `ERR_PACKAGE_PATH_NOT_EXPORTED` coming
  from the provider layer.
- The user wants to verify a provider switch actually worked before
  continuing.

## Do NOT use this skill when

- The user wants advice on which provider to use in general. This
  skill fixes broken configs, not advisory questions.
- The user is setting up a brand-new provider from scratch. Use
  `provider-setup`.
- The error is in the user's own code rather than the provider
  layer. Use `error-message-decode` or `debugging`.
- The user has a billing or account issue at the provider's
  dashboard — out of scope; route to the provider's support.

## Procedure

1. **Run `/doctor` inside openclaude** (or `bun run doctor:runtime`
   from the project root; `bun run doctor:runtime:json` if you want
   structured output). Read the failed checks. `doctor` already
   knows about the common provider misconfigurations and will
   point at the bad fields by name.
2. **Inspect `~/.openclaude/settings.json`** (and
   `.openclaude-profile.json` in the project root if present —
   project profile overrides the user-level file). Check:
   - `model` — does it match the provider's actual model name?
     Model names aren't portable across providers.
   - `env` — are the right vars set for the selected provider?
   - `effortLevel` — `reasoning_effort` is rejected by some
     OpenAI-compatible models on `/v1/chat/completions`; only
     reasoning-capable models accept it.
3. **Check the active-provider flag.** Exactly one of these should
   be set; multiple set at once is a common bug:
   - `ANTHROPIC_API_KEY` (Anthropic direct, the default)
   - `CLAUDE_CODE_USE_OPENAI=1` (OpenAI **and** OpenAI-compatible —
     Ollama, LM Studio, LiteLLM, vLLM, Groq)
   - `CLAUDE_CODE_USE_GEMINI=1`
   - `CLAUDE_CODE_USE_GITHUB=1`
   - `CLAUDE_CODE_USE_BEDROCK=1`
   - `CLAUDE_CODE_USE_VERTEX=1`
   If two flags are set, the precedence may not be what the user
   expects. Unset the inactive ones.
4. **Common failures and their fixes:**
   - `Function tools with reasoning_effort are not supported for
     <model> in /v1/chat/completions` → either remove
     `effortLevel` from settings, or switch `model` to one that
     supports tools on `/v1/chat/completions` (e.g. `gpt-5`,
     `gpt-4.1`).
   - `Model X not found` → name mismatch. Compare against the
     provider's published model list; copy the exact identifier.
   - `Invalid base URL` / 404 on requests → trailing slash on
     `OPENAI_BASE_URL`, or the `/v1` path is missing.
   - Ollama "connection refused" → confirm the daemon is running
     with `ollama list`. Also confirm `OPENAI_BASE_URL` ends in
     `/v1` (Ollama's OpenAI-compatible endpoint).
   - LM Studio empty response → the **server** must be started
     from the LM Studio UI, not just the app open; port `1234`
     by default.
   - GitHub Models 401 → `GITHUB_TOKEN` is missing the
     `models:read` scope.
   - Bedrock 403 → wrong `AWS_REGION` or AWS credentials not
     loaded; verify with `aws sts get-caller-identity`. For
     `AWS_BEARER_TOKEN_BEDROCK` shape, confirm the token is set
     (not the standard AWS keys).
   - Vertex 403 → `ANTHROPIC_VERTEX_PROJECT_ID` or
     `CLOUD_ML_REGION` mismatch; check the Vertex console for the
     project's allowed regions.
5. **Always show a verification command after the fix.** For an
   OpenAI-compatible provider: `curl "$OPENAI_BASE_URL/models" -H
   "Authorization: Bearer $OPENAI_API_KEY"`. For Ollama:
   `ollama list`. For Anthropic direct: a `/v1/messages` request
   with a minimal prompt against `$ANTHROPIC_BASE_URL`. For
   Bedrock: `aws bedrock list-foundation-models --region
   $AWS_REGION`.
6. **If the fix doesn't resolve**, ask for the **full** error
   response body, not just the message. Providers commonly tuck
   useful hints into `error.type`, `error.param`, or `error.code`
   that the user's terminal truncates.

## Examples

In scope: "I get a 400 saying `reasoning_effort` isn't supported
for `gpt-5.4`."

→ Read `~/.openclaude/settings.json`. Either remove `effortLevel`
or change `model` to one that supports tools on
`/v1/chat/completions`. Verify by curling `$OPENAI_BASE_URL/models`
to confirm auth works at all, then re-issue the failing call.

In scope: "Ollama is configured but openclaude says connection
refused."

→ Run `ollama list` first. If Ollama isn't responding, start the
daemon. If `ollama list` works but openclaude still fails, check
`OPENAI_BASE_URL` ends in `/v1` and `CLAUDE_CODE_USE_OPENAI=1`
is set.

In scope: "I switched from Anthropic to OpenAI and nothing works."

→ Probable cause: `ANTHROPIC_API_KEY` is still in the environment
alongside `CLAUDE_CODE_USE_OPENAI=1`. Unset the stale flag, restart
the shell, run `/doctor`.

Out of scope: "Which provider should I use?"

→ Advisory question, not a broken config. Suggest `provider-setup`
for a clean install, or ask the user about their constraints
(local vs cloud, latency, budget) and answer directly.

## Self-check before responding

- Did I read `~/.openclaude/settings.json` (and any
  `.openclaude-profile.json`) before guessing?
- Did I check for conflicting `CLAUDE_CODE_USE_*` flags being set
  simultaneously?
- For OpenAI-compatible providers, did I confirm whether the
  model requires `/v1/responses` versus `/v1/chat/completions`?
- Did I propose a specific fix, not "check your config"?
- Did I include a concrete verification command after the fix?
- Did I distinguish provider-side errors from user-code errors so
  I don't fix the wrong thing?
