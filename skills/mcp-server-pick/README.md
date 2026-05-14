# mcp-server-pick

Recommends one or two MCP servers for a described workflow, wires them
into the `mcpServers` block in `~/.openclaude/settings.json`, and
verifies the install with `/mcp`. Covers `filesystem`, `github`,
`slack`, `postgres`, `sqlite`, `fetch`, `memory`, `sequential-thinking`,
`brave-search`, `puppeteer`. Flags overlap with built-in `WebFetch` /
`WebSearch` and refuses to dump the whole catalogue.
