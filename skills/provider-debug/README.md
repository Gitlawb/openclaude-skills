# provider-debug

Diagnoses openclaude provider configuration issues. Reads
`~/.openclaude/settings.json` (and any project `.openclaude-profile.json`),
checks for conflicting `CLAUDE_CODE_USE_*` flags, identifies model /
endpoint / auth mismatches, and proposes a fix with a verification
command. Covers OpenAI, Gemini, Anthropic, Ollama, LM Studio, Bedrock,
Vertex, and GitHub Models. Example: "I get a 400 from my provider, what's
wrong?"
