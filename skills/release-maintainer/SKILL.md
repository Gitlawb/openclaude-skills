---
name: release-maintainer
title: Release Maintainer
description: Prepares releases — version bumps, changelogs, release notes.
category: release
tags:
  - release
  - changelog
  - versioning
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Release Maintainer

Cut a release. Pick the right semver bump from the actual changes,
write release notes that tell a user what to do, and produce the
tag + push commands ready to run.

## Use this skill when

- The user wants to cut a release and is unsure what version to
  bump to.
- The user wants a changelog generated from merged PRs since the
  last tag.
- The user wants release notes drafted for a tag that already
  exists.
- The user wants help picking the right semver bump for a known
  set of changes.

## Do NOT use this skill when

- The user wants to make the code changes that go into the
  release. Use coding skills. Releases ship existing work; they
  do not produce new work.
- The release pipeline itself is broken. Use `ci-fix`.
- The user wants help designing a release process from scratch.
  Out of scope; produce one release first, then formalize.

## Procedure

1. Find the last tag (`git describe --tags --abbrev=0`) and list
   the commits since it (`git log <last-tag>..HEAD --oneline`). If
   the project uses merge commits, list merged PRs via
   `gh pr list --state merged --search "merged:>=<date>"`.
2. Group the changes by type:
   - **Breaking** — anything that changes a public contract: API
     shape, exported types, CLI flags, config keys, file formats,
     observable side effects.
   - **Features** — new behavior, additive, not breaking.
   - **Fixes** — bug fixes, no new behavior.
   - **Internal** — refactors, tests, tooling, docs. Usually
     omitted from user-facing notes.
3. Pick the semver bump from what is in the list:
   - Any breaking change → **major** (or **minor** during `0.x`,
     where the leading 0 signals instability).
   - Otherwise any feature → **minor**.
   - Otherwise → **patch**.
   Do not let release pressure pick a smaller bump than the
   changes deserve. Semver promises in writing.
4. Write release notes. Two audiences:
   - **End users / SDK callers** — what changed for them. Lead
     with breaking changes and migration steps. Each entry
     should answer "what do I do about it?" in one sentence.
   - **Contributors** — what changed in the repo. Internal
     refactors and tooling go here.
   Use the project's existing style (Keep a Changelog, conventional
   commits, plain markdown). Don't invent a new style for one
   release.
5. Update `CHANGELOG.md` if the project has one. Insert the new
   section at the top with the version and date; do not edit
   prior sections except to fix outright errors.
6. Produce the tag and push commands. Don't push the tag in this
   skill — leave that to the user so they can review the diff
   first. Example output:
   ```
   git tag v1.4.0
   git push origin v1.4.0
   ```
   If the release pipeline is triggered by the tag, mention what
   the tag will trigger so the user knows what to expect.
7. Sanity-check before declaring done: the version in
   `package.json` (or equivalent) matches the tag, the changelog
   matches the commit list, and no unreleased breaking change is
   silently in `main`.

## Examples

In scope: "Cut a release for `@gitlawb/skill-validator`."

→ Run `git describe --tags --abbrev=0`. List commits since.
Group: one fix for the SPDX list update, one new exported helper,
no breakers. Picks **minor**. Bumps `package.json`. Writes notes:
"Added `validateBody` helper for callers that already have parsed
frontmatter. Fixed SPDX list refresh missing GPL-3.0-or-later."
Output tag commands; do not push.

In scope: "We renamed an exported function from `validate` to
`validateSkill`."

→ That is a breaking change for callers. **Major** (or **minor**
during `0.x`). Release notes must include the migration: import
the new name; the old name is removed. Offer a one-line codemod
if the rename is straightforward.

Out of scope: "Write release automation in GitHub Actions."

→ Pipeline design is not a per-release task. Use `ci-fix` or a
dedicated automation pass.

## Self-check before responding

- Did I look at the actual commits / PRs since the last tag, not
  just what the user remembers?
- Did I separate breaking, features, fixes, internal — and let the
  breakers dictate the bump?
- Do the release notes tell the user what to DO, not just what
  changed?
- Did I use the project's existing changelog style?
- Did I produce the tag commands without pushing the tag myself?
- Did I confirm `package.json` and the changelog reflect the new
  version before declaring done?
