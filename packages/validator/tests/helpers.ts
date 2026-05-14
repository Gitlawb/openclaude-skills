/**
 * Build a SKILL.md string from a frontmatter object and a body. Keeps tests
 * concise and free of multi-line template noise.
 */
export function buildSkillMd(
  frontmatter: Record<string, unknown>,
  body: string = defaultBody(),
): string {
  const lines: string[] = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${item}`);
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${String(value)}`);
    }
  }
  lines.push('---', '', body);
  return lines.join('\n');
}

export function defaultFrontmatter(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'fixture',
    description: 'Fixture frontmatter for unit tests of the validator package.',
    trust: 'official',
    version: '0.1.0',
    license: 'MIT',
    ...overrides,
  };
}

export function defaultBody(): string {
  return [
    '# Fixture',
    '',
    'This body is long enough to clear the 200-character minimum so unit',
    'tests can focus on the frontmatter/body rule they actually care about.',
    '',
    '## Use this skill when',
    '',
    'Never — fixture only.',
    '',
    '## Procedure',
    '',
    '1. Do nothing.',
    '',
    '## Examples',
    '',
    'In scope: fixture-driven tests.',
    '',
    '## Self-check before responding',
    '',
    '- Was the validator called?',
  ].join('\n');
}
