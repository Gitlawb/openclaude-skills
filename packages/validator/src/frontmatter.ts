import yaml from 'js-yaml';
import { SPDX_IDS } from './spdx-ids.js';
import {
  APPROVED_CATEGORIES,
  TRUST_TIERS,
  type Category,
  type ParsedFrontmatter,
  type TrustTier,
  type ValidationError,
  type ValidationWarning,
} from './types.js';

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const TAG_RE = /^[a-z0-9][a-z0-9-]*$/;
const AUTHOR_RE = /^[a-zA-Z0-9-]+$/;
// Inline semver — accepts MAJOR.MINOR.PATCH with optional pre-release/build suffix.
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

const KNOWN_FIELDS = new Set([
  'name',
  'description',
  'trust',
  'version',
  'license',
  'title',
  'category',
  'tags',
  'author',
  'compatibility',
]);

export interface FrontmatterParseResult {
  parsed?: ParsedFrontmatter;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Extracts the leading YAML frontmatter block from a SKILL.md and returns
 * the YAML text plus the remaining body. Returns `null` if no frontmatter
 * block is present.
 */
export function splitFrontmatter(content: string): { yamlText: string; body: string } | null {
  // Normalize line endings for the split only — we keep the original body.
  const normalized = content.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n') && normalized !== '---' && !normalized.startsWith('---\r')) {
    return null;
  }
  const after = normalized.slice(4);
  const end = after.indexOf('\n---');
  if (end === -1) return null;
  const yamlText = after.slice(0, end);
  let body = after.slice(end + 4);
  if (body.startsWith('\n')) body = body.slice(1);
  return { yamlText, body };
}

function err(code: string, message: string, field?: string): ValidationError {
  return field ? { code, message, field } : { code, message };
}

function warn(code: string, message: string, field?: string): ValidationWarning {
  return field ? { code, message, field } : { code, message };
}

export function parseFrontmatter(yamlText: string): FrontmatterParseResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  let raw: unknown;
  try {
    raw = yaml.load(yamlText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(err('frontmatter.yaml_parse', `Frontmatter is not valid YAML: ${msg}`));
    return { errors, warnings };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push(err('frontmatter.not_object', 'Frontmatter must be a YAML mapping.'));
    return { errors, warnings };
  }

  const fm = raw as Record<string, unknown>;

  // name
  const name = fm.name;
  if (typeof name !== 'string' || name.length === 0) {
    errors.push(err('frontmatter.missing_name', 'Missing required field "name".', 'name'));
  } else if (!NAME_RE.test(name)) {
    errors.push(
      err(
        'frontmatter.invalid_name',
        `Field "name" must match ${NAME_RE} (lowercase letters, digits, hyphens; cannot start with a hyphen). Got: ${JSON.stringify(name)}`,
        'name',
      ),
    );
  }

  // description
  const description = fm.description;
  if (typeof description !== 'string' || description.length === 0) {
    errors.push(
      err('frontmatter.missing_description', 'Missing required field "description".', 'description'),
    );
  } else if (description.length > 200) {
    errors.push(
      err(
        'frontmatter.description_too_long',
        `Field "description" must be <= 200 characters (got ${description.length}).`,
        'description',
      ),
    );
  }

  // trust
  const trust = fm.trust;
  if (typeof trust !== 'string') {
    errors.push(err('frontmatter.missing_trust', 'Missing required field "trust".', 'trust'));
  } else if (!TRUST_TIERS.includes(trust as TrustTier)) {
    errors.push(
      err(
        'frontmatter.invalid_trust',
        `Field "trust" must be one of ${TRUST_TIERS.join(', ')}. Got: ${JSON.stringify(trust)}`,
        'trust',
      ),
    );
  }

  // version
  const version = fm.version;
  if (typeof version !== 'string') {
    errors.push(err('frontmatter.missing_version', 'Missing required field "version".', 'version'));
  } else if (!SEMVER_RE.test(version)) {
    errors.push(
      err(
        'frontmatter.invalid_version',
        `Field "version" must be valid semver (e.g. 0.1.0). Got: ${JSON.stringify(version)}`,
        'version',
      ),
    );
  }

  // license
  const license = fm.license;
  if (typeof license !== 'string') {
    errors.push(err('frontmatter.missing_license', 'Missing required field "license".', 'license'));
  } else if (!SPDX_IDS.has(license)) {
    errors.push(
      err(
        'frontmatter.invalid_license',
        `Field "license" must be an OSI-approved SPDX identifier. Got: ${JSON.stringify(license)}`,
        'license',
      ),
    );
  }

  // category (optional)
  if (fm.category !== undefined) {
    if (typeof fm.category !== 'string' || !APPROVED_CATEGORIES.includes(fm.category as Category)) {
      errors.push(
        err(
          'frontmatter.invalid_category',
          `Field "category" must be one of: ${APPROVED_CATEGORIES.join(', ')}. Got: ${JSON.stringify(fm.category)}`,
          'category',
        ),
      );
    }
  }

  // tags (optional)
  if (fm.tags !== undefined) {
    if (!Array.isArray(fm.tags)) {
      errors.push(err('frontmatter.invalid_tags', 'Field "tags" must be a list of strings.', 'tags'));
    } else {
      for (const tag of fm.tags) {
        if (typeof tag !== 'string' || !TAG_RE.test(tag)) {
          errors.push(
            err(
              'frontmatter.invalid_tag',
              `Each tag must match ${TAG_RE}. Got: ${JSON.stringify(tag)}`,
              'tags',
            ),
          );
        }
      }
    }
  }

  // title (optional)
  if (fm.title !== undefined) {
    if (typeof fm.title !== 'string' || fm.title.length === 0) {
      errors.push(err('frontmatter.invalid_title', 'Field "title" must be a non-empty string.', 'title'));
    } else if (fm.title.length > 80) {
      errors.push(
        err(
          'frontmatter.title_too_long',
          `Field "title" must be <= 80 characters (got ${fm.title.length}).`,
          'title',
        ),
      );
    }
  }

  // author (optional)
  if (fm.author !== undefined) {
    if (typeof fm.author !== 'string' || !AUTHOR_RE.test(fm.author)) {
      errors.push(
        err(
          'frontmatter.invalid_author',
          `Field "author" must match ${AUTHOR_RE}. Got: ${JSON.stringify(fm.author)}`,
          'author',
        ),
      );
    }
  }

  // compatibility (optional)
  if (fm.compatibility !== undefined) {
    if (typeof fm.compatibility !== 'object' || fm.compatibility === null || Array.isArray(fm.compatibility)) {
      errors.push(
        err(
          'frontmatter.invalid_compatibility',
          'Field "compatibility" must be an object.',
          'compatibility',
        ),
      );
    }
  }

  // Unknown fields → warning
  for (const key of Object.keys(fm)) {
    if (!KNOWN_FIELDS.has(key)) {
      warnings.push(
        warn(
          'frontmatter.unknown_field',
          `Unknown frontmatter field "${key}" — will be ignored by tooling.`,
          key,
        ),
      );
    }
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }

  return {
    parsed: fm as ParsedFrontmatter,
    errors,
    warnings,
  };
}
