---
name: test-writer
title: Test Writer
description: Writes unit, integration, and end-to-end tests for existing or new code.
category: testing
tags:
  - testing
  - tdd
  - coverage
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Test Writer

Add tests that catch real regressions. Coverage is a tool, not a goal —
a test that only exercises the happy path with the same data the
implementation was written against catches nothing.

## Use this skill when

- The user asks to write tests for an existing function, class, or
  module.
- The user wants to add coverage for a feature or bug fix.
- The user describes a behavior they want pinned down so it does
  not regress.
- The user is writing new code TDD-style and wants the tests first.

## Do NOT use this skill when

- The user is debugging a known failure. Use `debugging` — once the
  root cause is clear, come back here to write the regression test.
- The user has not yet implemented the behavior and the design is
  unsettled. Use a coding skill to pin the design first.
- The user wants tests for code they are about to delete.

## Procedure

1. Identify the unit under test. Be explicit: "the `parseDate`
   function in `src/date.ts`", "the `/users/:id` GET handler", "the
   checkout flow from add-to-cart to receipt". Vague targets produce
   vague tests.
2. Pick the right test type:
   - **Unit**: pure function, single class, mockable boundary.
     Fastest to run, cheapest to maintain. Default to unit tests
     when the logic is mostly in-process.
   - **Integration**: code that crosses a boundary you cannot
     reasonably mock (database, queue, file system). Use a real
     dependency in a controlled environment (testcontainers,
     in-memory SQLite if the queries match).
   - **End-to-end**: whole-system behaviors the user sees (full HTTP
     request, full UI click path). Expensive — reserve for the
     handful of flows that earn the cost.
   Each level has a place. Pushing logic into unit-testable
   functions is usually a better answer than writing more e2e tests.
3. Enumerate cases before writing assertions. For each behavior list:
   - **Happy path** — typical input, typical output.
   - **Boundaries** — empty, single, max, just-over-max.
   - **Edge cases** — null, undefined, negative numbers, unicode,
     duplicates, ordering, concurrency.
   - **Error paths** — invalid input, dependency failures, timeouts.
   - **Idempotency / side effects** — does running twice change the
     result? Should it?
4. Write tests that test the contract, not the implementation. Assert
   on observable behavior (return values, emitted events, written
   rows) — not on which internal method was called. Tests that
   over-specify implementation break on every refactor and teach
   future readers nothing.
5. Pick fixtures and factories deliberately. Prefer minimal,
   purpose-built fixtures over shared "kitchen sink" objects. A test
   that fails for unclear reasons usually started with a fixture that
   carries more state than the test needs.
6. Choose assertions that fail descriptively. `expect(result).toEqual(expected)`
   beats `expect(result.length > 0).toBe(true)` — when the second one
   fails, you learn nothing. Reach for snapshot tests sparingly:
   they catch unexpected changes but make intentional changes noisy.
7. Run the test in two states to prove it actually checks something:
   first with the implementation broken (assert the test fails),
   then with the implementation correct (assert the test passes). A
   test that passes against both implementations is decorative.
8. Keep test runtime in mind. A suite that takes 20 minutes to run
   gets skipped. Move slow setup behind `beforeAll`, parallelize
   what is parallel-safe, prefer in-memory fakes for unit-level
   tests of code that talks to a slow boundary.
9. Be deliberate about what to mock. Mock external services you do
   not own; do not mock the code under test or its immediate
   collaborators if you can use the real thing cheaply. Over-mocked
   tests pass without exercising any real code path.
10. For each test, write a name that describes the behavior, not the
    function. `parses an ISO date in UTC` reads better than
    `test_parseDate_1`. The test runner output becomes a readable
    spec of the system.
11. Group related tests with `describe` blocks that name the unit
    under test. Avoid deeply nested `describe` trees — they look
    organized but make failures hard to locate.

## Examples

In scope: "Add unit tests for `parseDate` in `src/date.ts`."

→ Read `parseDate`. Enumerate inputs: valid ISO string, valid local
date, empty string, malformed string, dates at DST boundaries,
leap year, year 0, future year. Write one assertion per case.
Include a "round trip" test: `format(parseDate(s)) === s` for the
canonical formats.

In scope: "Pin down the behavior of the checkout flow."

→ This is integration- or e2e-shaped. Write an integration test
that posts a cart, applies a coupon, posts payment, and asserts
that an order row exists, an email was queued, and the cart was
cleared. Skip the UI rendering details — those belong in a
separate UI test.

Out of scope: "Why is this test flaky?"

→ Flakes are a debugging task. Use `debugging` to diagnose; once
the cause is clear, come back here to harden the test (or delete
it if the test was wrong).

In scope: "We just fixed a bug — add a regression test."

→ The diagnosis already produced the smallest input that reproduces.
Write a test that pins exactly that input and assertion. Name it
after the bug ("`returns 400 when the limit is negative`"), and
keep the scope tight so the test does not break for unrelated
reasons.

Out of scope: "Write tests for code I'm about to delete."

→ Don't.

Out of scope: "Generate 100% coverage for this module."

→ Coverage targets without behavior targets produce
implementation-coupled tests. Ask which behaviors are
load-bearing, write tests for those, and let coverage land where
it does.

## Self-check before responding

- Is the unit under test stated precisely?
- Did I pick the smallest test type that meaningfully exercises
  the behavior?
- Did I enumerate happy-path, boundary, edge-case, and error-path
  cases before writing assertions?
- Do the assertions describe observable behavior, not internal
  implementation details?
- Did I confirm the test fails when the implementation is broken?
- Are fixtures minimal and purpose-built, not shared kitchen-sink
  objects?
- Will the test still pass on a refactor that preserves behavior?
- Will the test fail descriptively, so a future reader can diagnose
  from the failure message alone?
- Is the total runtime cost worth the regression protection?
