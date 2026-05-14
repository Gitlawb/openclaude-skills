import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateSkillFolder,
  type ValidationError,
  type ValidationResult,
  type ValidationWarning,
} from '@gitlawb/skill-validator';

export interface RunValidateResult {
  exitCode: 0 | 1 | 2;
  output: string;
  result: ValidationResult;
}

function formatFindings(folder: string, result: ValidationResult): string {
  const lines: string[] = [];

  for (const e of result.errors) {
    lines.push(formatLine(folder, 'ERROR', e));
  }
  for (const w of result.warnings) {
    lines.push(formatLine(folder, 'WARN ', w));
  }

  if (lines.length === 0) {
    lines.push(`${folder}: OK`);
  }

  return lines.join('\n');
}

function formatLine(folder: string, level: string, finding: ValidationError | ValidationWarning): string {
  const where = finding.line !== undefined ? `:${finding.line}` : '';
  const snippet = finding.snippet ? `\n     ${finding.snippet}` : '';
  return `${level} ${folder}${where} [${finding.code}] ${finding.message}${snippet}`;
}

/**
 * Validate a skill folder and return what the CLI should print and exit with.
 * Extracted so tests can drive it without spawning a process.
 */
export async function runValidate(folder: string): Promise<RunValidateResult> {
  const result = await validateSkillFolder(folder);
  const output = formatFindings(folder, result);
  const exitCode: 0 | 1 | 2 =
    result.errors.length > 0 ? 1 : result.warnings.length > 0 ? 2 : 0;
  return { exitCode, output, result };
}

async function main(): Promise<void> {
  const folder = process.argv[2];
  if (!folder) {
    console.error('Usage: validate-skill <folder>');
    process.exit(1);
  }
  const { exitCode, output } = await runValidate(folder);
  console.log(output);
  process.exit(exitCode);
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
