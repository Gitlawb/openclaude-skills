<!--
Use this template when updating an existing skill.
-->

## Skill being updated
`<name>`

## Version bump
- [ ] **Major** — trigger-rule change ("Use this skill when" / "Do NOT")
- [ ] **Minor** — procedure or examples changed
- [ ] **Patch** — wording or typos

Reason: <one sentence>

## Summary of changes
What changed and why. Cite the specific sections that moved.

## Checklist
- [ ] Validated locally: `bun run scripts/validate-skill.ts skills/<name>/`
- [ ] Registry rebuilt: `bun run build:registry`
- [ ] SKILL.md still follows the standard structure
- [ ] `version` in frontmatter bumped accordingly
- [ ] No banned content (curl/wget to external URLs outside fences,
      secrets, base64+exec patterns)
