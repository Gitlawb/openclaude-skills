import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { parseFrontmatter, splitFrontmatter } from './frontmatter.js';
import { validateBody } from './body.js';
import { scanSkillFolder } from './files.js';
import type {
  ParsedSkill,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from './types.js';

export * from './types.js';

/**
 * Validate the contents of a SKILL.md as a string. Combines frontmatter,
 * body, and security-scanner checks. Folder-level rules are NOT applied
 * here — use `validateSkillFolder` for that.
 */
export function validateSkill(skillMdContent: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const split = splitFrontmatter(skillMdContent);
  if (!split) {
    return {
      ok: false,
      errors: [
        {
          code: 'frontmatter.missing_block',
          message: 'SKILL.md must start with a YAML frontmatter block delimited by --- lines.',
        },
      ],
      warnings: [],
    };
  }

  const fmResult = parseFrontmatter(split.yamlText);
  errors.push(...fmResult.errors);
  warnings.push(...fmResult.warnings);

  const bodyResult = validateBody({ body: split.body, totalContent: skillMdContent });
  errors.push(...bodyResult.errors);
  warnings.push(...bodyResult.warnings);

  let parsed: ParsedSkill | undefined;
  if (fmResult.parsed) {
    parsed = {
      frontmatter: fmResult.parsed,
      body: split.body,
      rawLength: skillMdContent.length,
    };
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    parsed,
  };
}

/**
 * Validate a skill folder on disk. Runs folder-level checks (file policy,
 * symlinks, size) and then `validateSkill` on the SKILL.md if present.
 */
export async function validateSkillFolder(folderPath: string): Promise<ValidationResult> {
  const folder = await scanSkillFolder(folderPath);
  const errors: ValidationError[] = [...folder.errors];
  const warnings: ValidationWarning[] = [];

  let parsed: ParsedSkill | undefined;

  if (folder.skillMdPath) {
    let content: string;
    try {
      content = await fs.readFile(folder.skillMdPath, 'utf8');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({
        code: 'files.skill_md_unreadable',
        message: `Could not read SKILL.md: ${msg}`,
      });
      return { ok: false, errors, warnings };
    }

    const inner = validateSkill(content);
    errors.push(...inner.errors);
    warnings.push(...inner.warnings);
    parsed = inner.parsed;

    // The folder name drives `id` in the registry; the frontmatter name
    // drives the `name` field. They must match so callers can't end up
    // with entries like { id: "gitlawb/foo", name: "bar" }.
    if (parsed) {
      const folderName = path.basename(path.resolve(folderPath));
      if (parsed.frontmatter.name !== folderName) {
        errors.push({
          code: 'frontmatter.name_folder_mismatch',
          message: `Frontmatter "name" (${JSON.stringify(parsed.frontmatter.name)}) must match the folder name (${JSON.stringify(folderName)}).`,
          field: 'name',
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    parsed,
  };
}
