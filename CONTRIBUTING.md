# Contributing to openclaude-skills

Thanks for thinking about adding a skill. This registry is the source of
truth for the Gitlawb Skill Hub — what lands here is what `openclaude`
users install. Keeping the bar high keeps the hub worth installing from.

## Quick start

```
git clone https://github.com/Gitlawb/openclaude-skills
cd openclaude-skills
bun install
```

Create your skill folder:

```
mkdir skills/<your-skill-name>
```

Copy the structure of [`skills/pr-review/`](skills/pr-review/) — it is
the reference template every skill should follow.

## SKILL.md template

```markdown
---
name: <kebab-case-name>
title: <Display Title>
description: <One sentence, <= 200 chars>
category: <one of the approved categories>
tags:
  - <kebab-case>
  - <kebab-case>
trust: community
version: 0.1.0
license: MIT
author: <your-github-handle>
tools_required:
  - Read
min_openclaude_version: 0.10.0
---

# <Display Title>

A one- or two-paragraph framing of what this skill does.

## Use this skill when

- 4-5 concrete trigger sentences.

## Do NOT use this skill when

- 2-3 out-of-scope cases that point at the right alternative skill.

## Procedure

1. Numbered steps with concrete tool calls and decisions.

## Examples

In scope: <example> → <what to do>
Out of scope: <example> → <what to do instead>

## Self-check before responding

- Specific checklist items the model can verify against its own output.
```

The approved categories and the full schema live in
[`DECISIONS.md`](DECISIONS.md).

`tools_required` and `min_openclaude_version` are optional today, but add
them when they help users understand what the skill needs before installing
it.

## Validate locally

```
bun run scripts/validate-skill.ts skills/<your-skill-name>/
```

Exit codes:
- **0** — clean, ready to submit.
- **1** — errors. Read the output, fix them.
- **2** — warnings only. Address them or explain in the PR why not.

## Rebuild the registry

```
bun run build:registry
```

Commit the regenerated `registry.json` in the same PR as the skill — CI
fails the PR if the committed registry is stale.

## Trust tiers

- **`community`** — first-time contributors, third-party authored.
  Passes automated checks; the CLI shows a "review before enabling"
  warning. Default for new contributions.
- **`verified`** — third-party authored, vouched for by a maintainer
  after review. Same quality bar as `official`. Comes from a
  follow-up PR, not the first one.
- **`official`** — Gitlawb maintainer authored, two-maintainer
  approval. Maintainers only.

Set `trust: community` in your frontmatter for your first PR. Don't
ask for `verified` or `official` upfront. Maintainers promote skills by
editing `.maintainers/trust.json`; a PR that self-declares
`trust: official` or `trust: verified` without that maintainer policy entry
will fail the registry build.

## Security scanner

The validator scans the body as agent-readable instructions, not just
human-readable markdown. It rejects hidden characters, HTML comments, fake
chat role markers, prompt-injection wording, sensitive credential paths,
common exfiltration endpoints, external fetch helpers, encoded eval patterns,
and confirmation-bypass language.

If you need to explain a dangerous pattern, describe it in prose or replace
the dangerous literal with a placeholder such as `ATTACKER_URL`. Do not hide
instructions in comments or zero-width characters.

## Submitting a PR

Pick the right template at PR-create time:

- New skill → `?template=new_skill.md`
- Update to an existing skill → `?template=skill_update.md`

GitHub also shows the templates in the dropdown when you open a PR.

## Philosophy

Skills should be narrow and concrete. A skill called "help me code" is
worthless — it never fires correctly because its triggers are too vague,
and when it does fire it gives generic answers. A skill called
"review a Postgres migration for lock risk" is gold — its triggers are
obvious, its procedure has real content, and its self-check has teeth.

Write skills you would actually want `openclaude` to run on your own
work. If the procedure is something you would skip while reading it,
the model will skip it too.

The "Use this skill when" rules are the most important part of a
skill. They decide whether the skill ever runs at all. Make them
concrete enough that you could quote them in a courtroom and lose a
case by violating them.

If you find yourself writing "consider X" or "be careful about Y" in
a procedure step, you have not written the step. Replace the
hand-wave with the actual action, the actual decision, or the actual
check.

## Review

Every PR is reviewed against [`REVIEW_POLICY.md`](REVIEW_POLICY.md),
which spells out the per-tier reviewer requirements, the rejection
criteria, and what triggers a transition between tiers. Read it before
submitting if you have not contributed here before.

SLA is best effort — there is no committed turnaround time. Pinging
maintainers a week after a PR opens is fine; pinging on day one is
noise.

## Code of conduct

Be specific, be technical, be kind. Disagreement is welcome on
substance; sniping at people is not.
