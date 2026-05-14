import { describe, expect, it } from 'vitest';
import { validateSkill } from '../src/index.js';
import { buildSkillMd, defaultFrontmatter } from './helpers.js';

function fmHeader(): string {
  return buildSkillMd(defaultFrontmatter(), '__BODY__').split('__BODY__')[0]!;
}

function withBody(body: string): string {
  return fmHeader() + body;
}

describe('body validation', () => {
  it('rejects a body under 200 chars', () => {
    const content = withBody('# Tiny\n\nToo short.');
    const result = validateSkill(content);
    expect(result.errors.map((e) => e.code)).toContain('body.too_short');
  });

  it('rejects a file over 100 KB', () => {
    const filler = 'x'.repeat(110 * 1024);
    const body = [
      '# Big',
      '## Use this skill when',
      'never',
      '## Procedure',
      '1. nope',
      filler,
    ].join('\n');
    const result = validateSkill(withBody(body));
    expect(result.errors.map((e) => e.code)).toContain('body.file_too_large');
  });

  it('errors when "## Use this skill when" is missing', () => {
    const body = [
      '# Skill',
      'Body that is long enough to clear the minimum-character requirement, padded',
      'so we focus on the missing-header rule alone.',
      '## Procedure',
      '1. step',
    ].join('\n');
    const errors = validateSkill(withBody(body)).errors;
    expect(errors.some((e) => e.message.includes('Use this skill when'))).toBe(true);
  });

  it('errors when "## Procedure" is missing', () => {
    const body = [
      '# Skill',
      'Body that is long enough to clear the minimum-character requirement, padded',
      'so we focus on the missing-header rule alone.',
      '## Use this skill when',
      'never',
    ].join('\n');
    const errors = validateSkill(withBody(body)).errors;
    expect(errors.some((e) => e.message.includes('Procedure'))).toBe(true);
  });

  it('warns when "## Examples" is missing', () => {
    const body = [
      '# Skill',
      'Body that is long enough to clear the minimum-character requirement,',
      'padded so we focus on the recommended-headers rule alone.',
      '## Use this skill when',
      'never',
      '## Procedure',
      '1. step',
      '## Self-check before responding',
      '- ok',
    ].join('\n');
    const warnings = validateSkill(withBody(body)).warnings;
    expect(warnings.some((w) => w.message.includes('Examples'))).toBe(true);
  });

  it('warns when "## Self-check before responding" is missing', () => {
    const body = [
      '# Skill',
      'Body that is long enough to clear the minimum-character requirement,',
      'padded so we focus on the recommended-headers rule alone.',
      '## Use this skill when',
      'never',
      '## Procedure',
      '1. step',
      '## Examples',
      'fixture only',
    ].join('\n');
    const warnings = validateSkill(withBody(body)).warnings;
    expect(warnings.some((w) => w.message.includes('Self-check'))).toBe(true);
  });

  it('passes when all required and recommended sections are present', () => {
    const body = [
      '# Skill',
      'Body padded to clear the minimum-character requirement easily so we can',
      'isolate the success path for the body validator.',
      '## Use this skill when',
      'never — fixture only',
      '## Procedure',
      '1. step',
      '## Examples',
      'in scope: nothing real',
      '## Self-check before responding',
      '- ok',
    ].join('\n');
    const result = validateSkill(withBody(body));
    expect(result.errors.filter((e) => e.code.startsWith('body.'))).toEqual([]);
    expect(result.warnings.filter((w) => w.code === 'body.missing_recommended_header')).toEqual([]);
  });
});
