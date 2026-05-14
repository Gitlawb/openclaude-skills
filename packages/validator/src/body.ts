import { scanBody } from './scanner.js';
import type { ValidationError, ValidationWarning } from './types.js';

const MIN_BODY_CHARS = 200;
const MAX_FILE_BYTES = 100 * 1024;

const REQUIRED_HEADERS = ['## Use this skill when', '## Procedure'] as const;
const RECOMMENDED_HEADERS = ['## Examples', '## Self-check before responding'] as const;

interface BodyCheckInput {
  body: string;
  totalContent: string;
}

export function validateBody({ body, totalContent }: BodyCheckInput): {
  errors: ValidationError[];
  warnings: ValidationWarning[];
} {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const bodyLength = body.length;
  if (bodyLength < MIN_BODY_CHARS) {
    errors.push({
      code: 'body.too_short',
      message: `Skill body must be at least ${MIN_BODY_CHARS} characters (got ${bodyLength}).`,
    });
  }

  const fileBytes = Buffer.byteLength(totalContent, 'utf8');
  if (fileBytes > MAX_FILE_BYTES) {
    errors.push({
      code: 'body.file_too_large',
      message: `SKILL.md must be <= ${MAX_FILE_BYTES} bytes (got ${fileBytes}).`,
    });
  }

  for (const header of REQUIRED_HEADERS) {
    if (!hasHeader(body, header)) {
      errors.push({
        code: 'body.missing_required_header',
        message: `Missing required section "${header}".`,
      });
    }
  }

  for (const header of RECOMMENDED_HEADERS) {
    if (!hasHeader(body, header)) {
      warnings.push({
        code: 'body.missing_recommended_header',
        message: `Missing recommended section "${header}".`,
      });
    }
  }

  const scan = scanBody(body);
  errors.push(...scan.errors);
  warnings.push(...scan.warnings);

  return { errors, warnings };
}

function hasHeader(body: string, header: string): boolean {
  const lines = body.split('\n');
  for (const line of lines) {
    if (line.trim() === header) return true;
  }
  return false;
}
