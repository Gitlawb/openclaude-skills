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
- **`deprecated`** — no longer recommended, replaced, or abandoned, but not
  malicious. The CLI and site should keep it visible with a warning.

During MVP the schema supports `community` but the registry does not yet
accept community-tier PRs from outside contributors.

The `trust` field in `SKILL.md` is not authoritative by itself. Registry
output is controlled by `.maintainers/trust.json`, keyed by
`gitlawb/<name>@<version>`. A skill without a policy entry is emitted as
`community`, and a skill that declares non-community trust without a matching
policy entry fails `bun run build:registry`.

Trust policy entries must not be stale. If a skill is removed or its version
changes, the corresponding policy key must be removed or updated in the same
PR.

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

## Optional capability metadata

Skills may declare:

- `tools_required`: a list of tool names the skill expects to use, such as
  `Read`, `Bash`, or `WebFetch`.
- `min_openclaude_version`: the oldest OpenClaude semver version expected to
  support the skill cleanly.

These fields are validated and included in `registry.json` when present. They
are optional until the CLI enforces install-time permission and version gates.

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

The security scanner runs on every line of `SKILL.md`, including fenced code
blocks. It blocks hidden Unicode controls, HTML comments, fake role markers,
prompt-injection wording, sensitive credential paths, common exfiltration
endpoints, unsafe fetch helpers, encoded eval patterns, and confirmation
bypass language.

## Revocations

`revocations.json` is the reserved registry-level kill switch for compromised
or withdrawn skill versions. Entries should be keyed by skill id, version, and
sha256 once the OpenClaude CLI starts enforcing revocation checks. Until then,
the file exists to keep the contract stable and visible.

## Service-level expectations

Maintainer review is **best effort**. There is no committed turnaround
time during MVP.
