import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { ValidationError } from './types.js';

const ALLOWED_FILES = new Set(['SKILL.md', 'README.md']);
const RESERVED_HIDDEN_FILES = new Set(['.skill-meta.json']);
const MAX_FOLDER_BYTES = 1024 * 1024;

export interface FolderScan {
  errors: ValidationError[];
  skillMdPath?: string;
}

/**
 * Walks the top level of a skill folder, enforces the file policy, totals
 * folder size, and rejects symlinks anywhere underneath.
 */
export async function scanSkillFolder(folderPath: string): Promise<FolderScan> {
  const errors: ValidationError[] = [];

  let entries;
  try {
    entries = await fs.readdir(folderPath, { withFileTypes: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      errors: [
        {
          code: 'files.folder_unreadable',
          message: `Cannot read skill folder ${folderPath}: ${msg}`,
        },
      ],
    };
  }

  let skillMdPath: string | undefined;
  let totalBytes = 0;

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);

    if (entry.isSymbolicLink()) {
      errors.push({
        code: 'files.symlink',
        message: `Skill folder must not contain symlinks: ${entry.name}`,
      });
      continue;
    }

    if (entry.isDirectory()) {
      errors.push({
        code: 'files.unexpected_directory',
        message: `Skill folder must be flat — found directory: ${entry.name}`,
      });
      continue;
    }

    if (!entry.isFile()) {
      errors.push({
        code: 'files.unexpected_entry',
        message: `Skill folder must only contain regular files — found: ${entry.name}`,
      });
      continue;
    }

    if (entry.name.startsWith('.')) {
      if (!RESERVED_HIDDEN_FILES.has(entry.name)) {
        errors.push({
          code: 'files.hidden_file',
          message: `Hidden files are not allowed in a skill folder: ${entry.name}`,
        });
      }
    } else if (!ALLOWED_FILES.has(entry.name)) {
      errors.push({
        code: 'files.disallowed_file',
        message: `File "${entry.name}" is not allowed in a skill folder. Allowed: SKILL.md, README.md.`,
      });
    }

    try {
      const stat = await fs.lstat(entryPath);
      totalBytes += stat.size;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({
        code: 'files.stat_failed',
        message: `Could not stat ${entry.name}: ${msg}`,
      });
    }

    if (entry.name === 'SKILL.md') {
      skillMdPath = entryPath;
    }
  }

  if (totalBytes > MAX_FOLDER_BYTES) {
    errors.push({
      code: 'files.folder_too_large',
      message: `Skill folder must be <= ${MAX_FOLDER_BYTES} bytes (got ${totalBytes}).`,
    });
  }

  if (!skillMdPath) {
    errors.push({
      code: 'files.missing_skill_md',
      message: 'Skill folder must contain a SKILL.md file.',
    });
  }

  return { errors, skillMdPath };
}
