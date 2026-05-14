import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

describe('consumer integration', () => {
  it('a fresh ESM project can import and call validateSkill from the packed tarball', () => {
    // Build and pack the validator.
    const repoRoot = join(here, '..', '..');
    const validatorDir = join(repoRoot, 'packages', 'validator');

    // Ensure dist is up to date.
    execSync('bun run build', { cwd: validatorDir, stdio: 'pipe' });

    // Pack into a temp dir.
    const packDir = mkdtempSync(join(tmpdir(), 'skill-validator-pack-'));
    execSync(`npm pack --pack-destination ${packDir}`, {
      cwd: validatorDir,
      stdio: 'pipe',
    });
    const tarball = readdirSync(packDir).find((f) => f.endsWith('.tgz'));
    if (!tarball) throw new Error('npm pack produced no tarball');

    // Create a fresh consumer project.
    const consumerDir = mkdtempSync(join(tmpdir(), 'skill-validator-consumer-'));
    writeFileSync(
      join(consumerDir, 'package.json'),
      JSON.stringify(
        {
          name: 'consumer-test',
          version: '1.0.0',
          type: 'module',
          private: true,
          dependencies: {
            '@gitlawb/skill-validator': `file:${join(packDir, tarball)}`,
          },
        },
        null,
        2,
      ),
    );

    execSync('npm install --no-audit --no-fund', {
      cwd: consumerDir,
      stdio: 'pipe',
    });

    // Run the validator from a plain Node ESM script — this is what real
    // downstream consumers (e.g. the openclaude CLI) will do.
    writeFileSync(
      join(consumerDir, 'test.mjs'),
      `import { validateSkill } from '@gitlawb/skill-validator';
const sample = \`---
name: test-skill
description: A test skill.
trust: official
version: 0.1.0
license: MIT
---

# Test Skill

## Use this skill when
- Always.

## Procedure
\${'x'.repeat(300)}
\`;
const result = validateSkill(sample);
console.log(JSON.stringify({ ok: result.ok, errors: result.errors.length, warnings: result.warnings.length }));
`,
    );

    const output = execSync('node test.mjs', {
      cwd: consumerDir,
      encoding: 'utf8',
    }).trim();

    const parsed = JSON.parse(output);
    expect(parsed.ok).toBe(true);
    expect(parsed.errors).toBe(0);
  }, 60_000);
});
