# @gitlawb/skill-validator

The validator for skills in the [Gitlawb Skill Hub](https://github.com/Gitlawb/openclaude-skills)
registry. It is the single source of truth for what makes a skill valid —
the CLI, CI, and contributors all run the same rules through this package.

> This package is a **scaffold** in stage 1. The real public API lands in
> stage 2.

## Planned public API

```ts
import { validateSkill, validateSkillFolder } from '@gitlawb/skill-validator';

// Validate a SKILL.md as a string:
const result = validateSkill(skillMdContent);

// Validate a skill folder on disk:
const folderResult = await validateSkillFolder('skills/pr-review');

if (!result.ok) {
  for (const err of result.errors) {
    console.error(err.message);
  }
}
```
