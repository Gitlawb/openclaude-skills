---
name: pr-review
title: PR Review
description: Reviews pull requests for correctness, style, and risks.
category: code-review
tags:
  - review
  - github
  - quality
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# PR Review

Review a pull request the way a careful teammate would: read the actual
code, group findings by severity, and make every comment actionable.

## Use this skill when

- The user asks to review a pull request, diff, or set of changes.
- The user pastes a PR URL or a raw diff and asks for feedback.
- The user asks "what's wrong with this PR" or "is this ready to merge".
- The user asks for a summary of what a PR does.
- The user asks to compare two branches.

## Do NOT use this skill when

- The user wants to WRITE new code. Use a coding skill instead — this
  skill reviews code, it does not produce it.
- The user wants a high-level architecture review or wants help planning
  a multi-PR refactor. Use the `refactor-plan` skill.
- The user wants release notes generated from merged PRs. Use the
  `release-maintainer` skill.

## Procedure

1. Get the diff. Prefer these in order, depending on what the user gave
   you:
   - A PR number: fetch the diff with `gh pr diff <number>` and the
     metadata with `gh pr view <number> --json title,body,additions,deletions,files`.
   - Two branches: `git diff <base>...<head> --stat` then
     `git diff <base>...<head>` to see the patch.
   - A raw diff or patch: use it directly; if line numbers look off,
     ask the user for the post-image file path.
2. Understand the scope. Count files touched, lines added/removed, and
   look at the file types. A 12-file PR with 3 lines per file is a
   different review than a 1-file PR with 800 lines.
3. Read the changed code in context, not just the diff hunks. For each
   non-trivial file, open it and read 30-50 lines around each change so
   you understand callers, types, and adjacent invariants. Diff hunks
   hide context — reviewing only the hunk is how missed bugs ship.
4. Check, in this order:
   - Correctness: does the code do what the PR description (or commit
     message) claims? Trace at least one happy path end-to-end.
   - Error handling: what happens on the failure paths? Are errors
     caught, surfaced, logged, or swallowed? Is the failure mode
     appropriate for the layer?
   - Edge cases: empty inputs, very large inputs, unicode, negative
     numbers, concurrency, partial failures, retries, timeouts,
     idempotency.
   - Naming: do new symbols match the rest of the codebase? A function
     named differently from its siblings is a signal something is off.
   - Tests: is the new behavior tested? Do the existing tests still
     cover the changed paths, or did the change move logic out from
     under them? A passing CI on a thinly-tested PR is not a green light.
   - Security: injection (SQL, command, template), auth and authz
     boundaries, untrusted deserialization, secrets in logs or
     responses, unsafe redirects.
   - Performance: obvious regressions, N+1 queries, sync work in a hot
     loop, large allocations, missing indexes.
   - Breaking changes: API shape, return types, side effects, default
     values, file formats, database columns.
5. Group findings by severity:
   - **Blocker** — must fix before merge. Correctness bugs, regressions,
     data loss, security issues.
   - **Important** — should fix, can be follow-up. Missing tests for new
     behavior, unhandled edge cases that are unlikely but real,
     unclear error handling.
   - **Nit** — optional polish. Naming, comments, style consistency.
6. Write the review. For each finding cite `file:line` (or `file:line-line`
   for a range), describe the problem in one sentence, and either
   propose a concrete fix or ask one focused clarifying question. Lead
   with blockers; finish with nits. Keep the tone constructive — you
   are reading the author's work, not grading it.

When the PR is unusually large (more than ~600 lines changed or 20+
files touched), stop and tell the user the PR should be split before
being reviewed. Reviewing a too-large PR in one pass produces a worse
review than reviewing three smaller ones; saying so up front is more
useful than a half-baked sweep. Offer to review each piece as the
author splits it.

## Examples

In scope: "Review PR #142 — adds user search."

→ Run the procedure. Fetch the diff with `gh pr diff 142`. Note the
6 files touched and ~180 lines added. Open each changed file in
`src/search/`: trace the request path from handler to repository,
check the new SQL for parameter binding, check that the new endpoint
has tests (look in `tests/search/`), check that pagination handles
empty result sets. Group findings:
- **Blocker**: `repository.ts:42` builds the query with string
  concatenation — parameterize it.
- **Important**: `handler.ts:88` returns 200 with an empty array on
  invalid input — should be 400 with a message.
- **Nit**: `types.ts:14` — type alias `SearchRes` is inconsistent
  with `SearchResult` used elsewhere.

In scope: "Summarize what PR #87 does."

→ A summary is a valid output of this skill when the user explicitly
asks for one. Read the PR description and diff, then produce a 3–5
bullet summary grouped by area (API changes, schema changes, tests).
Do not invent a review the user did not ask for.

Out of scope: "Write the user search feature."

→ Tell the user that `pr-review` reviews existing code; suggest a
coding skill (or a fresh implementation conversation) for the
implementation work. Do not start writing the feature.

Out of scope: "Tell me whether to merge this — it's a 4000-line PR
across 60 files."

→ A PR this size should be split before being reviewed. Suggest the
author break it into smaller PRs grouped by concern, and offer to
review each piece. Do not attempt a complete review of a PR you
cannot read in a sitting.

## Self-check before responding

- Did I read the full changed files, not just diff hunks?
- Did I check at least one happy path end-to-end?
- Are findings grouped by severity (blocker / important / nit)?
- Does every finding include a specific `file:line` reference?
- Did I look at tests — both new tests added and existing tests that
  cover the changed paths?
- Did I check error handling and at least one realistic edge case?
- Did I flag breaking changes explicitly, not just in passing?
- Is each finding either a concrete fix proposal or a focused
  question — not a vague "consider X"?
- Did I avoid restating what the PR does as "feedback"? A summary is
  fine when the user asks for one, but it is not a review.
- If the PR was unusually large, did I push back on the size rather
  than producing a thin review of every file?
- Did I look for changes that affect more than the file they live in
  — public API, shared utilities, exported types, database schema?
- Did I avoid generic "consider X" comments? Each one should be a
  concrete fix or a specific question.
