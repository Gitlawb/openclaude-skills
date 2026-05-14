---
name: refactor-plan
title: Refactor Plan
description: Plans multi-file refactors with clear steps and risk assessment.
category: refactor
tags:
  - refactor
  - architecture
  - planning
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Refactor Plan

Produce a plan for a multi-file refactor. The output is a sequence of
small, reversible steps with explicit risks, test impact, and a
staging strategy — not the refactor itself.

## Use this skill when

- The user wants to restructure code across multiple files or
  modules.
- The user wants to extract a module, rename a concept across the
  codebase, or migrate from pattern A to pattern B.
- The user asks "how should I refactor X" or "what's the right way
  to break up Y".
- The user wants to assess the risk and scope of a refactor before
  committing to it.

## Do NOT use this skill when

- The user wants a small in-file cleanup. Just do it; a plan is
  overkill.
- The user is fixing a runtime bug. Use `debugging`. Bundling a
  refactor into a bugfix is its own anti-pattern.
- The user wants to write the refactored code now. After this skill
  produces the plan, hand off to a coding skill or to the user.
- The user is restructuring code they don't fully understand yet.
  Read the current code first; a plan built on guesses is worse
  than no plan.

## Procedure

1. Understand the current shape. Read the affected files end-to-end,
   not just the targets named in the request. Map: what calls what,
   what mutates what, what is public API, what is internal.
2. State the target shape explicitly. "Move the validation logic
   into `src/validate/` so handlers don't import from `lib/db`."
   Vague targets ("clean up the structure") produce vague plans.
3. Identify the smallest reversible steps that move from current to
   target. A good step:
   - Compiles and passes tests on its own.
   - Can be reverted with a single `git revert`.
   - Has a one-sentence rationale.
   Prefer many small steps to a few large ones. The cost of one
   extra commit is much smaller than the cost of an unrevertable
   commit gone wrong.
4. Flag breaking changes explicitly. Note any change to:
   - Public API (exported functions, HTTP routes, message schemas).
   - Database schema (columns, indexes, constraints).
   - File formats or config keys.
   - Side effects observable from outside the system (events,
     logs, metrics names).
   For each, decide whether to ship a compatibility layer, a feature
   flag, or a hard cut.
5. Flag what tests will need updating. A step that requires changing
   30 tests is a warning sign — usually the tests are coupled to
   implementation, or the step is doing too much at once.
6. Propose a staging strategy:
   - **Single PR** — small refactors, no behavior changes, one
     reviewer can hold the whole change in their head.
   - **Branch series** — larger refactors with a base branch and
     stacked PRs. Each PR is a step from above.
   - **Long-lived flag** — when the refactor needs to ship behind a
     toggle for safe rollback.
   - **Parallel implementations** — when the new shape needs to
     coexist with the old (e.g., two readers, one writer) until
     callers migrate.
7. Estimate risk per step. A step that touches a hot path needs
   metrics watched after deploy. A step that changes a query needs
   an EXPLAIN. A step that touches concurrency needs more thinking
   than testing alone gives you.
8. Order the steps so each one strictly improves the situation. A
   plan that requires you to be halfway through to compile is a
   plan that will rot when interrupted.
9. Name a stopping point. Refactors balloon — when the first three
   steps land, the plan should be done or the remaining steps
   should still each pay for themselves on their own. If you can
   only justify steps 4–7 because of step 8, the plan is too long.
10. Decide what does NOT move. List code that looks related but
    that the refactor is intentionally leaving alone, and explain
    why. Future readers (and future-you) will read the diff
    wondering whether you forgot.

## Examples

In scope: "We want to extract our notification logic out of the
order service."

→ Read `order-service/`. Note that notifications are called from
four handlers and use the same DB connection. Plan:
1. Add a `notifications` package with the same interface, still
   calling into the existing implementation.
2. Route one handler through the new package; verify behavior.
3. Route the other three handlers, one PR each.
4. Move the implementation into the package; delete the old.
5. Decouple the DB connection; switch to its own pool.

Each step is independently mergeable, revertable, and testable.

In scope: "Should we rewrite this in Go?"

→ Almost always no — at least not as a "rewrite". Propose a
strangler-fig plan: extract a seam, reimplement one path at a
time behind it, retire the original gradually. Provide the seam
and the first path; full rewrites should be a sequence of
plans, not one.

In scope: "We have circular imports between auth and users."

→ Don't refactor in place — extract a third module that both can
depend on. Plan:
1. Create `entities/` with the pure types both modules need.
2. Move shared types into `entities/`, update imports.
3. Remove the auth→users edge by injecting the dependency.
4. Add an import-cycle lint to keep the win.

Out of scope: "Write the refactored code."

→ This skill plans. Hand off to a coding skill or to the user.

Out of scope: "Rename this variable."

→ Editor refactor — no plan needed.

## Self-check before responding

- Is the target shape stated precisely, not as "cleaner"?
- Is each step independently revertable?
- Did I flag every breaking change to public API, schema, or
  observable behavior?
- Did I name the staging strategy (single PR / branch series /
  flag / parallel)?
- Did I avoid bundling a refactor with a bugfix or a feature?
- Did I order steps so each one improves the codebase, not just
  the final one?
- Did I assess risk per step instead of giving the whole plan one
  generic "should be safe"?
- Did I resist proposing a rewrite when a strangler-fig plan would
  serve better?
