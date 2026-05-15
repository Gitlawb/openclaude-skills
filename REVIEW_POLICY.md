# Review Policy

This document is the rulebook for reviewing PRs against
`Gitlawb/openclaude-skills`. It is intentionally specific so that
reviewers and contributors can both predict the outcome of a PR
before it is filed.

## Reviewer requirements per trust tier

### `official`

- **Authorship**: Gitlawb maintainer.
- **Approvals required**: two maintainers.
- **Bar**: highest. The skill should be one a maintainer would
  recommend to a stranger without caveats.

### `verified`

- **Authorship**: third party.
- **Approvals required**: one maintainer.
- **Bar**: same quality as `official`. Difference is provenance, not
  rigor.
- **Author responsibility**: every review comment must be addressed
  (fixed, explained, or argued — silence is not addressing).

### `community`

- **Authorship**: third party (typically a first-time contributor).
- **Approvals required**: one maintainer, focused on safety, not
  quality.
- **Surface**: merged with the `community` badge visible in the
  registry and surfaced by the CLI before enabling.
- **Promotion path**: a follow-up PR can request `verified` after
  use in the wild.

### `deprecated`

- **Authorship**: any.
- **Approvals required**: one maintainer.
- **Surface**: stays visible for users who already depend on it, but the
  site and CLI should discourage new installs.
- **Use case**: replaced, abandoned, or no longer recommended skills that
  are not malicious enough to revoke.

Non-community trust is controlled by `.maintainers/trust.json`, not by
frontmatter alone. A reviewer may approve a skill content change without
promoting trust; promotion requires the matching policy entry and the review
bar for that tier.

## Rejection criteria

Reviews close a PR (or request rewrite) only for explicit reasons. A
reviewer may not reject a PR for unstated taste preferences.

- The validator fails (`bun run scripts/validate-skill.ts` exits 1).
- The skill duplicates an existing skill's scope without clear
  differentiation. Two skills that fire on the same triggers and run
  the same procedure are a bug.
- The author refuses to address review comments — silence or repeated
  re-submission without changes.
- The body contains advice the reviewer disagrees with on technical
  merit. Disagreement must be specific; "I'd write this differently"
  is not a rejection reason.
- The "Use this skill when" rules are vague or overlap confusingly
  with another skill. Reviewers should propose a sharper trigger if
  possible.
- The security scanner produces errors that cannot be resolved without
  changing the skill's intent (i.e., the skill genuinely needs to
  describe a banned pattern). In rare cases the right answer is to
  reshape the skill, not to bypass the scanner.
- A PR attempts to self-promote `trust: verified` or `trust: official`
  without a maintainer-owned `.maintainers/trust.json` entry.

## Service-level expectations

Maintainer review is best effort. There is no committed turnaround
time. PRs that sit untouched for more than a week may be pinged in
the PR thread; pinging earlier is noise.

## Trust tier transitions

### `community` → `verified`

- Opens as a new PR (the skill content does not need to change).
- Requires one maintainer review.
- Typically requested after the skill has been used in the wild long
  enough to surface issues.
- Must add or update `.maintainers/trust.json` for the exact
  `gitlawb/<name>@<version>` key.

### `verified` → `official`

- Almost always requires maintainer authorship.
- Usually a rewrite rather than a promotion — the procedure, examples,
  and self-check tend to need re-shaping for the higher bar.
- Two maintainer approvals.
- Must add or update `.maintainers/trust.json` for the exact
  `gitlawb/<name>@<version>` key.

### any tier → `deprecated`

- Opens as a PR that updates `.maintainers/trust.json`.
- Requires a clear replacement, abandonment, or maintenance-risk reason.
- Does not require deleting the skill from the registry.

## Updates to existing skills

Version bumps follow the rules in [`DECISIONS.md`](DECISIONS.md):

- **Major** — change to trigger rules ("Use this skill when" / "Do
  NOT use this skill when"). Treated as a new-skill review: full
  scrutiny.
- **Minor** — change to the procedure or examples. One maintainer
  approval.
- **Patch** — wording, typos, clarifications. One maintainer
  approval, typically merged quickly.

The `version` field in the SKILL.md frontmatter must be bumped to
match. The `skill_update.md` PR template asks for this explicitly.

## What this policy is not

This policy is not a substitute for technical judgement. A skill that
satisfies every criterion but is still a bad idea can be rejected with
an explanation. A skill that fails one criterion but is otherwise
clearly excellent can be merged with a follow-up issue. Maintainers
are accountable for these calls in the PR thread.
