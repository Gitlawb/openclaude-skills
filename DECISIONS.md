# Decisions

This document locks the schema and policy for the Gitlawb Skill Hub registry.
Changes here are deliberate; later stages and contributions must conform.

## Trust tiers

Every skill declares a `trust` value in its frontmatter. The accepted values are:

- **`official`** — authored by Gitlawb maintainers. Requires two-maintainer
  review. Highest quality bar.
- **`verified`** — authored by a third party, vouched for by a Gitlawb
  maintainer after one-maintainer review. Same quality bar as `official`.
- **`community`** — authored by a third party, passes automated checks only.
  The CLI must surface a "review before enabling" warning when installing a
  community skill.

During MVP the schema supports `community` but the registry does not yet
accept community-tier PRs from outside contributors.

## File policy inside a skill folder

A skill folder lives at `skills/<name>/`. The following file policy applies:

- **Required**: `SKILL.md`
- **Allowed**: `README.md`
- **Reserved**: `.skill-meta.json` (currently unused, reserved for future use)
- **Disallowed**: everything else (no scripts, binaries, nested folders, etc.)

The validator enforces this.

## Versioning

Skills use semver in their frontmatter `version` field:

- **Major** — change to trigger rules ("Use this skill when" / "Do NOT use
  this skill when"). Existing callers may be affected.
- **Minor** — change to the procedure or examples.
- **Patch** — wording, typos, clarifications.

The registry only serves the `main` branch. There is no per-version
distribution channel during MVP.

## License

The default license for a skill is **MIT**. The frontmatter `license` field
must be a valid OSI-approved SPDX identifier (validated against the
`spdx-license-ids` package).

## Approved categories

The `category` frontmatter field, if present, must be one of:

```
code-review, security, debugging, testing, refactor, release, provider,
ci, database, frontend, docs, migration, general
```

Adding a new category is a deliberate schema change and requires updating
the validator and this document.

## Validator

The validator is the single source of truth for what makes a skill valid.
It lives at `packages/validator/` and is published to npm as
`@gitlawb/skill-validator`. The CLI, CI, and any third-party tooling should
depend on the published package rather than re-implementing the rules.

The validator stays at `0.x` during MVP — breaking changes are allowed
within the `0.y.z` line as the schema settles.

## Service-level expectations

Maintainer review is **best effort**. There is no committed turnaround
time during MVP.
