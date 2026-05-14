---
name: commit-message-craft
title: Commit Message Craft
description: Writes commit messages that follow the repo's existing conventions.
category: code-review
tags:
  - git
  - commits
  - conventional-commits
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Commit Message Craft

Inspect the staged change, learn what the repo's history looks like, and
write a commit message that fits in. A message that doesn't match the
surrounding history is its own form of noise.

## Use this skill when

- The user has staged changes and asks for a commit message.
- The user says "commit this" or "what should I commit this as".
- The user asks to split a multi-purpose change into separate commits,
  each with its own message.
- The user asks to amend or rewrite an existing commit message.

## Do NOT use this skill when

- The user wants you to actually **run** `git commit` without showing the
  message first. Write the message, show it, ask before running.
- The user wants release notes synthesized from many commits — use
  `release-maintainer`.
- The user wants a PR description — use `pr-description-writer`.
- The repo has no staged changes. Ask the user to stage what they want
  committed (`git add -p`); guessing from the unstaged diff is wrong.

## Procedure

1. Confirm there's something to commit. Run `git diff --staged --stat`.
   If it's empty, stop and tell the user to stage first.
2. Read the actual diff: `git diff --staged`. Read all of it for small
   changes; for large changes, read the stat and then the most
   significant hunks. The message describes what the diff does — you
   cannot write it without reading the diff.
3. Learn the repo's existing style. Run `git log --oneline -20` (or
   `-50` for a richer sample). Note:
   - **Format**: conventional commits (`feat(scope): …`), ticket-
     prefixed (`PROJ-123: …`), or plain imperative.
   - **Scope conventions**: how scopes are named, how granular they are.
   - **Subject style**: capitalization, presence/absence of a trailing
     period (most repos: no period).
   - **Body usage**: do recent commits include bodies? Brief or
     paragraph?
4. Classify the change. Pick the type that matches the dominant
   intent of the diff:
   - `feat` — new behavior, additive
   - `fix` — bug fix
   - `refactor` — internal restructure, no behavior change
   - `docs` — documentation only
   - `test` — test changes only
   - `chore` — tooling, deps, config
   - `ci` / `build` / `perf` if the repo uses them
   If two types could apply (e.g. a fix that needed a refactor), the
   change is probably multi-purpose — see step 7.
5. Write the subject line:
   - Imperative mood (`add`, not `added`/`adds`).
   - Under 72 characters total. Aim for 50 if natural.
   - No trailing period.
   - If the repo uses conventional commits, follow the type/scope shape;
     otherwise plain imperative.
6. Write a body only when needed. Wrap at 72 chars. Lead with **why**,
   not what — the diff already says what. Mention any non-obvious
   constraint, the bug's root cause, or anything a reviewer would
   want to know that isn't visible from the diff.
7. If the diff is multi-purpose, propose splitting instead of
   compressing two ideas into one message. Show the commands:
   ```
   git restore --staged .
   git add -p <files for change A>
   # commit A
   git add -p <files for change B>
   # commit B
   ```
   Then write each commit's message separately.
8. If the repo links commits to issues (look for `Closes #N` /
   `Fixes #N` / `Refs PROJ-123` in recent commits), use the same
   keyword and shape.
9. Show the message. Don't run `git commit` yourself unless the
   user explicitly asks.

## Examples

In scope: "commit my staged changes" — a single self-contained change.

→ Run `git diff --staged --stat` and `git diff --staged`. Run
`git log --oneline -20` and notice the repo uses conventional commits.
The diff adds a retry wrapper to the HTTP client. Propose:

```
feat(http): retry transient errors up to 3 times

Wrap the existing fetch in a small retry loop so callers don't have to
handle 5xx and network blips. Backoff is 100ms → 200ms → 400ms.
```

In scope: "commit this" — and the diff has both a bug fix and an
unrelated rename.

→ Don't compress. Propose two commits with the split commands and
write a message for each: `fix(parser): handle empty input` and
`refactor(parser): rename token to lexeme`.

Out of scope: "commit and push for me." 

→ Write the message, show it, then ask before running `git commit` and
`git push`. Pushing on the user's behalf is a separate authorization.

## Self-check before responding

- Did I actually read the staged diff, not just the file list?
- Did I check `git log --oneline` and match the repo's existing
  style (conventional / ticket-prefixed / plain imperative)?
- Is the subject imperative, under 72 chars, with no trailing period?
- Did I avoid imposing conventional commits on a repo that doesn't
  use them, or stripping them from a repo that does?
- If the diff is multi-purpose, did I propose a split instead of
  smushing two ideas into one message?
- Did I reference the issue using the repo's existing keyword
  (`Closes` vs `Fixes` vs `Refs`)?
- Did I avoid running `git commit` myself when the user only asked
  for the message?
