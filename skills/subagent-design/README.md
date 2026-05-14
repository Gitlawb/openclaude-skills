# subagent-design

Writes custom openclaude subagent definitions that go in
`.openclaude/agents/<name>.md` (project) or `~/.openclaude/agents/<name>.md`
(user-global). Forces a narrow scope, picks the minimum tool allowlist
from openclaude's built-in tool set, and structures the system prompt
around RULES / PROCEDURE / OUTPUT FORMAT. Mirrors the shape of
`explore-agent`, `plan-agent`, `verification-agent`, `general-purpose`,
and `claude-code-guide`.
