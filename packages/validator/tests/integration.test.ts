import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validateSkillFolder } from '../src/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(here, 'fixtures');

const TMP_ROOT = path.join(os.tmpdir(), `validator-integration-${process.pid}`);

beforeAll(async () => {
  await fs.mkdir(TMP_ROOT, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TMP_ROOT, { recursive: true, force: true });
});

describe('validateSkillFolder integration', () => {
  it('validates the valid-skill fixture cleanly', async () => {
    const result = await validateSkillFolder(path.join(FIXTURES, 'valid-skill'));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.parsed?.frontmatter.name).toBe('valid-skill');
  });

  it('aggregates errors for the banned-file fixture', async () => {
    const result = await validateSkillFolder(path.join(FIXTURES, 'banned-file'));
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('files.disallowed_file');
  });

  it('flags scanner findings on curl-external', async () => {
    const result = await validateSkillFolder(path.join(FIXTURES, 'curl-external'));
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain('scanner.curl_external_url');
    expect(codes).toContain('scanner.secret_exfiltration');
  });

  it('flags curl inside a fenced block (no fence opt-out)', async () => {
    const result = await validateSkillFolder(path.join(FIXTURES, 'curl-in-fence'));
    expect(result.errors.map((e) => e.code)).toContain('scanner.curl_external_url');
    expect(result.ok).toBe(false);
  });

  it('flags a folder whose name does not match the frontmatter "name"', async () => {
    const folder = path.join(TMP_ROOT, 'mismatched-folder');
    await fs.mkdir(folder, { recursive: true });
    const content = [
      '---',
      'name: not-the-folder',
      'description: Fixture whose frontmatter name disagrees with the folder name.',
      'trust: community',
      'version: 0.1.0',
      'license: MIT',
      '---',
      '',
      '# Mismatched',
      '',
      'Body padded to clear the minimum-character requirement so the validator',
      'reaches the folder/name match check and reports it cleanly.',
      '',
      '## Use this skill when',
      'never',
      '',
      '## Procedure',
      '1. step',
    ].join('\n');
    await fs.writeFile(path.join(folder, 'SKILL.md'), content, 'utf8');

    const result = await validateSkillFolder(folder);
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('frontmatter.name_folder_mismatch');
  });

  it('reports a single clear error when SKILL.md is missing', async () => {
    const folder = path.join(TMP_ROOT, 'empty-folder');
    await fs.mkdir(folder, { recursive: true });
    const result = await validateSkillFolder(folder);
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain('files.missing_skill_md');
  });

  it('rejects an oversized SKILL.md generated at test time', async () => {
    const folder = path.join(TMP_ROOT, 'oversized-body');
    await fs.mkdir(folder, { recursive: true });
    const padding = 'x'.repeat(110 * 1024);
    const content = [
      '---',
      'name: oversized',
      'description: Generated fixture for oversize testing; the body is intentionally over 100 KB.',
      'trust: community',
      'version: 0.1.0',
      'license: MIT',
      '---',
      '',
      '# Oversized',
      '',
      '## Use this skill when',
      'never',
      '',
      '## Procedure',
      '1. step',
      '',
      padding,
    ].join('\n');
    await fs.writeFile(path.join(folder, 'SKILL.md'), content, 'utf8');
    const result = await validateSkillFolder(folder);
    expect(result.errors.map((e) => e.code)).toContain('body.file_too_large');
  });
});
