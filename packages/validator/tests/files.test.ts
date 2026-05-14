import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validateSkillFolder } from '../src/index.js';
import { buildSkillMd, defaultBody, defaultFrontmatter } from './helpers.js';

const TMP_ROOT = path.join(os.tmpdir(), `validator-files-${process.pid}`);

async function writeSkill(folder: string, frontmatter: Record<string, unknown> = defaultFrontmatter()): Promise<void> {
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, 'SKILL.md'), buildSkillMd(frontmatter, defaultBody()), 'utf8');
}

beforeAll(async () => {
  await fs.mkdir(TMP_ROOT, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TMP_ROOT, { recursive: true, force: true });
});

describe('skill folder file policy', () => {
  it('accepts a folder with SKILL.md and README.md', async () => {
    const folder = path.join(TMP_ROOT, 'ok-readme');
    await writeSkill(folder);
    await fs.writeFile(path.join(folder, 'README.md'), '# README\n', 'utf8');
    const result = await validateSkillFolder(folder);
    expect(result.errors.filter((e) => e.code.startsWith('files.'))).toEqual([]);
  });

  it('rejects a folder containing install.sh and names the file', async () => {
    const folder = path.join(TMP_ROOT, 'banned');
    await writeSkill(folder);
    await fs.writeFile(path.join(folder, 'install.sh'), '#!/bin/sh\n', 'utf8');
    const result = await validateSkillFolder(folder);
    const finding = result.errors.find((e) => e.code === 'files.disallowed_file');
    expect(finding).toBeDefined();
    expect(finding?.message).toContain('install.sh');
  });

  it('rejects a symlink to /etc', async () => {
    const folder = path.join(TMP_ROOT, 'symlink');
    await writeSkill(folder);
    try {
      await fs.symlink('/etc', path.join(folder, 'etc-link'));
    } catch {
      return; // symlinks not supported in this environment; skip.
    }
    const result = await validateSkillFolder(folder);
    expect(result.errors.map((e) => e.code)).toContain('files.symlink');
  });

  it('rejects a stray .hidden file', async () => {
    const folder = path.join(TMP_ROOT, 'hidden');
    await writeSkill(folder);
    await fs.writeFile(path.join(folder, '.hidden'), 'nope\n', 'utf8');
    const result = await validateSkillFolder(folder);
    expect(result.errors.map((e) => e.code)).toContain('files.hidden_file');
  });

  it('allows the reserved .skill-meta.json file', async () => {
    const folder = path.join(TMP_ROOT, 'meta');
    await writeSkill(folder);
    await fs.writeFile(path.join(folder, '.skill-meta.json'), '{}\n', 'utf8');
    const result = await validateSkillFolder(folder);
    expect(result.errors.filter((e) => e.code === 'files.hidden_file')).toEqual([]);
  });

  it('rejects a folder larger than 1 MB', async () => {
    const folder = path.join(TMP_ROOT, 'huge');
    await writeSkill(folder);
    // README.md padded past the 1 MB folder cap.
    await fs.writeFile(path.join(folder, 'README.md'), 'x'.repeat(1024 * 1024 + 1), 'utf8');
    const result = await validateSkillFolder(folder);
    expect(result.errors.map((e) => e.code)).toContain('files.folder_too_large');
  });
});
