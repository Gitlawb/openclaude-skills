---
name: mcp-server-pick
title: MCP Server Pick
description: Recommends and configures MCP servers for openclaude based on the user's described workflow.
category: provider
tags:
  - openclaude
  - mcp
  - integrations
  - model-context-protocol
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# MCP Server Pick

The user has a workflow that needs openclaude to reach out beyond its
built-in tools — GitHub, Slack, a database, the filesystem outside the
project root. Pick the one or two MCP servers that match, wire them
into `~/.openclaude/settings.json`, and verify they show up.

## Use this skill when

- The user describes a workflow and asks which MCP servers would
  help.
- The user asks "how do I connect openclaude to GitHub / Slack /
  Postgres / the filesystem outside my project".
- The user asks "what MCP servers should I install".
- The user wants to extend openclaude with external tools they
  don't currently have.

## Do NOT use this skill when

- The user wants to **build** a custom MCP server from scratch.
  Out of scope for this skill.
- The user has an MCP server installed and it's not working. Route
  to `provider-debug` (for config issues) or `error-message-decode`
  (for runtime errors from the server itself).
- The user wants to define a custom subagent. Use `subagent-design`.

## Procedure

1. **Ask what the workflow actually involves before recommending.**
   "Which MCP servers should I install?" with no workflow given is
   the wrong question — recommendations should follow intent, not
   the other way around. Map intent to servers:
   - **Filesystem access outside the project root** → `filesystem`
     MCP.
   - **GitHub PRs / issues / releases** → `github` MCP.
   - **Slack messages / channel history** → `slack` MCP.
   - **Postgres / SQLite queries** → `postgres` or `sqlite` MCP.
   - **Web fetching beyond openclaude's `WebFetch`** → `fetch` MCP
     (only if there's a real reason — see step 5 on overlap).
   - **Persistent memory across sessions** → `memory` MCP.
   - **Multi-step reasoning helpers** → `sequential-thinking` MCP.
   - **Web search beyond openclaude's `WebSearch`** → `brave-search`
     MCP.
   - **Browser automation** → `puppeteer` MCP.
   Limit recommendations to one or two — dumping the whole catalogue
   teaches nothing.
2. **Install via `~/.openclaude/settings.json`** under
   `mcpServers`. Stdio servers use `command` + `args`; HTTP servers
   use `url`. Example for GitHub:

   ```
   {
     "mcpServers": {
       "github": {
         "command": "npx",
         "args": ["-y", "@modelcontextprotocol/server-github"],
         "env": {
           "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
         }
       }
     }
   }
   ```

   Or use `/mcp` inside a session for interactive install —
   `/mcp` walks OAuth flows for servers that need them and is
   usually the easier path for first-time installs.
3. **Verify with `/mcp`** after install. The command lists
   connected servers and the tools each exposes. Each MCP server
   publishes one or more tools that then show up in openclaude's
   tool list and become callable like any built-in.
4. **Know the common pitfalls:**
   - **Token-required servers** (`github`, `slack`, `brave-search`)
     need their env vars set **before openclaude starts**, not
     inside the conversation. Restart the session after exporting.
   - **`filesystem`** defaults to a sandbox path; you must
     explicitly allowlist the project directory (or whatever you
     want it to reach) in the server's args.
   - **OAuth flows** are supported interactively via `/mcp`; the
     stdio-server path doesn't drive OAuth on its own.
   - **Token scopes** matter: a `github` MCP token needs
     `repo` / `read:org` (or the equivalent) — a `models:read`-only
     token won't work.
5. **Watch for overlap with built-in tools.** openclaude already
   ships `WebFetch` and `WebSearch`; the `fetch` and
   `brave-search` MCPs only add value when:
   - The built-in won't reach the target (auth-gated endpoint,
     non-public host).
   - The MCP returns richer structured data the built-in doesn't.
   - The user needs a specific browser-like behaviour (cookies,
     redirects, headers) the built-in doesn't support.
   When there's no real reason, prefer the built-in — fewer moving
   parts.
6. **Suggest one concrete workflow** that uses the server after
   install. E.g. with the `github` MCP wired: "list my open PRs
   and summarise the ones with failing CI". A live first
   invocation is the cheapest proof the install actually works.

## Examples

In scope: "I want openclaude to read my Slack and surface what to
work on."

→ Recommend the `slack` MCP. Walk through creating a Slack app
with `channels:history`, `users:read`, `groups:history` scopes,
setting `SLACK_BOT_TOKEN` and `SLACK_TEAM_ID` in the shell, and
the `mcpServers` block. First workflow: `summarise activity in
#dev for the last 24 hours and propose the top three things to
work on`.

In scope: "I want openclaude to query my Postgres dev database."

→ Recommend the `postgres` MCP. Configure with the database URL
as an arg or env (the postgres-driver scheme, not http). Note
that the MCP defaults to read-only mode unless `--write` is
passed — keep it read-only for dev safety.

Out of scope: "Write me a custom MCP server."

→ Building MCPs is a separate skill. Suggest the official
`@modelcontextprotocol/sdk` and route the user to the right
docs.

## Self-check before responding

- Did I ask what the workflow is before recommending?
- Did I keep recommendations to one or two servers, not a
  catalogue dump?
- Did I include the exact `mcpServers` config block in
  `~/.openclaude/settings.json`?
- Did I flag the env vars that must be set **before** openclaude
  starts (not inside the conversation)?
- Did I propose a concrete first workflow that exercises the
  server?
- For servers that overlap with built-ins (`fetch` /
  `brave-search`), did I name a real reason to prefer the MCP?
- Did I verify the install with `/mcp` rather than assuming it
  worked?
