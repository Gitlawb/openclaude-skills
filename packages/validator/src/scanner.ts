import type { ValidationError, ValidationWarning } from './types.js';

interface NormalizedLine {
  original: string;
  normalized: string;
  lower: string;
}

interface ScanRule {
  code: string;
  severity: 'error' | 'warning';
  test: (line: NormalizedLine) => boolean;
  message: string;
}

const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/;
const BIDI_CONTROL_RE = /[\u202A-\u202E\u2066-\u2069]/;
const UNICODE_TAG_RE = /[\u{E0000}-\u{E007F}]/u;
const HTML_COMMENT_RE = /<!--|-->/;

const HTTP_URL_RE = /https?:\/\//;
const CREDENTIAL_RE = /\b(env|environ|secret|credential|api[_-]?key|password|token|bearer|authorization)\b/;
const PROMPT_INSTRUCTION_OVERRIDE_RE =
  /\b(ignore|disregard|bypass|override)\s+(?:the\s+)?(?:previous|prior|all|system|developer)\s+(?:instructions?|messages?|rules?)\b/;
const PROMPT_ROLEPLAY_RE =
  /\b(?:you are now|act as|pretend (?:to be|you are))\b.*\b(?:system|developer|assistant|root|admin|jailbreak|unrestricted|uncensored|dan)\b/;
const FAKE_ROLE_MARKER_RE =
  /<\/?(?:system|assistant|developer|user)>|<\|im_(?:start|end)\|>|\[\/?inst\]/;
const ROLE_PREFIX_RE = /^\s*(?:human|assistant|system|developer)\s*:\s+/;
const SENSITIVE_PATH_RE =
  /(?:~\/\.ssh|\.ssh\/|id_rsa|id_ed25519|~\/\.aws|\.aws\/credentials|~\/\.config|~\/\.npmrc|(?:^|[\s"'`(])\.env(?:$|[\s"'`.)])|\bgh\s+auth\s+token\b|\baws_access_key_id\b)/;
const EXFIL_ENDPOINT_RE =
  /(?:discord\.com\/api\/webhooks|hooks\.slack\.com|t\.me\/|telegram\.org\/bot|requestbin|webhook\.site|ngrok(?:-free)?\.app|ngrok\.io|beeceptor|pastebin\.com)/;
const FETCH_WITH_URL_RE =
  /(?:\b(?:curl|wget)\b|\bfetch\s*\(|\baxios\s*\(|\b(?:httpx|requests)\s*\.\s*(?:get|post|put|delete|request)\s*\(|\b(?:invoke-webrequest|invoke-restmethod|iwr|irm)\b|\bnet::http\b)/;
const DISABLE_SAFETY_RE =
  /(?:(?:do not|don't|dont)\s+ask\s+(?:the\s+)?user|skip\s+confirmation|auto-?accept|auto-?approve|auto-?run)/;
const YES_WITH_DESTRUCTIVE_RE =
  /(?:--yes\b.*\b(?:rm|delete|remove|destroy|wipe|format)\b|\b(?:rm|delete|remove|destroy|wipe|format)\b.*--yes\b)/;

const RULES: ScanRule[] = [
  {
    code: 'scanner.unicode_tag_chars',
    severity: 'error',
    message: 'Line contains Unicode tag characters, which can hide prompt instructions from reviewers.',
    test: (line) => UNICODE_TAG_RE.test(line.original),
  },
  {
    code: 'scanner.zero_width_chars',
    severity: 'error',
    message: 'Line contains zero-width characters, which can hide prompt instructions from reviewers.',
    test: (line) => ZERO_WIDTH_RE.test(line.original),
  },
  {
    code: 'scanner.bidi_control_chars',
    severity: 'error',
    message: 'Line contains bidirectional control characters, which can disguise visible text order.',
    test: (line) => BIDI_CONTROL_RE.test(line.original),
  },
  {
    code: 'scanner.html_comment',
    severity: 'error',
    message: 'Line contains an HTML comment marker. Hidden comments are not allowed in skill text.',
    test: (line) => HTML_COMMENT_RE.test(line.normalized),
  },
  {
    code: 'scanner.curl_external_url',
    severity: 'error',
    message: 'Line uses curl or wget against an external URL; skills must not fetch arbitrary content at runtime.',
    test: (line) => /\b(curl|wget)\b/.test(line.lower) && HTTP_URL_RE.test(line.lower),
  },
  {
    code: 'scanner.external_fetch',
    severity: 'error',
    message: 'Line uses a network-fetch helper with an external URL.',
    test: (line) =>
      FETCH_WITH_URL_RE.test(line.lower) &&
      HTTP_URL_RE.test(line.lower) &&
      !/\b(curl|wget)\b/.test(line.lower),
  },
  {
    code: 'scanner.secret_exfiltration',
    severity: 'error',
    message: 'Line references credentials or tokens together with a URL; this looks like exfiltration.',
    test: (line) => CREDENTIAL_RE.test(line.lower) && HTTP_URL_RE.test(line.lower),
  },
  {
    code: 'scanner.encoded_eval',
    severity: 'error',
    message: 'Line combines base64/decode with exec/eval/system/shell; this looks like obfuscated code execution.',
    test: (line) =>
      /\b(base64|atob|btoa|decode)\b/.test(line.lower) &&
      /\b(exec|eval|system|shell)\b/.test(line.lower),
  },
  {
    code: 'scanner.rm_rf_absolute',
    severity: 'error',
    message: 'Line uses "rm -rf" against an absolute path.',
    test: (line) => /\brm\s+-rf?\s+\//.test(line.lower) || /\brm\s+-rf?\s+["']\//.test(line.lower),
  },
  {
    code: 'scanner.script_tag',
    severity: 'error',
    message: 'Line contains a <script> tag.',
    test: (line) => /<script\b/.test(line.lower),
  },
  {
    code: 'scanner.prompt_instruction_override',
    severity: 'error',
    message: 'Line appears to tell an agent to ignore or override higher-priority instructions.',
    test: (line) => PROMPT_INSTRUCTION_OVERRIDE_RE.test(line.lower),
  },
  {
    code: 'scanner.prompt_roleplay_escalation',
    severity: 'error',
    message: 'Line appears to roleplay a higher-privilege or unrestricted agent identity.',
    test: (line) => PROMPT_ROLEPLAY_RE.test(line.lower),
  },
  {
    code: 'scanner.fake_role_marker',
    severity: 'error',
    message: 'Line contains fake chat or system role markers that can confuse agent instruction boundaries.',
    test: (line) => FAKE_ROLE_MARKER_RE.test(line.lower) || ROLE_PREFIX_RE.test(line.normalized),
  },
  {
    code: 'scanner.sensitive_file_reference',
    severity: 'error',
    message: 'Line references sensitive local credential paths or token commands.',
    test: (line) => SENSITIVE_PATH_RE.test(line.lower),
  },
  {
    code: 'scanner.exfiltration_endpoint',
    severity: 'error',
    message: 'Line references an endpoint commonly used for exfiltration or unreviewed callbacks.',
    test: (line) => EXFIL_ENDPOINT_RE.test(line.lower),
  },
  {
    code: 'scanner.safety_bypass',
    severity: 'error',
    message: 'Line asks the agent to bypass user confirmation or auto-accept risky actions.',
    test: (line) => DISABLE_SAFETY_RE.test(line.lower) || YES_WITH_DESTRUCTIVE_RE.test(line.lower),
  },
  {
    code: 'scanner.url_to_ip',
    severity: 'warning',
    message: 'URL points at a raw IP address rather than a hostname.',
    test: (line) => /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/.test(line.lower),
  },
];

function snippetOf(line: string): string {
  const visible = line
    .replace(ZERO_WIDTH_RE, '[zero-width]')
    .replace(BIDI_CONTROL_RE, '[bidi-control]')
    .replace(UNICODE_TAG_RE, '[unicode-tag]');
  return visible.length > 100 ? visible.slice(0, 100) : visible;
}

function normalizeLine(line: string): NormalizedLine {
  const normalized = line.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');
  return {
    original: line,
    normalized,
    lower: normalized.toLowerCase(),
  };
}

// Scans every line of the body, including content inside fenced code blocks.
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
    const normalizedLine = normalizeLine(line);
    for (const rule of RULES) {
      if (rule.test(normalizedLine)) {
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
