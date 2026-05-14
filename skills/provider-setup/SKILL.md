---
name: provider-setup
title: Provider Setup
description: Configures openclaude to route through OpenAI-compatible providers.
category: provider
tags:
  - openclaude
  - provider
  - configuration
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Provider Setup

Help a user point `openclaude` at a non-Anthropic provider (Groq,
Together, OpenRouter, vLLM, a local server, etc.) by configuring the
right base URL, model name, and API key, and verifying the first
request lands.

## Use this skill when

- The user wants to use a non-Anthropic model with `openclaude` and
  is not sure how to wire it up.
- The user has a provider account and an API key but is getting an
  error from `openclaude` (auth, model not found, schema mismatch).
- The user wants to compare two providers and asks how to switch
  between them.
- The user is running a local model server (Ollama, vLLM, LM Studio)
  and wants `openclaude` to use it.

## Do NOT use this skill when

- The user wants the default Anthropic setup. That uses
  `openclaude`'s built-in config — no provider work needed.
- The user wants help creating an account at a provider. That is
  out of scope.
- The user is debugging an issue inside the model's output quality.
  Provider setup is plumbing; output quality is the model.

## Procedure

1. Identify which API the provider speaks. Most providers expose an
   **OpenAI-compatible** Chat Completions endpoint (`/v1/chat/completions`).
   A few expose Anthropic's `/v1/messages`. Some expose both, behind
   different paths. Ask the user to confirm by pasting the provider's
   docs URL — guessing wastes a round-trip.
2. Set the base URL. For OpenAI-compatible APIs this is the URL up
   to and including `/v1` (e.g., `https://api.groq.com/openai/v1`,
   `http://localhost:11434/v1` for Ollama). Do NOT include the
   trailing path (`/chat/completions`); the SDK appends it.
3. Set the API key. The provider issues this from their dashboard.
   Pass it via the environment variable the relevant adapter
   expects (commonly `OPENAI_API_KEY`, even for non-OpenAI
   providers, because they reuse the SDK shape). Local servers
   usually accept any non-empty string.
4. Set the model name to exactly what the provider lists. Model
   names are not portable: `llama-3.1-70b-instruct` on one
   provider is `Meta-Llama-3.1-70B-Instruct-Turbo` on another.
   Copy from the provider's model list, not from memory.
5. Verify with a one-shot request. The fastest test is a `curl` to
   the configured base URL with a minimal payload, or a single
   `openclaude` invocation that calls the model and prints the
   response. If the verify step fails, the rest of the conversation
   will fail in the same way — fix this first.
6. Troubleshoot from the response, not the symptom:
   - **401 / 403** — API key wrong, malformed, or unset. Check the
     environment variable name and value.
   - **404** — model name not on this provider, or base URL wrong.
     Compare the failing URL to the provider's docs.
   - **422 / 400 schema error** — payload shape mismatch. The
     provider may not support a parameter `openclaude` is sending
     (e.g., `response_format`, tools, vision). Disable the feature
     or pick a provider that supports it.
   - **429** — rate limit. Slow down, ask the provider for a higher
     tier, or switch to a less constrained model.
   - **5xx** — provider outage. Wait or fail over.

## Examples

In scope: "I want to use Groq for fast inference."

→ Set base URL `https://api.groq.com/openai/v1`, key
`GROQ_API_KEY`, model `llama-3.1-70b-versatile` (or whatever the
user picks from Groq's list). Verify with a curl. If it returns
JSON with a `choices[0].message`, the wire is good.

In scope: "I'm running a local vLLM server."

→ Base URL `http://localhost:8000/v1`, key `not-needed` (or
whatever the server accepts), model = the name vLLM is serving
(`vllm-serve --model X` exposes it as `X`). Local servers fail
silently when the model isn't loaded — check the server logs.

Out of scope: "Why is the local model's output worse than Claude?"

→ Different model, different quality. Provider setup is fine.

## Self-check before responding

- Did I confirm which API shape the provider speaks (OpenAI vs
  Anthropic vs custom)?
- Is the base URL set to the `/v1` segment, not the full path?
- Is the model name copied from the provider's list rather than
  guessed?
- Did I propose a one-shot verify before declaring the setup done?
- Did I explain how to read the error code, not just "check your
  config"?
- For local servers, did I check the server logs before blaming
  the client?
