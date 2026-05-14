# local-model-picker

Recommends Ollama or LM Studio models for openclaude based on the user's
hardware (VRAM tier, Apple Silicon, CPU-only) and goal (agentic coding,
general coding, planning, summarization). Hands back the exact
`ollama pull` tag plus the `~/.openclaude/settings.json` snippet that
wires the model in. Flags the local-vs-cloud tool-use quality gap.
Example: "I have 16 GB VRAM, which model for coding?"
