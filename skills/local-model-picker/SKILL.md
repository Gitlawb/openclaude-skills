---
name: local-model-picker
title: Local Model Picker
description: Recommends Ollama or LM Studio models based on hardware and goal.
category: provider
tags:
  - openclaude
  - ollama
  - lm-studio
  - local-models
  - hardware
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Local Model Picker

The user wants to run openclaude against a local model and is asking
which one. Ask about their hardware and what they're trying to do, match
those to a specific Ollama or LM Studio model, and hand back the install
command plus the openclaude config block that wires it in.

## Use this skill when

- The user wants to run openclaude with a local model and asks
  "which one should I use".
- The user has limited VRAM or RAM and wants the best-quality model
  that fits.
- The user asks "should I use llama / qwen / deepseek / mistral /
  gemma?".
- The user wants to switch from a cloud provider to local and is
  looking for a starting point.
- The user describes a goal (coding, planning, summarization, tool
  use) and wants a model recommendation.

## Do NOT use this skill when

- The user is on a cloud provider (Anthropic, OpenAI direct, Gemini,
  Bedrock, Vertex) — wrong skill.
- The user wants to install Ollama or LM Studio for the first time
  and configure openclaude against it. Use `provider-setup`.
- The user has a local model that was working and now isn't. Use
  `provider-debug`.

## Procedure

1. **Identify the hardware constraint.** Ask if not given:
   - Available VRAM. NVIDIA: `nvidia-smi`. AMD ROCm:
     `rocm-smi`. Apple Silicon: Activity Monitor → Memory →
     Memory Used (unified memory pool).
   - Available system RAM and whether the user is comfortable
     spilling onto it.
   - GPU vs CPU inference — CPU-only is workable for 7B models,
     painful above that.
   - The **goal**: agentic coding (tool use), raw code completion,
     planning / reasoning, summarization, or general chat.
2. **Use openclaude's own ranking if available**:
   `bun run profile:recommend -- --goal coding --benchmark`. The
   profile recommender knows about the user's current hardware
   profile (`bun run profile:init` if not set) and orders models
   by measured performance. Where it exists, trust its top pick
   over hand-rolled rules.
3. **Size the model to VRAM** (rough rules of thumb; Q4_K_M quant
   unless noted):
   - **8 GB VRAM**: 7B–8B Q4_K_M models — `llama3.1:8b-instruct-q4_K_M`,
     `qwen2.5-coder:7b`.
   - **12–16 GB VRAM**: 13B–14B Q4_K_M, or 7B Q6_K for higher
     quality — `qwen2.5-coder:14b`, `deepseek-coder-v2:16b`.
   - **24 GB VRAM**: 32B Q4_K_M — `qwen2.5-coder:32b`,
     `deepseek-coder-v2:33b`.
   - **48 GB+ VRAM**: 70B Q4_K_M — `llama3.3:70b`.
   - **Apple Silicon** (M-series, unified memory): with 32+ GB you
     can run 32B models comfortably; with 64+ GB, 70B is in reach.
4. **Pick by goal** (as of May 2026 — model rankings drift fast):
   - **Coding agent (tool use, function calling)**: `qwen2.5-coder`
     and `deepseek-coder-v2` lead among open-weights. Strict
     function-calling reliability is still below frontier cloud.
   - **General coding (raw completion)**: `codestral`,
     `codellama`, `deepseek-coder`.
   - **Planning / reasoning**: `deepseek-r1-distill`, `qwq`,
     `qwen2.5`.
   - **Summarization / general chat**: `llama3.3`, `qwen2.5`,
     `mistral-large`.
5. **Hand back the exact install command:**
   - Ollama: `ollama pull <model-tag>` (use the exact tag from
     ollama.com/library, e.g. `qwen2.5-coder:14b-instruct-q4_K_M`).
   - LM Studio: search the model catalogue by the exact GGUF
     filename and download from the UI; start the local server
     from the Server tab on port `1234`.
6. **Hand back the openclaude config snippet** to put in
   `~/.openclaude/settings.json` (or `.openclaude-profile.json`
   for project-scoped):

   For Ollama:
   ```
   {
     "env": {
       "CLAUDE_CODE_USE_OPENAI": "1",
       "OPENAI_BASE_URL": "http://localhost:11434/v1"
     },
     "model": "<model-tag>"
   }
   ```
   (Ollama doesn't require a real key; set `OPENAI_API_KEY=ollama`
   in the shell if the client complains about a missing one.)

   For LM Studio: same shape with `OPENAI_BASE_URL` pointing at
   `http://localhost:1234/v1` and `model` set to the loaded
   model's id from the LM Studio Server tab.

7. **Always include the tool-use caveat.** Local models'
   function-calling reliability is lower than frontier cloud
   models — agents will sometimes hallucinate tool names or skip
   tool calls entirely. For serious agentic work, suggest a
   hybrid: local for exploration and quick iteration, cloud for
   the hard final pass.

## Examples

In scope: "I have an AMD RX 9070 with 16 GB VRAM. What should I
run for openclaude coding?"

→ Pick `qwen2.5-coder:14b-instruct-q4_K_M`. Install with
`ollama pull qwen2.5-coder:14b-instruct-q4_K_M`. Settings snippet
with `OPENAI_BASE_URL` at the Ollama OpenAI-compatible endpoint
and `model` set to the same tag. Add the tool-use caveat.

In scope: "I want to switch from OpenAI to local for daily work."

→ Ask hardware and goal first. If the user runs an M3 Max with
64 GB unified memory and primarily codes, recommend
`qwen2.5-coder:32b` for capability, or stay with the 14b for
faster turnaround. Walk through the settings change.

Out of scope: "My Ollama is set up but openclaude can't connect."

→ Existing local setup that broke. Use `provider-debug`.

## Self-check before responding

- Did I ask about hardware (VRAM, RAM, CPU vs GPU) before
  recommending if it wasn't given?
- Did I match the model size to the VRAM tier rather than
  suggesting "the biggest one that fits"?
- Did I distinguish coding-agent (tool use) from general coding
  (raw completion)?
- Did I check whether `bun run profile:recommend` was available
  and use it as the first-pass answer when it exists?
- Did I hand back the exact `ollama pull` tag (or LM Studio file
  identifier)?
- Did I include the `~/.openclaude/settings.json` snippet with
  the right `CLAUDE_CODE_USE_OPENAI` / `OPENAI_BASE_URL` /
  `model` fields?
- Did I flag the tool-use quality caveat?
