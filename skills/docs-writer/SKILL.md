---
name: docs-writer
title: Docs Writer
description: Writes or updates documentation that matches the project's voice and structure.
category: docs
tags:
  - documentation
  - readme
  - technical-writing
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Docs Writer

Read the file you're documenting and the docs already in the project,
then write a page that sounds like the rest of the project and that a
reader can scan. The most common docs failure is generic prose ("fast,
easy, robust") that the same author could have written without
opening the code.

## Use this skill when

- The user asks to write or update a README, API reference, guide,
  or doc page.
- The user asks to document a specific function, module, package,
  or system.
- The user shipped a feature and asks for the doc page that goes
  with it.
- The user says "these docs are out of date" or "rewrite this doc
  to match the current code".

## Do NOT use this skill when

- The user wants release notes from many merged PRs. Use
  `release-maintainer`.
- The user wants a PR description. Use `pr-description-writer`.
- The user wants inline source comments. Use a coding skill —
  comments live next to the code, with a different audience.
- The user wants marketing copy. Out of scope; this skill is for
  technical documentation.

## Procedure

1. **Read the existing docs to learn the voice.** Don't write before
   reading:
   - The top-level `README.md`.
   - `docs/` directory if present (`ls docs/`, read the index).
   - `CONTRIBUTING.md` and `AGENTS.md` / `CLAUDE.md` for
     conventions.
   - 2–3 sibling doc files near the target if you're adding to an
     existing tree.
   Take notes on: formal vs casual tone, first/second/third
   person, US vs UK English, headline capitalization, whether
   examples come before or after explanation.

2. **Identify the audience for *this* doc.** Different audiences
   need different depth:
   - **End user / installer** — what it does, how to install, how
     to use the common operations. Minimal API depth.
   - **Integrator / SDK caller** — public API, types, error
     conditions, examples that compile.
   - **Contributor / code extender** — architecture, where things
     live, how to add a feature, how to run tests.
   - **Operator / deployer** — runtime config, environment
     variables, observability, runbooks.
   If you're not sure, ask the user one question and stop there.

3. **Read the actual code you're documenting.** Open the file or
   module. Note the real exported names, parameter shapes, default
   values, and error returns. Documentation that misnames a
   function or claims a missing parameter is worse than no
   documentation.

4. **Structure for scanning, not for reading top to bottom.**
   - One `H1` at the top — the name of the thing.
   - `H2` sections matching the questions readers actually ask
     (Install / Usage / Configuration / API / Limits / FAQ).
   - Code examples that copy-paste and run as-is — including the
     imports.
   - Concrete numbers: "completes in under 50ms at p99 on a
     10k-row table", not "fast". "Holds up to 1 MB before
     spilling to disk", not "memory-efficient".
   - Tables for parameter lists and config options.

5. **Match the project's voice precisely.**
   - Same tone register (a casual repo with `we'll handle that for
     you` shouldn't have new docs that read like Oracle's manual).
   - Same English variant — check `colour` vs `color`, `behaviour`
     vs `behavior` in the existing docs and match.
   - Same person — if existing docs use "you", don't switch to
     "the user".

6. **Verify accuracy before claiming done.** Every code example
   must run with the current code (or at minimum, trace each line
   to a real function); every command must work in a scratch
   shell; every API signature must match HEAD; every link must
   resolve. Run `grep -E "\\]\\(http" <file>` to enumerate the
   links and check each.

7. **For drift cases** ("this doc is wrong now"), produce a diff
   rather than a rewrite: list the claims that no longer match
   the code, pair each with the current truth, and propose the
   minimum edit. A wholesale rewrite loses the parts that still
   work.

## Examples

In scope: "write a README for the `src/retry/` module."

→ Read `src/retry/index.ts` for the exported surface. Read the
top-level README and notice the project uses second person,
Problem/Solution framing, and US English. Read a sibling module's
README to learn section order. Produce a one-`H1` page with
`Install` / `Usage` / `Limits` sections, a usage example that
imports `withRetry` (verified to be a real export), and concrete
numbers in Limits ("maximum 10 attempts; backoff cap 30s")
rather than "configurable retry behaviour".

In scope: "this doc is out of date, fix it."

→ Diff the doc against current code. Find: a `enableCache: true`
config option the doc still describes that was removed two
months ago, and an `onRetry` callback the code now exports that
the doc never mentioned. Produce the minimum edit: delete the
removed option's section, add a small section for the new
callback. Don't rewrite working sections.

Out of scope: "explain this code in comments."

→ Inline source comments live next to the code, with a different
audience and style. Use a coding skill.

## Self-check before responding

- Did I read at least the README and one sibling doc before
  writing?
- Did I identify a specific audience (end user / integrator /
  contributor / operator) for this doc?
- Did I open the actual source file and use real exported names?
- Did I match the project's tone, person, and English variant?
- Are my numbers concrete ("under 50ms p99"), or did I default
  to "fast" / "easy" / "robust"?
- Will the code examples copy-paste and run as-is, imports
  included?
- For drift fixes: did I produce a minimum diff instead of a
  rewrite that throws away working sections?
