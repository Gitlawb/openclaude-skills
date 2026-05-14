export type TrustTier = 'official' | 'verified' | 'community';

export const TRUST_TIERS: readonly TrustTier[] = ['official', 'verified', 'community'] as const;

export const APPROVED_CATEGORIES = [
  'code-review',
  'security',
  'debugging',
  'testing',
  'refactor',
  'release',
  'provider',
  'ci',
  'database',
  'frontend',
  'docs',
  'migration',
  'general',
] as const;

export type Category = (typeof APPROVED_CATEGORIES)[number];

export interface ParsedFrontmatter {
  name: string;
  description: string;
  trust: TrustTier;
  version: string;
  license: string;
  title?: string;
  category?: Category;
  tags?: string[];
  author?: string;
  compatibility?: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface ParsedSkill {
  frontmatter: ParsedFrontmatter;
  body: string;
  rawLength: number;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  line?: number;
  snippet?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  line?: number;
  snippet?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsed?: ParsedSkill;
}
