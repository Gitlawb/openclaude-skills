import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateSkillFolder,
  TRUST_TIERS,
  type TrustTier,
  type ValidationError,
  type ValidationResult,
} from '@gitlawb/skill-validator';

export interface RegistryEntry {
  id: string;
  name: string;
  title?: string;
  description: string;
  category?: string;
  tags?: string[];
  trust: TrustTier;
  version: string;
  license: string;
  author?: string;
  tools_required?: string[];
  min_openclaude_version?: string;
  source: string;
  repo: string;
  path: string;
  homepage: string;
  sha256: string;
}

export interface BuildRegistryOptions {
  /** Directory containing one folder per skill. Defaults to `<repo>/skills`. */
  skillsDir?: string;
  /** Output path for registry.json. Defaults to `<repo>/registry.json`. */
  outputPath?: string;
  /** When true, do not write to disk. Useful for tests. */
  dryRun?: boolean;
  /** Owner/repo segment of the raw and homepage URLs. */
  repoSlug?: string;
  /** Maintainer-owned trust promotion policy. Defaults to `<repo>/.maintainers/trust.json`. */
  trustPolicyPath?: string;
}

export interface BuildRegistryResult {
  entries: RegistryEntry[];
  errors: { folder: string; errors: ValidationError[] }[];
  serialized: string;
}

const DEFAULT_REPO_SLUG = 'Gitlawb/openclaude-skills';
const TRUST_POLICY_KEY_RE = /^gitlawb\/[a-z0-9][a-z0-9-]*@[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

interface TrustPolicyEntry {
  trust: TrustTier;
  reviewedBy?: string[];
  reason?: string;
}

type TrustPolicy = Record<string, TrustPolicyEntry>;

function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}

function entryFor(
  name: string,
  result: ValidationResult,
  sha256: string,
  repoSlug: string,
  trust: TrustTier,
): RegistryEntry {
  const fm = result.parsed!.frontmatter;
  const entry: RegistryEntry = {
    id: `gitlawb/${name}`,
    name: fm.name,
    description: fm.description,
    trust,
    version: fm.version,
    license: fm.license,
    source: `https://raw.githubusercontent.com/${repoSlug}/main/skills/${name}/SKILL.md`,
    repo: `https://github.com/${repoSlug}`,
    path: `skills/${name}/SKILL.md`,
    homepage: `https://github.com/${repoSlug}/tree/main/skills/${name}`,
    sha256,
  };
  if (fm.title) entry.title = fm.title;
  if (fm.category) entry.category = fm.category;
  if (fm.tags && fm.tags.length > 0) entry.tags = [...fm.tags];
  if (fm.author) entry.author = fm.author;
  if (fm.tools_required && fm.tools_required.length > 0) entry.tools_required = [...fm.tools_required];
  if (fm.min_openclaude_version) entry.min_openclaude_version = fm.min_openclaude_version;
  return entry;
}

async function loadTrustPolicy(policyPath: string): Promise<{ policy: TrustPolicy; errors: ValidationError[] }> {
  let text: string;
  try {
    text = await fs.readFile(policyPath, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return { policy: {}, errors: [] };
    return {
      policy: {},
      errors: [{ code: 'registry.trust_policy_unreadable', message: `Could not read trust policy: ${String(e)}` }],
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return {
      policy: {},
      errors: [{ code: 'registry.trust_policy_json', message: `Trust policy is not valid JSON: ${String(e)}` }],
    };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      policy: {},
      errors: [{ code: 'registry.trust_policy_shape', message: 'Trust policy must be a JSON object.' }],
    };
  }

  const policy: TrustPolicy = {};
  const errors: ValidationError[] = [];
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!TRUST_POLICY_KEY_RE.test(key)) {
      errors.push({
        code: 'registry.trust_policy_invalid_key',
        message: `Trust policy key ${JSON.stringify(key)} must look like gitlawb/<skill-name>@<semver>.`,
      });
      continue;
    }

    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      errors.push({
        code: 'registry.trust_policy_entry_shape',
        message: `Trust policy entry ${JSON.stringify(key)} must be an object.`,
      });
      continue;
    }

    const entry = value as Record<string, unknown>;
    if (typeof entry.trust !== 'string' || !TRUST_TIERS.includes(entry.trust as TrustTier)) {
      errors.push({
        code: 'registry.trust_policy_invalid_tier',
        message: `Trust policy entry ${JSON.stringify(key)} must use one of: ${TRUST_TIERS.join(', ')}.`,
      });
      continue;
    }

    if (entry.reviewedBy !== undefined) {
      if (!Array.isArray(entry.reviewedBy) || entry.reviewedBy.some((reviewer) => typeof reviewer !== 'string')) {
        errors.push({
          code: 'registry.trust_policy_invalid_reviewers',
          message: `Trust policy entry ${JSON.stringify(key)} reviewedBy must be a list of strings.`,
        });
        continue;
      }
    }

    if (entry.reason !== undefined && typeof entry.reason !== 'string') {
      errors.push({
        code: 'registry.trust_policy_invalid_reason',
        message: `Trust policy entry ${JSON.stringify(key)} reason must be a string.`,
      });
      continue;
    }

    policy[key] = {
      trust: entry.trust as TrustTier,
      reviewedBy: entry.reviewedBy as string[] | undefined,
      reason: typeof entry.reason === 'string' ? entry.reason : undefined,
    };
  }

  return { policy, errors };
}

function trustPolicyKey(name: string, version: string): string {
  return `gitlawb/${name}@${version}`;
}

function resolveTrust(
  name: string,
  result: ValidationResult,
  policy: TrustPolicy,
  usedPolicyKeys: Set<string>,
): { trust: TrustTier; errors: ValidationError[] } {
  const fm = result.parsed!.frontmatter;
  const key = trustPolicyKey(fm.name, fm.version);
  const policyEntry = policy[key];
  const errors: ValidationError[] = [];

  if (!policyEntry) {
    if (fm.trust !== 'community') {
      errors.push({
        code: 'registry.trust_policy_required',
        message: `Skill ${JSON.stringify(name)} declares trust ${JSON.stringify(fm.trust)}, but non-community trust requires .maintainers/trust.json entry ${JSON.stringify(key)}.`,
        field: 'trust',
      });
    }
    return { trust: 'community', errors };
  }

  usedPolicyKeys.add(key);
  if (policyEntry.trust !== fm.trust) {
    errors.push({
      code: 'registry.trust_policy_mismatch',
      message: `Skill ${JSON.stringify(name)} declares trust ${JSON.stringify(fm.trust)}, but trust policy ${JSON.stringify(key)} grants ${JSON.stringify(policyEntry.trust)}.`,
      field: 'trust',
    });
  }

  return { trust: policyEntry.trust, errors };
}

async function listSkillFolders(skillsDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(skillsDir, { withFileTypes: true });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw e;
  }
  return entries
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .sort();
}

export function sha256OfBuffer(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

// Hash the file's LF-normalized bytes so a Windows checkout with
// core.autocrlf=true produces the same digest as a Linux/macOS one. The
// content of registry.json must depend only on the skill, not the
// platform that built it.
export function sha256OfSkillSource(buf: Buffer): string {
  const normalized = buf.toString('utf8').replace(/\r\n/g, '\n');
  return createHash('sha256').update(normalized, 'utf8').digest('hex');
}

export async function buildRegistry(options: BuildRegistryOptions = {}): Promise<BuildRegistryResult> {
  const root = repoRoot();
  const skillsDir = options.skillsDir ?? path.join(root, 'skills');
  const outputPath = options.outputPath ?? path.join(root, 'registry.json');
  const repoSlug = options.repoSlug ?? DEFAULT_REPO_SLUG;
  const trustPolicyPath = options.trustPolicyPath ?? path.join(root, '.maintainers', 'trust.json');

  const folders = await listSkillFolders(skillsDir);
  const entries: RegistryEntry[] = [];
  const errors: { folder: string; errors: ValidationError[] }[] = [];
  const { policy: trustPolicy, errors: trustPolicyErrors } = await loadTrustPolicy(trustPolicyPath);
  if (trustPolicyErrors.length > 0) {
    errors.push({ folder: path.relative(root, trustPolicyPath) || trustPolicyPath, errors: trustPolicyErrors });
  }
  const usedPolicyKeys = new Set<string>();

  for (const name of folders) {
    const folder = path.join(skillsDir, name);
    const result = await validateSkillFolder(folder);
    if (!result.ok || !result.parsed) {
      if (result.parsed) {
        usedPolicyKeys.add(trustPolicyKey(result.parsed.frontmatter.name, result.parsed.frontmatter.version));
      }
      errors.push({ folder: name, errors: result.errors });
      continue;
    }

    const trust = resolveTrust(name, result, trustPolicy, usedPolicyKeys);
    if (trust.errors.length > 0) {
      errors.push({ folder: name, errors: trust.errors });
      continue;
    }

    const buf = await fs.readFile(path.join(folder, 'SKILL.md'));
    const sha256 = sha256OfSkillSource(buf);
    entries.push(entryFor(name, result, sha256, repoSlug, trust.trust));
  }

  for (const key of Object.keys(trustPolicy).sort()) {
    if (!usedPolicyKeys.has(key)) {
      errors.push({
        folder: path.relative(root, trustPolicyPath) || trustPolicyPath,
        errors: [
          {
            code: 'registry.trust_policy_stale',
            message: `Trust policy entry ${JSON.stringify(key)} does not match any current skill name/version.`,
          },
        ],
      });
    }
  }

  entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const serialized = JSON.stringify(entries, null, 2) + '\n';

  if (!options.dryRun && errors.length === 0) {
    await fs.writeFile(outputPath, serialized, 'utf8');
  }

  return { entries, errors, serialized };
}

function formatErrors(errors: { folder: string; errors: ValidationError[] }[]): string {
  const lines: string[] = ['Registry build failed — validation errors:\n'];
  for (const { folder, errors: errs } of errors) {
    lines.push(`  skills/${folder}/`);
    for (const e of errs) {
      const where = e.line !== undefined ? ` (line ${e.line})` : '';
      lines.push(`    - [${e.code}]${where} ${e.message}`);
    }
  }
  return lines.join('\n');
}

async function main(): Promise<void> {
  const result = await buildRegistry();
  if (result.errors.length > 0) {
    console.error(formatErrors(result.errors));
    process.exit(1);
  }
  const outputPath = path.join(repoRoot(), 'registry.json');
  console.log(`Wrote ${result.entries.length} skill(s) to ${path.relative(repoRoot(), outputPath)}`);
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
