---
name: pr-description-writer
title: PR Description Writer
description: Writes pull request descriptions with Problem / Fix / Verification structure.
category: code-review
tags:
  - github
  - pr
  - documentation
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# PR Description Writer

Write the PR body the reviewer wishes the author had written. Lead with
what the PR actually changes, what the reviewer should look for, and how
to verify the change locally. Match the repo's existing shape rather than
imposing a template.

## Use this skill when

- The user is opening a PR and asks for a description or body.
- The user pastes a branch name or a diff and asks "what should this
  PR's description say".
- The user asks to write a PR body for a specific PR number.
- The user asks to improve, rewrite, or shorten an existing PR
  description.

## Do NOT use this skill when

- The user wants you to **review** a PR's code. Use `pr-review`.
- The user wants a single-commit message. Use `commit-message-craft`.
- The user wants release notes synthesized from many merged PRs. Use
  `release-maintainer`.
- The PR doesn't exist yet and there's no branch with changes to
  describe. Ask the user to push or commit something first.

## Procedure

1. Gather the actual changes. Prefer a real diff over the user's
   recollection of it.
   - If the user gave a PR number: `gh pr diff <n>` for the patch and
     `gh pr view <n> --json title,body,additions,deletions,files,baseRefName,headRefName`
     for metadata.
   - If the user gave a branch: `git fetch && git diff <base>...HEAD --stat`
     then `git diff <base>...HEAD`.
   - If the diff is large, read the stat and the most significant
     hunks; don't skim the whole patch.
2. Learn the repo's PR convention from 3–5 recent merged PRs:
   `gh pr list --state merged --limit 5 --json title,body,number`. Look
   for the dominant shape — usually one of:
   - **Problem / Fix / Verification** (most common)
   - **What / Why / How**
   - A paragraph + a test-plan checklist
   - A bare summary with no sections (small repos)
   Match the dominant style. Don't impose Problem/Fix/Verification on
   a repo that uses paragraphs.
3. Check for linked issues. Look at the branch name (`fix/123-…`,
   `PROJ-456-…`) and at any `Closes` / `Fixes` / `Resolves` keyword
   used in recent merged PRs. Use the repo's existing keyword.
4. Draft the body. Default shape (Problem / Fix / Verification) when
   the repo has no clear convention:
   - **Problem** — one or two sentences on what's broken, missing, or
     awkward. The why, not the what.
   - **Fix** — what this PR does, anchored to specific files or
     directories. Bullet points, not prose.
   - **Verification** — concrete commands the reviewer can run plus
     the expected output. "Run `bun test` and confirm 56/56" beats
     "tests pass".
   - **Out of scope** — call out things the reviewer might expect to
     see fixed but that this PR deliberately doesn't touch.
5. Flag breaking changes explicitly. A breaking change buried in a
   bullet is a breaking change shipped by accident. Lead the
   description with a **Breaking** callout when there is one, and
   include the migration step.
6. Add UI screenshots/placeholders if the diff touches a rendered
   surface. A line like `<!-- screenshot of the new settings panel -->`
   tells the author to attach one before requesting review.
7. Match the tone — formal vs casual, first vs third person — from
   the recent merged PRs. Don't write "Closes the bug." in a repo
   that uses "fixes the bug where ...".
8. Show the draft. Don't push the description to the PR via
   `gh pr edit` unless the user explicitly asks.

## Examples

In scope: "write a PR description for this branch."

→ Run `git diff main...HEAD --stat` and read the patch. Run
`gh pr list --state merged --limit 5 --json title,body` and notice
the repo uses Problem/Fix/Verification with `Closes #N`. Produce:

```
## Problem
The HTTP client retried 5xx responses but not network errors,
which are the most common transient failure in production.

## Fix
- src/http/retry.ts: extend retry condition to cover ECONNRESET
  and ETIMEDOUT in addition to 5xx
- src/http/retry.test.ts: cases for both new error codes

## Verification
- `bun test src/http` — 12/12 pass
- `bun run example` — observed retries on simulated network drop

Closes #214
```

In scope: "improve this PR description: <existing text>."

→ Read the existing text and the diff. Keep the parts that survive
contact with reality; rewrite the rest to match Problem/Fix/Verification
and add concrete verification commands.

Out of scope: "review this PR."

→ This skill describes; `pr-review` reviews. Tell the user and stop
before writing anything.

## Self-check before responding

- Did I read the actual diff (or PR view) before writing the body?
- Did I check 3–5 recent merged PRs and match the dominant convention?
- Is the **Verification** section composed of runnable commands with
  expected output, not "test it"?
- Did I use the repo's existing issue-linking keyword (`Closes` /
  `Fixes` / `Resolves`) rather than guessing?
- Did I flag breaking changes prominently if any?
- Is my tone consistent with recent merged PRs in the same repo?
- Did I avoid pushing the description to the PR myself when the user
  only asked for the draft?
