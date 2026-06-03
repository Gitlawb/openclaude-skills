---
name: doc-writer
title: Doc Writer
description: Writes and improves README files, API docs, changelogs, and other repository documentation.
category: docs
tags:
  - docs
  - readme
  - api-docs
  - changelog
trust: community
version: 0.1.0
license: MIT
tools_required:
  - Read
  - Bash
min_openclaude_version: 0.10.0
---

# Doc Writer

Write documentation that matches the codebase it describes. Good docs do
not just sound polished: they name the right commands, reflect the real
behavior, and help the next reader succeed without guessing.

## Use this skill when

- The user asks to write or improve docs for a project, feature, or API.
- The user wants a README, usage guide, onboarding note, or contributing
  document written from existing code or notes.
- The user asks to explain existing code in documentation form.
- The user needs changelog or release-note text aligned with recent code
  changes.
- The user wants a docs cleanup pass for clarity, structure, or
  consistency across markdown files.

## Do NOT use this skill when

- The user wants to change the code itself. Use an implementation skill;
  this skill documents existing behavior, it does not build the feature.
- The user wants a pull-request review or risk assessment. Use
  `pr-review`.
- The user wants to debug a broken system or fix a failing command. Use
  `debugging` or `ci-fix` first, then document the outcome after the
  behavior is known.
- The user wants tests written for the code. Use `test-writer`.

## Procedure

1. Identify the documentation artifact. Be explicit about what you are
   writing: `README.md`, API reference, changelog entry, migration guide,
   or onboarding notes. The artifact decides the tone, depth, and layout.
2. Read the source of truth before drafting anything. Open the relevant
   code, config, existing docs, package manifests, scripts, and tests.
   Documentation that is not checked against the repo is marketing copy,
   not engineering documentation.
3. Confirm the audience and task. Ask: who will read this, and what are
   they trying to do? A first-time contributor needs setup steps and
   troubleshooting hints; an API consumer needs inputs, outputs, and error
   cases; a changelog reader needs the user-visible change and any upgrade
   action.
4. Outline the sections before writing. Prefer a structure the reader can
   scan quickly:
   - README: what it is, how to install, how to run, how to test, common
     commands.
   - API docs: endpoint or function name, parameters, return shape,
     failures, examples.
   - Changelog: changed, why it matters, any migration or breaking-change
     note.
   - Contributing or onboarding docs: prerequisites, setup, validation,
     local workflow.
5. Write from verified facts only. If a command, path, env var, version,
   or feature flag is not confirmed in the repo, do not invent it. Either
   omit it, mark it as needing confirmation, or go find the actual source.
6. Prefer concrete examples over abstract prose. Show the command, request
   shape, file path, or workflow the reader will actually use. A short,
   correct example is worth more than a paragraph of vague explanation.
7. Keep the docs aligned with reality at the edges, not just the happy
   path. Include prerequisites, limits, failure modes, and any breaking
   changes the reader must know before they copy a command into a shell.
8. Match the project's existing documentation voice and structure. If the
   repo uses short imperative steps, keep that pattern. If headings,
   command examples, or terminology are inconsistent across files, pick a
   consistent version and normalize toward it.
9. When documenting a code change, diff the old and new behavior before
   writing. Name what changed, who it affects, and whether users need to
   take action. Release notes that say "misc fixes" are nearly useless.
10. Verify every example you can. If the repo provides commands like
    install, build, test, lint, or run, compare your wording against the
    actual scripts and docs. If you cannot verify something, say so rather
    than implying certainty.
11. Finish with a reader pass. Remove duplicated headings, undefined
    jargon, stale references to old file names, and instructions that
    assume too much context. The final output should help a tired teammate
    at the end of the day, not just an expert who already knows the code.

## Examples

In scope: "Rewrite our README so a new contributor can get the app
running."

-> Read the existing README, package manifest, scripts, env docs, and any
setup notes. Verify the install, dev, test, and build commands from the
repo. Rewrite the README around the real onboarding flow, add the missing
prerequisites, and remove instructions that no longer match the current
tooling.

In scope: "Document this `/users/search` endpoint."

-> Read the handler, validation layer, response types, and tests. Document
the route, parameters, example request, example response, and the error
cases that are actually implemented. If pagination exists in code, include
it. If auth is required, say so explicitly.

In scope: "Write release notes for this feature branch."

-> Read the diff and any issue or PR context. Group the notes by
user-visible change, call out breaking changes, and mention any required
upgrade or migration step. Do not pad the notes with internal refactors
that users will never notice.

Out of scope: "Fix the API and update the docs."

-> Split the work. Use an implementation or debugging skill to fix the API
first, then come back to `doc-writer` once the behavior is settled.

Out of scope: "Review this PR for correctness."

-> Use `pr-review`. A documentation summary is not a substitute for a code
review.

## Self-check before responding

- Did I identify the exact documentation artifact I was writing?
- Did I read the code, config, or existing docs that act as the source of
  truth?
- Did I avoid inventing commands, env vars, paths, or behavior I did not
  verify?
- Did I write for the intended audience rather than for myself?
- Did I include concrete examples where they help more than prose?
- Did I document prerequisites, edge cases, or breaking changes where they
  matter?
- If this was tied to a code change, did I describe the actual behavioral
  delta rather than restating commit noise?
- Did I match the repo's existing terminology and structure closely enough
  that the new docs feel native to the project?
