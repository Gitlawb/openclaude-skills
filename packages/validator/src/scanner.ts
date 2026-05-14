import type { ValidationError, ValidationWarning } from './types.js';

interface ScanRule {
  code: string;
  severity: 'error' | 'warning';
  test: (line: string) => boolean;
  message: string;
}

const RULES: ScanRule[] = [
  {
    code: 'scanner.curl_external_url',
    severity: 'error',
    message: 'Line uses curl or wget against an external URL — skills must not fetch arbitrary content at runtime.',
    test: (line) => /\b(curl|wget)\b/.test(line) && /https?:\/\//.test(line),
  },
  {
    code: 'scanner.secret_exfiltration',
    severity: 'error',
    message: 'Line references credentials/tokens together with a URL — looks like exfiltration.',
    test: (line) =>
      /(env|environ|secret|credential|api[_-]?key|password|token|bearer)/i.test(line) &&
      /https?:\/\//.test(line),
  },
  {
    code: 'scanner.encoded_eval',
    severity: 'error',
    message: 'Line combines base64/decode with exec/eval/system/shell — looks like obfuscated code execution.',
    test: (line) =>
      /(base64|atob|btoa|decode)/i.test(line) && /(exec|eval|system|shell)/i.test(line),
  },
  {
    code: 'scanner.rm_rf_absolute',
    severity: 'error',
    message: 'Line uses "rm -rf" against an absolute path.',
    test: (line) => /\brm\s+-rf?\s+\//.test(line) || /\brm\s+-rf?\s+["']\//.test(line),
  },
  {
    code: 'scanner.script_tag',
    severity: 'error',
    message: 'Line contains a <script> tag.',
    test: (line) => /<script\b/i.test(line),
  },
  {
    code: 'scanner.url_to_ip',
    severity: 'warning',
    message: 'URL points at a raw IP address rather than a hostname.',
    test: (line) => /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/.test(line),
  },
];

function snippetOf(line: string): string {
  return line.length > 100 ? line.slice(0, 100) : line;
}

// Scans every line of the body — including content inside fenced code blocks.
// Skills are read by agents that may treat fenced commands as runnable, so the
// trust boundary cannot rely on a fence opt-out. Authors who need to describe
// a dangerous pattern in documentation should obfuscate it (e.g.
// `curl ATTACKER_URL`) or describe it in prose.
export function scanBody(body: string): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const lines = body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    for (const rule of RULES) {
      if (rule.test(line)) {
        const finding = {
          code: rule.code,
          message: rule.message,
          line: i + 1,
          snippet: snippetOf(line),
        };
        if (rule.severity === 'error') errors.push(finding);
        else warnings.push(finding);
      }
    }
  }

  return { errors, warnings };
}
