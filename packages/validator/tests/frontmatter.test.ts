import { describe, expect, it } from 'vitest';
import { validateSkill } from '../src/index.js';
import { buildSkillMd, defaultFrontmatter } from './helpers.js';

function errCodes(content: string): string[] {
  return validateSkill(content).errors.map((e) => e.code);
}

function warnCodes(content: string): string[] {
  return validateSkill(content).warnings.map((w) => w.code);
}

describe('frontmatter validation', () => {
  it('rejects missing name with a name-tagged error', () => {
    const { name: _name, ...rest } = defaultFrontmatter();
    void _name;
    const content = buildSkillMd(rest);
    const result = validateSkill(content);
    expect(result.ok).toBe(false);
    const found = result.errors.find((e) => e.code === 'frontmatter.missing_name');
    expect(found).toBeDefined();
    expect(found?.field).toBe('name');
  });

  it('rejects missing description', () => {
    const { description: _description, ...rest } = defaultFrontmatter();
    void _description;
    const content = buildSkillMd(rest);
    expect(errCodes(content)).toContain('frontmatter.missing_description');
  });

  it('rejects "Foo Bar" as a name (invalid charset)', () => {
    const content = buildSkillMd(defaultFrontmatter({ name: '"Foo Bar"' }));
    expect(errCodes(content)).toContain('frontmatter.invalid_name');
  });

  it('rejects "../etc" as a name', () => {
    const content = buildSkillMd(defaultFrontmatter({ name: '"../etc"' }));
    expect(errCodes(content)).toContain('frontmatter.invalid_name');
  });

  it('rejects description over 200 chars', () => {
    const long = 'x'.repeat(201);
    const content = buildSkillMd(defaultFrontmatter({ description: long }));
    expect(errCodes(content)).toContain('frontmatter.description_too_long');
  });

  it('rejects trust "premium"', () => {
    const content = buildSkillMd(defaultFrontmatter({ trust: 'premium' }));
    expect(errCodes(content)).toContain('frontmatter.invalid_trust');
  });

  it('rejects non-semver version', () => {
    const content = buildSkillMd(defaultFrontmatter({ version: 'not-semver' }));
    expect(errCodes(content)).toContain('frontmatter.invalid_version');
  });

  it('rejects non-OSI license "Proprietary"', () => {
    const content = buildSkillMd(defaultFrontmatter({ license: 'Proprietary' }));
    expect(errCodes(content)).toContain('frontmatter.invalid_license');
  });

  it('accepts MIT as a valid license', () => {
    const content = buildSkillMd(defaultFrontmatter({ license: 'MIT' }));
    const result = validateSkill(content);
    expect(result.errors.some((e) => e.code.startsWith('frontmatter.'))).toBe(false);
  });

  it('rejects category "memes" (not on approved list)', () => {
    const content = buildSkillMd(defaultFrontmatter({ category: 'memes' }));
    expect(errCodes(content)).toContain('frontmatter.invalid_category');
  });

  it('rejects an invalid tag "Foo Bar"', () => {
    const content = buildSkillMd(defaultFrontmatter({ tags: ['"Foo Bar"'] }));
    expect(errCodes(content)).toContain('frontmatter.invalid_tag');
  });

  it('emits a warning (not an error) for unknown fields', () => {
    const content = buildSkillMd(defaultFrontmatter({ weird_field: 'huh' }));
    const result = validateSkill(content);
    expect(result.warnings.some((w) => w.code === 'frontmatter.unknown_field')).toBe(true);
    expect(result.errors.some((e) => e.code === 'frontmatter.unknown_field')).toBe(false);
  });

  it('rejects a title longer than 80 characters', () => {
    const title = 'x'.repeat(100);
    const content = buildSkillMd(defaultFrontmatter({ title }));
    expect(errCodes(content)).toContain('frontmatter.title_too_long');
  });

  it('happy path: all recognized fields parse successfully', () => {
    const content = buildSkillMd(
      defaultFrontmatter({
        title: 'Fixture',
        category: 'testing',
        tags: ['one', 'two-three'],
        author: 'gnanam',
        compatibility: { engines: 'node>=20' },
      }),
    );
    const result = validateSkill(content);
    expect(result.ok).toBe(true);
    expect(result.parsed?.frontmatter.name).toBe('fixture');
    expect(result.parsed?.frontmatter.tags).toEqual(['one', 'two-three']);
    // No frontmatter warnings either since every field is recognized.
    expect(warnCodes(content).some((c) => c === 'frontmatter.unknown_field')).toBe(false);
  });
});
