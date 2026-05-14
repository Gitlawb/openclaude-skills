---
name: codeql-fix
title: CodeQL Fix
description: Reads a CodeQL or static-analysis finding and produces a targeted fix.
category: security
tags:
  - codeql
  - sast
  - security
  - static-analysis
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# CodeQL Fix

A static-analysis tool has flagged a specific data flow. Read the finding,
verify the flow is real, and write the smallest change that closes it at
the right layer. Generic "validate the input" advice is the wrong answer
for most rule classes.

## Use this skill when

- The user pastes a CodeQL alert from GitHub Advanced Security.
- The user pastes a Semgrep, Snyk Code, SonarCloud, or Bandit finding
  and asks how to fix it.
- The user asks why a static-analysis tool flagged a specific
  `file:line`.
- The user thinks a finding is a false positive and asks to confirm or
  suppress it.

## Do NOT use this skill when

- The user wants a general security review of code that has no
  scanner finding attached. Use `security-audit`.
- The user wants to write new secure code from scratch. Use a coding
  skill plus `security-audit` on the result.
- The finding is a dependency CVE (`Dependabot`, `npm audit`,
  `pip-audit`). That is a different workflow — upgrade, pin, or
  apply the advisory's patch.
- The finding is a code-style or quality issue, not a security
  vulnerability.

## Procedure

1. **Read the finding precisely.** Pull out four things:
   - **Rule ID** (e.g. `js/sql-injection`, `py/command-line-injection`,
     `js/xss`). The rule ID determines the right fix class.
   - **Severity** as reported by the tool.
   - **Flagged file:line** of the sink.
   - **Data-flow path**: source → intermediate steps → sink. CodeQL
     usually shows this explicitly; for tools that don't, walk the
     code from the sink backwards.

2. **Triage: real flow or false positive?** Ask in order:
   - Is the **source** actually untrusted? `req.query.id` yes;
     `process.env.NODE_ENV` no.
   - Is the **sink** actually reached with that data, or does an
     intermediate check the scanner missed neutralize it?
   - Does the language/framework already protect this sink (ORM
     parameterization, template auto-escape, prepared statements)?
   If the flow is real, go to step 3. If false positive, jump to
   step 5.

3. **Pick the right fix layer for the rule class.** The fix depends
   on the kind of vulnerability, not on the input:
   - **SQL injection** (`*/sql-injection`) → **parameterized
     queries** (placeholders + bind values). Input validation alone
     is not a fix — escaping is the database driver's job, not the
     application's. `db.query('SELECT * FROM users WHERE id = ?', [id])`,
     not `WHERE id = ${id}` with an "is it an integer?" check
     bolted on.
   - **Command injection** (`*/command-line-injection`) → call the
     process with **array arguments and no shell**:
     `subprocess.run(['git', 'log', branch], shell=False)`. Not a
     regex over the input.
   - **XSS** (`js/xss`, `js/reflected-xss`) → **context-aware output
     encoding** at the sink, or rely on the framework's auto-escape.
     React/Vue/Angular auto-escape by default; `innerHTML` /
     `dangerouslySetInnerHTML` is the actual sink.
   - **Path traversal** (`*/path-injection`) → resolve the path and
     **verify it stays within the allowed base** (`path.resolve(base, input)`
     then assert `startsWith(base + sep)`). Stripping `..` with a
     regex misses encoded variants.
   - **Open redirect** (`*/open-redirect`) → **allowlist** of valid
     destinations, or strip to a path-only redirect. Scheme checks
     alone miss `//evil.com`.
   - **SSRF** (`*/ssrf`, `*/request-forgery`) → resolve the
     hostname and reject private / link-local ranges before the
     request fires; ideally use an allowlist of external hosts.
   - **Unsafe deserialization** (`*/unsafe-deserialization`) → switch
     to a schema-validating parser. `pickle`, `yaml.load`,
     Java native serialization on untrusted input are never the
     answer.

4. **Write the smallest fix that closes the data flow.**
   - Touch only the file the sink lives in, unless the fix is a
     repository-wide pattern (e.g. swapping the DB layer).
   - Do **not** wrap the dangerous call in a broad `try/except`
     just to make the finding go away — that hides the bug
     without fixing it.
   - Add a one-line comment when the reasoning is non-obvious (e.g.
     "parameterized; do not interpolate `id` even if it looks numeric").
   - Re-run the scanner (or describe how to) and confirm the
     finding is gone.

5. **If genuinely a false positive, suppress with justification.**
   - **CodeQL**: `// lgtm[js/sql-injection]` (line comment) with a
     follow-up sentence in the PR explaining *why* the flow is not
     reachable.
   - **Semgrep**: `# nosem: rule-id reason`.
   - **SonarCloud / Sonar**: `// NOSONAR: <reason>`.
   The English reason matters more than the magic comment — a
   suppression without a reason is just noise the next reviewer
   has to re-triage.

## Examples

In scope: a `js/sql-injection` CodeQL alert flagging
`src/api/users.js:42` where `req.query.id` is interpolated into a
template string passed to `db.query()`.

→ Identify rule `js/sql-injection`. Trace source `req.query.id` to
the sink `db.query(\`SELECT … WHERE id = ${userId}\`)`. Real flow.
Fix is parameterized:
```js
const result = await db.query('SELECT * FROM users WHERE id = ?', [req.query.id]);
```
Do not bolt on `Number.isInteger(userId)` instead — type-checking
the input does not close the SQL-injection flow. Other endpoints
calling other tables would still be vulnerable in the same way.

In scope: a finding the user believes is a false positive.

→ Triage step by step. If the "untrusted" source is actually a
constant or a value already validated upstream by a known
schema, suppress with a line comment that names the upstream
validator and the rule ID.

Out of scope: "audit my codebase for SQL injection."

→ No specific finding attached. Use `security-audit`.

## Self-check before responding

- Did I name the exact rule ID?
- Did I trace the source → sink path, not just describe the
  symptom?
- For SQL injection specifically: am I proposing **parameterized
  queries**, not input sanitization or string escaping?
- Is my fix the smallest diff that closes the data flow?
- Did I avoid wrapping the call in a broad `try/except` just to
  silence the finding?
- If suppressing, did I write the English reason next to the
  magic comment?
- Did I describe how to re-run the scanner to confirm the
  finding is gone?
