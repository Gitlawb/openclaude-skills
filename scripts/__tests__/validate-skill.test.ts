import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runValidate } from '../validate-skill.js';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VALIDATOR_FIXTURES = path.join(REPO_ROOT, 'packages', 'validator', 'tests', 'fixtures');

const TMP_ROOT = path.join(os.tmpdir(), `validate-skill-${process.pid}`);

beforeAll(async () => {
  await fs.mkdir(TMP_ROOT, { recursive: true });
});

afterAll(async () => {
  await fs.rm(TMP_ROOT, { recursive: true, force: true });
});

describe('runValidate', () => {
  it('exits 0 on a clean fixture', async () => {
    const { exitCode } = await runValidate(path.join(VALIDATOR_FIXTURES, 'valid-skill'));
    expect(exitCode).toBe(0);
  });

  it('exits 1 when the fixture has errors', async () => {
    const { exitCode, result } = await runValidate(path.join(VALIDATOR_FIXTURES, 'banned-file'));
    expect(exitCode).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('exits 2 when the fixture has only warnings (missing "## Examples")', async () => {
    // Build a skill at test time whose only finding is the recommended-header
    // warning for "## Examples".
    const folder = path.join(TMP_ROOT, 'warnings-only');
    await fs.mkdir(folder, { recursive: true });
    const content = [
      '---',
      'name: warnings-only',
      'description: Fixture with only the missing-Examples warning so we can assert exit code 2.',
      'trust: community',
      'version: 0.1.0',
      'license: MIT',
      '---',
      '',
      '# Warnings Only',
      '',
      'This skill exists at test time to exercise the warning-only exit code path.',
      'It deliberately omits the recommended "## Examples" section so the validator',
      'produces a warning but no errors. Body is padded past the 200-character minimum.',
      '',
      '## Use this skill when',
      'never — fixture only',
      '',
      '## Procedure',
      '1. step',
      '',
      '## Self-check before responding',
      '- ok',
    ].join('\n');
    await fs.writeFile(path.join(folder, 'SKILL.md'), content, 'utf8');

    const { exitCode, result } = await runValidate(folder);
    expect(result.errors).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(exitCode).toBe(2);
  });

  it('output includes file:line references for findings with a line number', async () => {
    const { output } = await runValidate(path.join(VALIDATOR_FIXTURES, 'curl-external'));
    // The curl line is somewhere in the body; line number should appear after a colon.
    expect(output).toMatch(/:\d+ \[scanner\.curl_external_url\]/);
  });
});
