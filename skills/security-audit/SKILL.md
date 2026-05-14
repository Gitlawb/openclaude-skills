---
name: security-audit
title: Security Audit
description: Reviews code changes for common security risks.
category: security
tags:
  - security
  - audit
  - review
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Security Audit

Review a diff, file, or codebase area through a security lens. Look for
classes of bugs that have specific, well-understood exploits, not for
vague "could be more secure" comments.

## Use this skill when

- The user asks for a security review, security audit, or threat check.
- The user wants to know whether a change has security implications
  before merging.
- The user pastes code involving auth, user input parsing, file uploads,
  network calls, deserialization, or secret handling and asks "is this
  safe?".
- The user pastes a security alert (Dependabot, Snyk, CodeQL) and asks
  whether it applies to their usage.

## Do NOT use this skill when

- The user wants to write a new authentication or authorization flow from
  scratch. This skill audits existing code; it does not design auth.
- The user wants a general code review without a security focus.
  Use `pr-review`.
- The user is asking about red-team techniques, exploitation steps, or
  how to attack a system they do not own. Decline and explain.

## Procedure

1. Identify the trust boundaries. Note where data crosses from
   untrusted (user input, network, file uploads, env-controlled values)
   into trusted contexts (DB queries, shell commands, template renders,
   redirects). Most security bugs live at boundaries.
2. Walk the changes against each of the following categories. Skip a
   category only if it is genuinely irrelevant — explain why.
   - **Injection**: SQL (concatenation vs parameterization), command
     injection (shell metacharacters in `exec`/`spawn`), template
     injection (user data into Jinja/EJS without escaping), LDAP/XPath
     injection, NoSQL injection (operator passthrough).
   - **Auth and authz**: missing checks on new endpoints, IDOR
     (object IDs trusted from the URL without ownership check),
     privilege escalation through admin flags settable by the client,
     missing rate limits on sensitive operations.
   - **Secret handling**: secrets in logs, secrets in error responses,
     secrets in client-side bundles, secrets committed to the repo,
     secrets passed as command-line args (visible in `ps`).
   - **Unsafe file ops**: path traversal (`../`), zip-slip, symlink
     attacks, writes to user-controlled paths, reads of arbitrary
     server-side files.
   - **Unsafe network ops**: SSRF (user-controlled URLs fetched
     server-side), open redirects (user-controlled redirect targets),
     CORS misconfiguration, missing TLS verification.
   - **Deserialization**: pickle/yaml.load/Java serialization on
     untrusted input, JSON parsing with `__proto__` (prototype
     pollution), unsafe schema-less object spreads.
   - **XXE / SSRF in parsers**: XML parsers with external entity
     resolution enabled, SVG uploads rendered server-side, image
     processors fed user input without limits.
   - **Dependency risks**: newly added or upgraded dependencies — check
     advisories, check the actual functions called against the CVE
     description (most CVEs are not exploitable in every usage).
3. For each finding, write down: the input that triggers it, the path
   from input to the dangerous sink, the impact (data exposure, RCE,
   account takeover, denial of service), and a concrete fix.
4. Distinguish severity:
   - **Critical** — RCE, auth bypass, data exposure of secrets or PII
     at scale.
   - **High** — privilege escalation, exploitable injection, SSRF that
     reaches internal services.
   - **Medium** — IDOR with limited scope, misconfig that requires
     other bugs to chain, missing rate limit.
   - **Low** — defense-in-depth hardening, informational.
5. Do not flag theoretical issues without a path to exploitation. If
   you cannot describe the input that triggers the bug, you do not
   have a finding — you have a hunch.
6. When in doubt, check the framework's defaults. Many "looks unsafe"
   patterns are actually protected by the framework (ORM
   parameterization, template auto-escaping, secure-by-default cookie
   flags). A finding that the framework already mitigates is noise.
7. For each finding, also note whether mitigations already exist
   (WAF rules, schema constraints, downstream validation). A bug
   that is mitigated three layers deeper is still a bug, but its
   severity is usually lower.

## Examples

In scope: "Audit this new file-upload endpoint."

→ Trace the request path. Note that the filename is taken from the
multipart form and concatenated into a path passed to `fs.writeFile`
without normalization (`finding: path traversal at upload.ts:42`).
Note that there is no size limit and no content-type check
(`finding: DoS via large uploads at upload.ts:30`). Suggest
fixes: validate filename against a charset, write to a controlled
directory using only a server-generated name, enforce a size limit
upstream of the body parser.

In scope: "Dependabot says `marked@4.x` has a ReDoS — do we use it?"

→ Search the repo for `marked` usage. If the only use is rendering
trusted markdown from a fixed source (e.g., bundled docs), the
advisory does not apply. If it parses user-supplied markdown, the
advisory applies — upgrade and add a regex-runtime safeguard.

In scope: "Is this regex safe for user input?"

→ Check for catastrophic backtracking patterns (nested
quantifiers like `(a+)+`, alternation with overlapping branches).
If the input is unbounded, recommend a length cap upstream, a
non-backtracking engine, or a rewrite to a linear pattern.

Out of scope: "Build a secure password reset flow."

→ This skill audits existing flows; it does not design new ones.
Suggest a coding skill plus an audit of the result.

Out of scope: "Find me a way to bypass the auth on this API."

→ Decline. This skill defends; it does not produce exploitation
recipes for systems the user does not clearly own and is not
auditing in good faith.

## Self-check before responding

- Did I anchor every finding to a specific `file:line`?
- Can I describe the exact input that triggers each finding?
- Did I distinguish exploitable bugs from defense-in-depth hardening?
- Did I assign a severity?
- Did I propose a concrete fix, not "consider sanitizing input"?
- Did I check the new code for new trust boundaries, not just the
  diff hunks?
- Did I avoid flagging things that look risky but are demonstrably
  safe in this codebase (e.g., constants concatenated into SQL)?
- Did I keep red-team / exploitation detail to the minimum needed to
  describe the bug?
- Did I note any existing mitigations and reflect them in severity?
- Did I check whether each finding is actually reachable from a real
  request path, not just "in theory"?
