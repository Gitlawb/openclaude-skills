# openclaude-skills

The source of truth for the **Gitlawb Skill Hub** — a registry of installable
skills for the `openclaude` CLI.

## What this repo is

Each folder under `skills/` is one skill: a self-contained `SKILL.md` (with
optional `README.md`) that defines when and how a skill should be used. The
registry is built from these folders into a single `registry.json` at the
repo root, which the CLI reads.

## Installing a skill

```
openclaude skills add gitlawb/<name>
```

For example: `openclaude skills add gitlawb/pr-review`.

## Contributing a skill

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guide and
[`REVIEW_POLICY.md`](REVIEW_POLICY.md) for the rules every PR is
reviewed against. The short version:

1. Create `skills/<your-skill>/SKILL.md` — copy the structure from
   [`skills/pr-review/`](skills/pr-review/).
2. Validate it locally with `bun run scripts/validate-skill.ts skills/<your-skill>/`.
3. Rebuild the registry with `bun run build:registry`.
4. Open a PR using the "new skill" template.

## Where the validator lives

The validator is published to npm as
[`@gitlawb/skill-validator`](https://www.npmjs.com/package/@gitlawb/skill-validator).
Its source lives at `packages/validator/` in this repo. The CLI, CI workflow,
and any third-party tooling depend on the published package rather than
re-implementing the rules. See `DECISIONS.md` for the schema and policy
this registry locks in.
