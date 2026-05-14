---
name: debugging
title: Debugging
description: Helps diagnose and fix runtime errors, crashes, and unexpected behavior.
category: debugging
tags:
  - debugging
  - troubleshooting
  - errors
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Debugging

Find the root cause of a runtime failure and fix it at the right layer.
Beat the urge to patch the symptom — a fix that hides the bug is worse
than no fix.

## Use this skill when

- The user has an error message, stack trace, or panic and wants to
  know what is wrong.
- The user describes broken behavior ("X used to work and now it
  doesn't", "this is sometimes wrong", "the page renders but the
  number is off").
- The user pastes log output and asks why the system is misbehaving.
- The user has a crash, hang, or out-of-memory in production and
  wants to find the cause.

## Do NOT use this skill when

- The user wants to build a new feature. Use a coding skill. Bugs
  found during feature work are still part of the feature work.
- The user wants performance work without an actual functional bug.
  Use `refactor-plan` for restructuring or a dedicated perf approach.
- The user wants tests written for code that already works. Use
  `test-writer`.

## Procedure

1. Reproduce the issue, or get as close as you can. A bug you cannot
   reproduce is a bug you cannot verify a fix for. Ask the user for:
   the exact command/request, the input, the environment (OS, runtime
   version, env vars), and the last known good state.
2. Read the actual error. The most useful information is usually the
   bottom of the stack trace (the user-code frame nearest the failure),
   not the top. Note the exception type, the message, the file and
   line, and any "caused by" chain.
3. Narrow scope. Bisect by:
   - **Time**: `git log` between known-good and known-bad. Reach for
     `git bisect` when the regression window is wide.
   - **Code path**: comment out or short-circuit branches until the
     failing call disappears. The smallest reproducing input wins.
   - **Data**: which inputs fail? Strip fields until the failing
     subset is minimal.
4. Form a hypothesis. State it explicitly: "I think X is null because
   Y returns undefined on empty arrays." A vague hypothesis ("maybe
   it's a race condition") wastes time — make it falsifiable.
5. Test the hypothesis with the smallest possible change. A `console.log`,
   a debugger breakpoint, a unit test that calls the suspect function
   with the suspect input. If the hypothesis is wrong, the test should
   tell you cleanly, not just "still broken".
6. Fix at the right layer. Ask: where did the invariant first break?
   That is the layer to fix. Common anti-patterns to avoid:
   - **Symptom patching**: catching an exception three layers above
     where it was thrown to keep the UI green.
   - **Defensive bloat**: adding null checks everywhere instead of
     fixing the function that returned null.
   - **Magic retries**: retrying a request whose failure mode you
     have not diagnosed.
   - **Silent fallback**: replacing an unexpected value with a default
     so the error stops surfacing.
7. Verify the fix. Reproduce the original failure with the fix in
   place and confirm the failure no longer occurs. If you wrote a
   test as part of the diagnosis (step 5), keep it — that test is
   the regression guard.
8. Note what you learned in the PR description or commit message:
   what was broken, the root cause, and why the fix lives where it
   does. Future readers debug similar bugs faster when the history
   is annotated.
9. If the bug is intermittent or environment-dependent, document the
   reproduction steps including the seed/timing/concurrency that
   triggered it. "Couldn't reproduce" is not a fix — it is a finding
   to escalate or instrument.
10. When the diagnosis is uncertain, prefer instrumentation
    (structured logs at boundaries, metrics around the suspect path)
    over speculative refactors. You can always remove the
    instrumentation; you cannot un-ship a guess.

## Examples

In scope: "TypeError: Cannot read property 'id' of undefined at user.ts:42."

→ Open `user.ts:42`. Trace where the `undefined` originates by walking
the call chain backward. If `getUser()` returns `undefined` on a missing
ID, the bug is `getUser()` returning `undefined` instead of throwing or
returning a typed `null`, not the caller failing to handle it.

In scope: "Sometimes this test fails in CI but never locally."

→ Treat as a flake until proven otherwise. Look for: time-of-day
dependence, shared mutable state across tests, race conditions on
fixtures, clock-dependent assertions. Run the test in a tight loop
locally with the CI's parallelism settings before declaring it
"works on my machine".

In scope: "Memory keeps climbing in production."

→ Ask for the metric (RSS? heap?), the rate, and the deploy that
preceded it. Look for unbounded caches, listeners that get attached
on every request, or array fields that accumulate. A heap snapshot
diff at two points usually identifies the leaking type within
minutes.

In scope: "Why is the response sometimes empty?"

→ "Sometimes" implies a non-deterministic input. Inventory the
sources of non-determinism: time, randomness, ordering of async
operations, cache state, retry behavior, partial data from an
upstream service. Add a structured log at the boundary where the
response is built and re-run until a successful and an empty
response sit side by side.

Out of scope: "Make this faster."

→ A performance ask without a functional bug is not a debugging
task. Use `refactor-plan` or measure first.

Out of scope: "Refactor this module while you're in there."

→ Refactors and bugfixes are separate PRs. A refactor inside a
bugfix makes the fix hard to verify and hard to revert.

## Self-check before responding

- Did I read the actual error, including the file:line at the bottom
  of the trace?
- Did I state a falsifiable hypothesis before proposing a fix?
- Did I verify the fix reproduces the original failure first, then
  not after the fix?
- Did I fix the root cause, not a symptom three layers up?
- Did I avoid adding silent fallbacks, retries, or broad try/catches
  to make the error disappear?
- Did I propose or write a regression test where it is cheap to do
  so?
- Did I note what changed and why in a place future debuggers will
  find it?
- For intermittent failures, did I check shared state, time, and
  ordering before concluding "flake"?
