# @gitlawb/skill-validator

The validator for skills in the [Gitlawb Skill Hub](https://github.com/Gitlawb/openclaude-skills)
registry. It is the single source of truth for what makes a skill
valid — the registry's CI, the `openclaude` CLI, and any third-party
tooling all run the same rules through this package.

## Install

```
npm install @gitlawb/skill-validator
```

## Usage

### Validate a `SKILL.md` from a string

```ts
import { validateSkill } from '@gitlawb/skill-validator';

const content = `---
name: my-skill
description: Example skill used in the README.
trust: community
version: 0.1.0
license: MIT
---

# My Skill

A body long enough to clear the 200-character minimum so this example
parses cleanly without tripping the body-length rule.

## Use this skill when

- triggers.

## Procedure

1. step.
`;

const result = validateSkill(content);

if (!result.ok) {
  for (const error of result.errors) {
    const where = error.line !== undefined ? `:${error.line}` : '';
    console.error(`[${error.code}]${where} ${error.message}`);
  }
}
```

### Validate a skill folder on disk

```ts
import { validateSkillFolder } from '@gitlawb/skill-validator';

const result = await validateSkillFolder('skills/pr-review');

console.log(result.ok ? 'OK' : 'errors');
for (const w of result.warnings) console.warn(w.message);
```

`validateSkillFolder` adds folder-level rules on top of `validateSkill`:
file allowlist (`SKILL.md`, `README.md`, plus reserved
`.skill-meta.json`), no symlinks, no other hidden files, 1 MB total
size cap.

## Types

```ts
interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed?: ParsedSkill;
}

interface ValidationError {
  code: string;       // e.g. "frontmatter.invalid_license"
  message: string;
  field?: string;     // for frontmatter findings
  line?: number;      // for body/scanner findings
  snippet?: string;   // <= 100 chars
}

// ValidationWarning has the same shape as ValidationError.
```

Every finding has a stable `code` string so callers can pattern-match
on the rule without parsing the human-readable `message`. Codes are
grouped by source: `frontmatter.*`, `body.*`, `scanner.*`, `files.*`.

## What this validator checks

- **Frontmatter** — required fields (`name`, `description`, `trust`,
  `version`, `license`), optional fields (`title`, `category`, `tags`,
  `author`, `compatibility`), and an unknown-field warning. Semver via
  an inline regex; license against the SPDX list.
- **Body** — minimum 200 characters, maximum 100 KB file size,
  required section headers (`## Use this skill when`, `## Procedure`),
  warnings for missing recommended headers.
- **Security scanner** — flags `curl`/`wget` against external URLs,
  secret-style identifiers paired with URLs, base64+eval/exec, `rm -rf`
  against absolute paths, and `<script>` tags — all outside fenced
  code blocks. Warns on URLs pointing at raw IPs.
- **Folder policy** — only `SKILL.md` and `README.md` at the top level
  (plus the reserved `.skill-meta.json`), no symlinks, no other hidden
  files, 1 MB total size cap.

See [`DECISIONS.md`](https://github.com/Gitlawb/openclaude-skills/blob/main/DECISIONS.md)
in the registry repo for the schema this validator enforces and the
policy behind it.

## License

MIT
