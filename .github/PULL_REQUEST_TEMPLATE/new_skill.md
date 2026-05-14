<!--
Use this template when adding a new skill. Replace <name> with your
skill's folder name throughout.
-->

## Skill name
`<name>`

## Description
One paragraph: what the skill does and the smallest example of when
it should fire.

## Why this skill
What problem does it solve that no existing skill handles, or what
does it handle better than the closest match?

## Trust tier requested
- [ ] `community` (default for first-time contributors)
- [ ] `verified` (request only if a maintainer has already vouched)
- [ ] `official` (maintainers only)

## Checklist
- [ ] Validated locally: `bun run scripts/validate-skill.ts skills/<name>/`
- [ ] Registry rebuilt: `bun run build:registry`
- [ ] SKILL.md follows the standard structure (see `skills/pr-review/`)
- [ ] License is OSI-approved
- [ ] No banned content (curl/wget to external URLs outside fences,
      secrets, base64+exec patterns)
