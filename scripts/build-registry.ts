import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateSkillFolder,
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
  trust: string;
  version: string;
  license: string;
  author?: string;
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
}

export interface BuildRegistryResult {
  entries: RegistryEntry[];
  errors: { folder: string; errors: ValidationError[] }[];
  serialized: string;
}

const DEFAULT_REPO_SLUG = 'Gitlawb/openclaude-skills';

function repoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..');
}

function entryFor(
  name: string,
  result: ValidationResult,
  sha256: string,
  repoSlug: string,
): RegistryEntry {
  const fm = result.parsed!.frontmatter;
  const entry: RegistryEntry = {
    id: `gitlawb/${name}`,
    name: fm.name,
    description: fm.description,
    trust: fm.trust,
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
  return entry;
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

  const folders = await listSkillFolders(skillsDir);
  const entries: RegistryEntry[] = [];
  const errors: { folder: string; errors: ValidationError[] }[] = [];

  for (const name of folders) {
    const folder = path.join(skillsDir, name);
    const result = await validateSkillFolder(folder);
    if (!result.ok || !result.parsed) {
      errors.push({ folder: name, errors: result.errors });
      continue;
    }

    const buf = await fs.readFile(path.join(folder, 'SKILL.md'));
    const sha256 = sha256OfSkillSource(buf);
    entries.push(entryFor(name, result, sha256, repoSlug));
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
