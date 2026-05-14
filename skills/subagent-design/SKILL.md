---
name: subagent-design
title: Subagent Design
description: Writes custom openclaude subagent definitions in .openclaude/agents/.
category: provider
tags:
  - openclaude
  - subagents
  - agents
  - customization
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Subagent Design

The user wants a custom subagent that openclaude can spawn from a main
session. Decide what it should and shouldn't do, write a narrow agent
definition with the minimum tool allowlist, and put it where openclaude
will discover it.

## Use this skill when

- The user wants to create a custom subagent for openclaude.
- The user says "I want a specialised agent for X" or "spawn a
  different agent for security reviews".
- The user wants to encode a repeatable workflow as a callable
  agent rather than re-prompting from scratch.
- The user asks "how do I make my own openclaude agent?".

## Do NOT use this skill when

- The user wants to write a skill (SKILL.md). Skills are
  instructions the agent reads; agents are spawned via the
  AgentTool with their own tool set and system prompt.
- The user wants the agent to run on a schedule. Use
  `loop-task-author`.
- The user wants to add an external tool (GitHub, Slack, Postgres)
  rather than a new agent. Use `mcp-server-pick`.

## Procedure

1. **Confirm the agent's scope is narrow and concrete.** Vague
   agents ("smart helper") underperform; narrow agents
   ("read-only file searcher with no Bash") outperform. Push back
   on broad descriptions and ask the user what the agent should
   refuse to do.
2. **Pick the minimum tool allowlist.** openclaude's built-in
   tools include:
   - File operations: `FileRead`, `FileWrite`, `FileEdit`, `Glob`,
     `Grep`.
   - Shell: `Bash`.
   - Web: `WebSearch`, `WebFetch`.
   - Orchestration: `AgentTool` (recursive subagent spawning),
     `TodoWrite`, `TaskCreate`, `TaskList`, `TaskUpdate`.
   - Plus any MCP tools the project has installed.
   Match the toolset to the job. A read-only agent should drop
   `FileWrite`, `FileEdit`, and `Bash`. A test-runner agent
   needs `Bash` but no file writes.
3. **Choose allowlist vs denylist.**
   - `tools: [...]` — restrictive; the agent can only use the
     named tools. Safer for specialists.
   - `disallowedTools: [...]` — permissive minus the named tools.
     Right for "give me everything except X".
   Default to allowlist when the agent has a clear job.
4. **Write the agent file** at `.openclaude/agents/<name>.md`
   (project-scoped — checked into the repo) or
   `~/.openclaude/agents/<name>.md` (user-global fallback).
   The shape openclaude expects:

   ```
   ---
   name: <name>
   description: <when openclaude should spawn this agent>
   tools: [FileRead, Grep, Glob]
   model: <optional override of the default model>
   ---

   You are a <role> for openclaude. You excel at <one specific task>.

   === RULES ===
   - <constraint, e.g. "read-only — refuse to call FileWrite/FileEdit/Bash">
   - <scope boundary, e.g. "only operate inside src/auth/**">
   - <what to refuse, e.g. "if asked to run shell commands, decline">

   === PROCEDURE ===
   1. <step the agent follows>
   2. <next step>
   ...

   === OUTPUT FORMAT ===
   - <how the agent reports back to the main session — bullet
     list, JSON, narrative, etc.>
   ```

5. **Mirror the built-in agents' shape** when in doubt. openclaude
   ships:
   - `explore-agent` — read-only file search specialist.
   - `plan-agent` — produces plans before execution.
   - `verification-agent` — verifies completed work matches the
     plan.
   - `general-purpose` — default fallback for anything not
     specialised.
   - `claude-code-guide` — helps with openclaude itself.
   Read the closest match (e.g. `explore-agent` for a read-only
   specialist) and copy the patterns that fit.
6. **Verify the agent is discovered** by running `/agents` from a
   main openclaude session. The new agent should appear with its
   name and description. Spawn it once with a trivial task and
   confirm it respects its tool restrictions — if you allowlisted
   `FileRead` only and the agent ran `Bash`, the restriction
   didn't take.

## Examples

In scope: "Make me a security-review agent that's read-only and
focuses on auth flows."

→ Create `.openclaude/agents/security-reviewer.md` with
`tools: [FileRead, Grep, Glob]` (no `Bash`, no `FileWrite`,
no `FileEdit`). System prompt names auth as the scope and says
to escalate to the main session if asked to modify code. Output
format: blocker / important / nit groupings with `file:line`
references.

In scope: "I want an agent that only runs tests and reports the
failures."

→ Create `.openclaude/agents/test-runner.md` with
`tools: [Bash, FileRead]`. RULES section says no file writes, no
network calls beyond what the test runner makes. PROCEDURE: run
the project's test script, capture failures, format them. OUTPUT:
a list of failing tests with the bottom-of-trace lines, one per
test.

Out of scope: "Make me a skill."

→ Skills and agents are different artifacts. Suggest writing a
SKILL.md directly (or use a future skill-authoring skill if one
ships).

## Self-check before responding

- Did I confirm the agent's scope is narrow before writing?
- Is the tool list the minimum that does the job?
- Did I use the allowlist form (`tools:`) for restrictive
  agents?
- Does the system prompt state read-only / scope boundaries
  explicitly when applicable?
- Did I include a clear OUTPUT FORMAT section so the main
  session can consume the result?
- Did I reference at least one built-in agent (`explore-agent`,
  `plan-agent`, etc.) as a pattern to mirror?
- Did I propose verifying discovery with `/agents` and a trivial
  test spawn?
