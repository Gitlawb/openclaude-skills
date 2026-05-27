# Gitlawb Skill Hub

> Curated registry of installable skills for the [`openclaude`](https://github.com/Gitlawb/openclaude) CLI.

[![npm](https://img.shields.io/npm/v/@gitlawb/skill-validator?label=%40gitlawb%2Fskill-validator)](https://www.npmjs.com/package/@gitlawb/skill-validator)
[![Skills](https://img.shields.io/badge/skills-10-orange)](#available-skills)
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
- Non-community trust must be backed by `.maintainers/trust.json`; frontmatter alone cannot self-promote a skill
- `revocations.json` is reserved as the kill-switch list for compromised or withdrawn skill versions

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
| [`database-review`](skills/database-review/) | database | Reviews database schema changes, migrations, and queries. |
| [`debugging`](skills/debugging/) | debugging | Helps diagnose and fix runtime errors, crashes, and unexpected behavior. |
| [`frontend-implementation`](skills/frontend-implementation/) | frontend | Implements frontend components following project conventions. |
| [`git-conflict-resolve`](skills/git-conflict-resolve/) | code-review | Resolves merge and rebase conflicts by preserving both sides' intent. |
| [`pr-review`](skills/pr-review/) | code-review | Reviews pull requests for correctness, style, and risks. |
| [`provider-debug`](skills/provider-debug/) | provider | Diagnoses openclaude provider configuration problems and proposes fixes. |
| [`security-audit`](skills/security-audit/) | security | Reviews code changes for common security risks. |
| [`test-writer`](skills/test-writer/) | testing | Writes unit, integration, and end-to-end tests for existing or new code. |

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
tools_required: [Read, Bash]
min_openclaude_version: 0.10.0
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
for skills authored by Gitlawb maintainers. Maintainers promote a skill
by adding the matching `gitlawb/<name>@<version>` entry to
`.maintainers/trust.json`; contributors should not self-promote in the
skill file. See [`DECISIONS.md`](DECISIONS.md) for the trust tier
definitions.

## Trust tiers

| Tier | Who authors it | Review requirement |
|------|----------------|--------------------|
| `official` | Gitlawb maintainers | 2-maintainer review |
| `verified` | Third-party | 1-maintainer review, same quality bar as official |
| `community` | Third-party | Automated checks only; "review before enabling" warning in CLI |
| `deprecated` | Any | Maintainer marked as replaced/abandoned; visible but discouraged |

`trust` in `SKILL.md` is validated for readability, but registry output is
controlled by `.maintainers/trust.json`. If a PR adds a new skill with
`trust: official` and no maintainer policy entry, `bun run build:registry`
fails. This prevents social-engineering PRs from gaining official or
verified badges by editing frontmatter.

## Security model

The validator scans every line of a skill body, including fenced code blocks.
It rejects hidden Unicode instructions, HTML comments, fake chat role markers,
prompt-injection phrasing, sensitive credential paths, common exfiltration
endpoints, unsafe fetch helpers, encoded eval patterns, and confirmation-bypass
language. Authors documenting a dangerous pattern should describe it in prose
or obfuscate the risky literal.

Skills are prompt content, not executable packages. Skill folders may only
contain `SKILL.md`, optional `README.md`, and the reserved `.skill-meta.json`.
No scripts, binaries, nested folders, or postinstall behavior are allowed.

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
