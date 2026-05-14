---
name: loop-task-author
title: Loop Task Author
description: Writes .openclaude/loop.md files for openclaude's scheduled maintenance loop.
category: provider
tags:
  - openclaude
  - cron
  - automation
  - scheduled-tasks
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Loop Task Author

The user wants openclaude to keep running on a schedule, picking up
where the conversation left off or doing background work. Pick the
right `/loop` mode for what they want, write the `loop.md` that drives
it, and put it where openclaude will find it.

## Use this skill when

- The user wants openclaude to run unattended on a schedule.
- The user mentions `/loop` and wants help writing the maintenance
  prompt that drives it.
- The user wants a "background agent" that tends a repo — PR review,
  CI watching, dependency upgrades, bug hunting.
- The user asks "how do I make openclaude run every hour
  automatically?".

## Do NOT use this skill when

- The user wants a single scheduled fire-once task. openclaude has
  `/cron` commands for that — `/loop` is for repeating maintenance.
- The user wants an interactive subagent spawned during a session.
  Use `subagent-design`.
- The user wants webhook-driven triggers (act on GitHub events,
  Slack messages, etc.). That's a hook-chain authoring problem,
  out of scope for this skill.

## Procedure

1. **Confirm `/loop` is enabled.** It ships as a bundled skill in
   openclaude. Check by running `/skills` in a session and looking
   for "loop" in the list. If absent, enable it before continuing.
2. **Pick the loop mode.** openclaude supports four:
   - **dynamic-maintenance** — openclaude decides what to do next
     based on conversation state and the project's `loop.md`.
     Delay is dynamic, between 1 minute and 1 hour. Default for
     most users.
   - **dynamic-prompt** — dynamic delay, but the user supplies the
     prompt rather than relying on `loop.md`.
   - **fixed-maintenance** — fixed interval, uses the default
     maintenance behaviour plus `loop.md`.
   - **fixed-prompt** — fixed interval, the user's prompt fires
     every cycle.
   Default to dynamic-maintenance with a project `loop.md` unless
   the user has a reason to lock the interval.
3. **Write the loop file** at `.openclaude/loop.md` (project-scoped
   — checked into the repo) or `~/.openclaude/loop.md` (user-global
   fallback). Keep it short and imperative; it's read on every
   iteration. The standard shape:

   ```
   # Loop instructions

   ## Continuing work
   - Continue unfinished items from the current conversation.
   - Tend to the active branch's PR: review comments, failing CI,
     conflicts.

   ## Background passes (when nothing else is pending)
   - <project-specific task A — e.g. "run typecheck and fix easy errors">
   - <project-specific task B — e.g. "scan for TODO comments older than 7 days">
   - <project-specific task C — e.g. "look for tests that have skipped or xfailed for > 30 days">

   ## Guardrails
   - Do NOT push to main.
   - Do NOT delete branches or force-push.
   - Do NOT modify CI configs without explicit authorization in
     the conversation.
   - For irreversible actions, require evidence that the
     conversation already authorized them.
   ```

4. **Lean on known loop.md patterns** when the user's intent
   matches one of them:
   - **PR-watch loop** — review PRs assigned to the user, run
     their tests locally, comment on failures.
   - **CI-fix loop** — when CI fails on a PR the user opened,
     diagnose and push a fix (gated by the guardrails).
   - **Dependency-upgrade loop** — weekly `npm outdated` (or
     equivalent), open PRs for safe upgrades.
   - **Bughunter loop** — cycle through directories looking for
     low-hanging bugs and open issues with reproductions.
5. **Start the loop with the right invocation:**
   - `/loop` — dynamic-maintenance using `.openclaude/loop.md`.
   - `/loop 30m` — fixed 30-minute interval (still uses
     `loop.md`).
   - `/loop "review my open PRs" every 2h` — fixed-prompt; the
     loop file is bypassed in favour of the inline prompt.
6. **Tell the user how to stop it.** Long-running loops should be
   easy to interrupt — name the off-switch (the relevant slash
   command or signal) in the same message that starts the loop.

## Examples

In scope: "Write me a loop.md that watches CI on my open PRs and
fixes failures."

→ Mode: dynamic-maintenance. Background passes: list PRs with
`gh pr list --author @me --json number,statusCheckRollup`, pick
ones with red checks, run failing jobs locally to reproduce, push
a fix to the PR branch. Guardrails: no force push, no
`--no-verify`, no edits to `.github/workflows/` without explicit
ack from the user.

In scope: "I want openclaude to do a bughunt pass on quiet days."

→ Mode: dynamic-maintenance. Background passes: rotate through
`src/<dirs>` by least-recently-visited (track via a state file),
read the code, write a one-paragraph issue when finding something
real, *do not* open the issue without a confirmation step.

Out of scope: "Trigger this once at 9 am tomorrow."

→ Single fire-once schedule. Use openclaude's `/cron` commands
inside a session; `/loop` is the wrong tool.

## Self-check before responding

- Did I pick the loop mode (dynamic vs fixed; maintenance vs
  prompt) deliberately for the user's goal?
- Did I include a **Guardrails** section with at least three
  "do nots"?
- Are the background-pass items concrete and project-specific,
  not generic ("clean things up")?
- Did I cite the exact `/loop` invocation the user should run?
- Did I name the off-switch in the same message?
- Did I keep irreversible actions (force push, branch delete,
  prod deploy) out of the loop's default behaviour?
