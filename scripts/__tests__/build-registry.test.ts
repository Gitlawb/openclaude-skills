import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildRegistry } from '../build-registry.js';

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const VALIDATOR_FIXTURES = path.join(REPO_ROOT, 'packages', 'validator', 'tests', 'fixtures');

const TMP_ROOT = path.join(os.tmpdir(), `build-registry-${process.pid}`);

async function cleanRoot(): Promise<void> {
  await fs.rm(TMP_ROOT, { recursive: true, force: true });
  await fs.mkdir(TMP_ROOT, { recursive: true });
}

async function copyFixtureAsSkill(srcName: string, dstSkillsDir: string, dstName: string): Promise<void> {
  const src = path.join(VALIDATOR_FIXTURES, srcName);
  const dst = path.join(dstSkillsDir, dstName);
  await fs.mkdir(dst, { recursive: true });
  for (const entry of await fs.readdir(src)) {
    await fs.copyFile(path.join(src, entry), path.join(dst, entry));
  }
}

beforeAll(async () => {
  await cleanRoot();
});

afterAll(async () => {
  await fs.rm(TMP_ROOT, { recursive: true, force: true });
});

describe('buildRegistry', () => {
  it('produces an empty array when skills/ is empty', async () => {
    const skillsDir = path.join(TMP_ROOT, 'empty-skills');
    const outputPath = path.join(TMP_ROOT, 'empty-registry.json');
    await fs.mkdir(skillsDir, { recursive: true });

    const result = await buildRegistry({ skillsDir, outputPath });

    expect(result.errors).toEqual([]);
    expect(result.entries).toEqual([]);
    expect(result.serialized).toBe('[]\n');

    const onDisk = await fs.readFile(outputPath, 'utf8');
    expect(onDisk).toBe('[]\n');
  });

  it('produces an empty array when skills/ does not exist', async () => {
    const skillsDir = path.join(TMP_ROOT, 'never-created');
    const outputPath = path.join(TMP_ROOT, 'never-registry.json');

    const result = await buildRegistry({ skillsDir, outputPath });
    expect(result.errors).toEqual([]);
    expect(result.entries).toEqual([]);
  });

  it('sorts entries by id alphabetically', async () => {
    const skillsDir = path.join(TMP_ROOT, 'sorted-skills');
    await fs.mkdir(skillsDir, { recursive: true });

    // Three skills with frontmatter `name` matching folder name; the
    // validator now requires this match, so each fixture is generated
    // from the valid-skill template with the right name in place.
    const template = await fs.readFile(
      path.join(VALIDATOR_FIXTURES, 'valid-skill', 'SKILL.md'),
      'utf8',
    );
    for (const folder of ['zeta', 'alpha', 'mu']) {
      const dst = path.join(skillsDir, folder);
      await fs.mkdir(dst, { recursive: true });
      await fs.writeFile(
        path.join(dst, 'SKILL.md'),
        template.replace(/^name: valid-skill$/m, `name: ${folder}`),
        'utf8',
      );
    }

    const result = await buildRegistry({
      skillsDir,
      outputPath: path.join(TMP_ROOT, 'sorted-registry.json'),
    });

    expect(result.errors).toEqual([]);
    expect(result.entries.map((e) => e.id)).toEqual([
      'gitlawb/alpha',
      'gitlawb/mu',
      'gitlawb/zeta',
    ]);
  });

  it('computes the sha256 of SKILL.md correctly (LF-normalized)', async () => {
    const skillsDir = path.join(TMP_ROOT, 'sha-skills');
    await fs.mkdir(skillsDir, { recursive: true });
    await copyFixtureAsSkill('valid-skill', skillsDir, 'valid-skill');

    const source = await fs.readFile(path.join(VALIDATOR_FIXTURES, 'valid-skill', 'SKILL.md'), 'utf8');
    const normalized = source.replace(/\r\n/g, '\n');
    const expected = createHash('sha256').update(normalized, 'utf8').digest('hex');

    const result = await buildRegistry({
      skillsDir,
      outputPath: path.join(TMP_ROOT, 'sha-registry.json'),
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]!.sha256).toBe(expected);
  });

  it('produces the same sha256 for LF and CRLF copies of the same skill', async () => {
    const lfDir = path.join(TMP_ROOT, 'crlf-skills-lf');
    const crlfDir = path.join(TMP_ROOT, 'crlf-skills-crlf');
    await fs.mkdir(path.join(lfDir, 'valid-skill'), { recursive: true });
    await fs.mkdir(path.join(crlfDir, 'valid-skill'), { recursive: true });

    const source = await fs.readFile(path.join(VALIDATOR_FIXTURES, 'valid-skill', 'SKILL.md'), 'utf8');
    const lf = source.replace(/\r\n/g, '\n');
    const crlf = lf.replace(/\n/g, '\r\n');

    await fs.writeFile(path.join(lfDir, 'valid-skill', 'SKILL.md'), lf, 'utf8');
    await fs.writeFile(path.join(crlfDir, 'valid-skill', 'SKILL.md'), crlf, 'utf8');

    const lfResult = await buildRegistry({
      skillsDir: lfDir,
      outputPath: path.join(TMP_ROOT, 'crlf-registry-lf.json'),
    });
    const crlfResult = await buildRegistry({
      skillsDir: crlfDir,
      outputPath: path.join(TMP_ROOT, 'crlf-registry-crlf.json'),
    });

    expect(lfResult.entries[0]!.sha256).toBe(crlfResult.entries[0]!.sha256);
  });

  it('is idempotent — running twice produces byte-identical output', async () => {
    const skillsDir = path.join(TMP_ROOT, 'idem-skills');
    const outputPath = path.join(TMP_ROOT, 'idem-registry.json');
    await fs.mkdir(skillsDir, { recursive: true });
    await copyFixtureAsSkill('valid-skill', skillsDir, 'valid-skill');

    const a = await buildRegistry({ skillsDir, outputPath });
    const onDiskA = await fs.readFile(outputPath, 'utf8');

    const b = await buildRegistry({ skillsDir, outputPath });
    const onDiskB = await fs.readFile(outputPath, 'utf8');

    expect(onDiskA).toBe(onDiskB);
    expect(a.serialized).toBe(b.serialized);
  });

  it('reports errors and does not write registry.json when a skill fails validation', async () => {
    const skillsDir = path.join(TMP_ROOT, 'broken-skills');
    const outputPath = path.join(TMP_ROOT, 'broken-registry.json');
    await fs.mkdir(skillsDir, { recursive: true });
    // banned-file fixture has an install.sh that the file policy rejects.
    await copyFixtureAsSkill('banned-file', skillsDir, 'banned');

    const result = await buildRegistry({ skillsDir, outputPath });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.folder).toBe('banned');
    expect(result.errors[0]!.errors.map((e) => e.code)).toContain('files.disallowed_file');
    // No registry.json should be written when validation fails.
    await expect(fs.readFile(outputPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('serialized output is 2-space indented and ends with a trailing newline', async () => {
    const skillsDir = path.join(TMP_ROOT, 'fmt-skills');
    const outputPath = path.join(TMP_ROOT, 'fmt-registry.json');
    await fs.mkdir(skillsDir, { recursive: true });
    await copyFixtureAsSkill('valid-skill', skillsDir, 'valid-skill');

    const result = await buildRegistry({ skillsDir, outputPath });

    expect(result.serialized.endsWith('\n')).toBe(true);
    // 2-space indent — JSON.stringify(_, _, 2) gives the array's object opener
    // at "\n  {" and nested fields at "\n    \"...\"".
    expect(result.serialized).toContain('\n  {');
    expect(result.serialized).toMatch(/\n {4}"/);
  });
});
