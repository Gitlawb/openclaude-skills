# Gitlawb Skill Hub

> Curated registry of installable skills for the [`openclaude`](https://github.com/Gitlawb/openclaude) CLI.

[![npm](https://img.shields.io/npm/v/@gitlawb/skill-validator?label=%40gitlawb%2Fskill-validator)](https://www.npmjs.com/package/@gitlawb/skill-validator)
[![Skills](https://img.shields.io/badge/skills-26-blue)](#available-skills)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Validate](https://github.com/Gitlawb/openclaude-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/Gitlawb/openclaude-skills/actions/workflows/validate.yml)

Skills are reusable, opinionated workflows that teach `openclaude` how to
handle a specific kind of task — reviewing a pull request, auditing code
for security risks, debugging a runtime error, writing tests. Instead of
re-prompting from scratch every time, you install a skill once and the
agent knows how to do that job.

This repo is the source of truth. The CLI reads `registry.json`. The
[Skill Hub website](https://github.com/Gitlawb/openclaude-site) renders
the same data as a browsable catalog.

## How it works

```
           ┌──────────────────────────────────────┐
           │  Gitlawb/openclaude-skills (this)    │
           │                                      │
           │  skills/<name>/SKILL.md  ─► registry.json
           └──────────────────────────────────────┘
                             │
             ┌───────────────┴────────────────┐
             ▼                                ▼
  ┌─────────────────────┐         ┌─────────────────────┐
  │   openclaude CLI    │         │  openclaude-site    │
  │  installs skills    │         │  browses catalog    │
  └─────────────────────┘         └─────────────────────┘
```

- `registry.json` is built from `skills/<name>/SKILL.md` files
- Every entry is validated by [`@gitlawb/skill-validator`](https://www.npmjs.com/package/@gitlawb/skill-validator)
- GitHub serves `registry.json` at a stable raw URL — no backend, no server, no API

## Install a skill

```
openclaude skills install gitlawb/<name>
```

For example:

```
openclaude skills install gitlawb/pr-review
```

After install, start a new openclaude session. The skill becomes available
the next time you ask the agent something that matches the skill's
"Use this skill when" rules.

## Available skills

| Skill | Category | Description |
|-------|----------|-------------|
| [`ci-fix`](skills/ci-fix/) | ci | Diagnoses and fixes CI pipeline failures. |
| [`codeql-fix`](skills/codeql-fix/) | security | Reads a CodeQL or static-analysis finding and produces a targeted fix. |
| [`commit-message-craft`](skills/commit-message-craft/) | code-review | Writes commit messages that follow the repo's existing conventions. |
| [`database-review`](skills/database-review/) | database | Reviews database schema changes, migrations, and queries. |
| [`debugging`](skills/debugging/) | debugging | Helps diagnose and fix runtime errors, crashes, and unexpected behavior. |
| [`dockerfile-review`](skills/dockerfile-review/) | ci | Reviews Dockerfiles for size, security, caching, and reproducibility issues. |
| [`docs-writer`](skills/docs-writer/) | docs | Writes or updates documentation that matches the project's voice and structure. |
| [`error-message-decode`](skills/error-message-decode/) | debugging | Decodes cryptic error messages, stack traces, and panics into actual causes and fix paths. |
| [`frontend-implementation`](skills/frontend-implementation/) | frontend | Implements frontend components following project conventions. |
| [`git-conflict-resolve`](skills/git-conflict-resolve/) | code-review | Resolves merge and rebase conflicts by preserving both sides' intent. |
| [`local-model-picker`](skills/local-model-picker/) | provider | Recommends Ollama or LM Studio models based on hardware and goal. |
| [`loop-task-author`](skills/loop-task-author/) | provider | Writes .openclaude/loop.md files for openclaude's scheduled maintenance loop. |
| [`mcp-server-pick`](skills/mcp-server-pick/) | provider | Recommends and configures MCP servers for openclaude based on the user's described workflow. |
| [`nextjs-hydration-fix`](skills/nextjs-hydration-fix/) | frontend | Diagnoses Next.js hydration mismatches and proposes the smallest fix that resolves them. |
| [`pr-description-writer`](skills/pr-description-writer/) | code-review | Writes pull request descriptions with Problem / Fix / Verification structure. |
| [`pr-review`](skills/pr-review/) | code-review | Reviews pull requests for correctness, style, and risks. |
| [`provider-debug`](skills/provider-debug/) | provider | Diagnoses openclaude provider configuration problems and proposes fixes. |
| [`provider-setup`](skills/provider-setup/) | provider | Configures openclaude to route through OpenAI-compatible providers. |
| [`refactor-plan`](skills/refactor-plan/) | refactor | Plans multi-file refactors with clear steps and risk assessment. |
| [`regex-craft`](skills/regex-craft/) | general | Writes regex patterns from natural-language descriptions, with test cases and pitfall warnings. |
| [`release-maintainer`](skills/release-maintainer/) | release | Prepares releases — version bumps, changelogs, release notes. |
| [`security-audit`](skills/security-audit/) | security | Reviews code changes for common security risks. |
| [`subagent-design`](skills/subagent-design/) | provider | Writes custom openclaude subagent definitions in .openclaude/agents/. |
| [`supabase-rls-audit`](skills/supabase-rls-audit/) | security | Audits Supabase Row Level Security policies for missing tables, inverted logic, and anonymous access leaks. |
| [`test-writer`](skills/test-writer/) | testing | Writes unit, integration, and end-to-end tests for existing or new code. |
| [`vercel-build-fail-decode`](skills/vercel-build-fail-decode/) | ci | Reads Vercel build logs, finds the actual error among the noise, and proposes a fix. |

## What a skill looks like

Every skill is a folder under `skills/` with a `SKILL.md` file:

```
skills/pr-review/
  ├── SKILL.md        # the skill itself: frontmatter + procedure
  └── README.md       # short description for people browsing GitHub
```

`SKILL.md` is plain markdown with YAML frontmatter:

```markdown
---
name: pr-review
title: PR Review
description: Reviews pull requests for correctness, style, and risks.
category: code-review
tags: [review, github, quality]
trust: official
version: 0.1.0
license: MIT
---

# PR Review

## Use this skill when
- The user asks to review a pull request or diff...

## Procedure
1. Get the diff with `gh pr diff <number>`...
```

See [`skills/pr-review/SKILL.md`](skills/pr-review/SKILL.md) for the full
reference structure.

## Contributing a skill

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide and
[`REVIEW_POLICY.md`](REVIEW_POLICY.md) for the rules every PR is reviewed
against. The short version:

1. Create `skills/<your-skill>/SKILL.md` — copy the structure from
   [`skills/pr-review/`](skills/pr-review/).
2. Validate it locally:
   ```
   bun install
   bun run scripts/validate-skill.ts skills/<your-skill>/
   ```
3. Rebuild the registry:
   ```
   bun run build:registry
   ```
4. Open a PR using the "new skill" template.

First-time contributors should set `trust: community` in frontmatter.
Maintainer-reviewed skills become `verified`. `official` is reserved
for skills authored by Gitlawb maintainers. See
[`DECISIONS.md`](DECISIONS.md) for the trust tier definitions.

## Trust tiers

| Tier | Who authors it | Review requirement |
|------|----------------|--------------------|
| `official` | Gitlawb maintainers | 2-maintainer review |
| `verified` | Third-party | 1-maintainer review, same quality bar as official |
| `community` | Third-party | Automated checks only; "review before enabling" warning in CLI |

The MVP ships only `official` skills. The schema accepts `verified` and
`community` so the CLI and website can render them correctly once
community submissions open.

## Validator

The validator is published to npm as
[`@gitlawb/skill-validator`](https://www.npmjs.com/package/@gitlawb/skill-validator).
Its source lives at [`packages/validator/`](packages/validator/) in this
repo. The CLI, CI workflows, and any third-party tooling depend on the
published package rather than re-implementing the rules.

## Related projects

- **[`Gitlawb/openclaude`](https://github.com/Gitlawb/openclaude)** — the
  CLI that installs and runs skills.
- **[`Gitlawb/openclaude-site`](https://github.com/Gitlawb/openclaude-site)** —
  the public Skill Hub website. Reads this repo's `registry.json` at build
  time and renders it as a browsable catalog.

## License

MIT. See [LICENSE](LICENSE).
