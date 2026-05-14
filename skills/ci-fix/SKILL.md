---
name: ci-fix
title: CI Fix
description: Diagnoses and fixes CI pipeline failures.
category: ci
tags:
  - ci
  - github-actions
  - build
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# CI Fix

A PR's checks are red. Find the actual failure (not the noise around
it), figure out whether the bug is in the code, the test, or the
environment, and fix it at the right layer.

## Use this skill when

- The user pastes a CI failure log and asks what is wrong.
- The user says "my PR's checks are red" or "the build broke after
  rebase" and wants to know why.
- The user has a flaky test that fails in CI but not locally.
- The user wants to fix a recurring CI issue once and for all.

## Do NOT use this skill when

- The user wants to design a new CI pipeline from scratch. Out of
  scope for the MVP.
- The CI is red because the application code is genuinely broken
  and the failure mode is interesting. Use `debugging`; come back
  here once the root cause is in hand.
- The user wants to "skip the failing test to unblock the merge".
  Push back — that is technical debt with a CVSS score.

## Procedure

1. Read the actual failure line. CI logs are mostly noise — banners,
   setup output, retries. Search for `Error`, `FAIL`, `exit code`,
   the test runner's failure prefix, or the build tool's failure
   prefix. The first failure is usually the one that caused all
   the others.
2. Classify the failure:
   - **Build** — compilation, type, lint, packaging.
   - **Test** — unit, integration, e2e, snapshot, smoke.
   - **Lint / format** — style enforcement.
   - **Deploy** — auth, infra, environment promotion.
   - **Infra** — runner OOM, disk full, network flake, container
     pull rate limit.
   The category determines who is responsible for the fix.
3. Reproduce locally. Run the exact failing command from the
   workflow file with the same arguments and (where possible) the
   same Node/Bun/Python version. A reproducible local failure is
   90% of the fix; "works on my machine" without checking the
   versions is a smell.
4. Check for environment differences when local doesn't reproduce:
   - Runner OS (Ubuntu version, macOS arch).
   - Toolchain version pin (Node 20 vs 22, Bun 1.1 vs 1.3).
   - Environment variables present in CI but not locally (or vice
     versa).
   - File system case sensitivity (Linux yes, macOS often no,
     Windows no).
   - Locale (`LANG`, `LC_ALL`) — date formats, sort order.
   - Parallelism / concurrency settings (CI often runs serially or
     with fewer cores; tests built for parallel runs may pass at
     low concurrency).
   - Time zone (CI is usually UTC).
5. Fix the root cause, not the symptom. Anti-patterns to avoid:
   - Pinning a dependency to dodge a real bug.
   - Retrying a failing test until it passes (`if: failure()`-style
     reruns).
   - Adding `continue-on-error: true` to make the job green.
   - Marking a real failure as a "known flake" without an issue
     filed.
   - Disabling a check on `main` because it is annoying on PRs.
   Each of these makes the next failure harder to find.
6. Verify the fix in a fresh CI run. Don't ship the fix and walk
   away — a green checkmark on the same commit that was failing is
   the proof.
7. If the failure was caused by a flaky test, write a comment near
   the test (and ideally an issue) describing the symptom, the
   intermittent root cause, and what would make the test
   deterministic.
8. When the CI config itself is at fault (wrong runner, missing
   secret, broken matrix), edit the workflow file in the same PR
   as the fix and call it out in the PR description. A "fix CI"
   commit on `main` without explanation is a tax on every future
   debugger.
9. Watch out for caches. A green CI run on a cached build can hide
   a real failure that a fresh checkout would surface. If a fix
   seems to "just work", bust the cache and re-run before
   trusting it.
10. Distinguish *new* failures from *pre-existing red `main`*. If
    `main` is already red, the PR may be inheriting the failure.
    Fix `main` first, then rebase the PR; mixing the two makes
    review impossible.

## Examples

In scope: "Tests pass locally but fail in CI with `Cannot find module './foo'`."

→ Case-sensitivity mismatch. The file is `Foo.ts`, the import is
`./foo`. Linux is case-sensitive, macOS usually isn't. Fix the
import (or rename the file) to match exactly, and add a lint to
catch the next one.

In scope: "Snapshot test fails in CI on every PR."

→ Read the diff. If the new snapshot is correct, update it and
commit the snapshot file alongside the change. If the snapshot
varies between machines (locale, time zone, asset hash), either
strip the variance from the snapshot or replace the snapshot
test with a behavioral assertion.

In scope: "Build OOMs on the GitHub runner."

→ A standard runner has limited RAM. Reduce parallelism, split
the build, or move to a larger runner. Don't `--max-old-space-size`
your way out of an actual memory leak in the build.

In scope: "Lockfile drift — `bun install --frozen-lockfile` fails."

→ Someone updated a dependency without updating the lockfile, or
the lockfile was edited by a different tool. Reinstall locally,
commit the regenerated lockfile, and consider adding a CI step
that fails on lockfile drift before running anything else.

Out of scope: "The deploy is failing because the prod database is
down."

→ This is an incident, not a CI fix. Page someone.

Out of scope: "Make the build twice as fast."

→ Speed work without a failure is a refactor — use `refactor-plan`
or measure first.

## Self-check before responding

- Did I find the actual failure line, not just the noisiest red
  output?
- Did I classify the failure (build / test / lint / deploy / infra)?
- Did I reproduce locally with the same toolchain versions?
- Did I check environment differences when local couldn't
  reproduce?
- Did I propose a root-cause fix instead of a retry, skip, or
  `continue-on-error`?
- Did I verify the fix in a fresh CI run before declaring done?
- For flakes, did I leave breadcrumbs (comment + issue) so the
  next person isn't starting from zero?
