---
name: regex-craft
title: Regex Craft
description: Writes regex patterns from natural-language descriptions, with test cases and pitfall warnings.
category: general
tags:
  - regex
  - parsing
  - patterns
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Regex Craft

Turn a description of what to match into a regex that's right for the
user's engine, comes with test cases that prove it works, and flags the
ways it can bite. When regex is the wrong tool, say so and point at a
parser instead.

## Use this skill when

- The user describes a pattern they want to match in plain language.
- The user pastes a regex that isn't doing what they expect and
  asks why.
- The user asks to extract structured fragments from text.
- The user asks "what's the regex for X".
- The user pastes a regex and asks if it's correct.

## Do NOT use this skill when

- The user wants to parse HTML, JSON, YAML, XML, or any other
  recursive / nested format. Regex is the wrong tool — recommend a
  real parser (DOMParser, `JSON.parse`, `js-yaml`).
- The user wants to validate email, URL, or phone numbers. Recommend
  a proper library (`validator.js`, `zod`, RFC-compliant parsers).
  Don't produce a 100-line email regex.
- The pattern is for security input validation. Hand off to
  `security-audit` — regex DoS (catastrophic backtracking) is a real
  attack surface and the review should include that lens.

## Procedure

1. **Identify the regex flavor for the user's environment.** They
   differ in escaping, anchors, lookbehind support, and Unicode
   handling:
   - **JavaScript** (V8 / SpiderMonkey) — PCRE-ish, has lookbehind
     in modern engines, `\d` / `\w` are ASCII unless `u` is set.
   - **Python** `re` / the third-party `regex`.
   - **PCRE** (PHP, many CLI tools).
   - **POSIX**: `grep` uses BRE; `grep -E` / `egrep` use ERE.
     Different metacharacter sets.
   - **Go RE2** — no lookbehind, no backreferences, linear-time
     guarantee. Used by Go's `regexp` and ripgrep by default.
   Ask if the environment isn't obvious. The same pattern doesn't
   port between flavors.
2. **Build the pattern incrementally.** Literals that must always
   appear → character classes for variable parts (`[a-z0-9]`,
   `\d`; prefer explicit `[0-9]` when Unicode is irrelevant) →
   quantifiers (explicit about greedy `*` vs lazy `*?` — lazy
   when matching up to the *next* delimiter) → anchors only where
   needed (`^` / `$` / `\b`) → capture groups only for parts the
   user extracts; non-capturing `(?:...)` otherwise.
3. **Always provide test cases.** A pattern without tests is a
   hypothesis. Produce:
   - Three strings that **must** match.
   - Three strings that **must not** match, including at least
     one **near-miss** — a string that looks like it should match
     but should not. Near-misses catch the common "matches too
     much" bug.
   - One edge case — empty string, a very long input, a Unicode /
     emoji character, or whatever stress applies to the pattern.
4. **Flag pitfalls explicitly.**
   - **Catastrophic backtracking** when the pattern has nested
     quantifiers (`(a+)+`, `(a|a)+`) or shared-prefix
     alternations. Rewrite to remove ambiguity, or recommend an
     RE2-family engine.
   - **Greedy vs lazy** when matching up to a delimiter — show
     both on the test inputs so the user can pick.
   - **Multiline / dotall**: `m` makes `^`/`$` line-boundaried;
     `s` makes `.` match newlines. Most "why isn't it matching"
     bugs are one of these flags being on or off unexpectedly.
   - **Unicode**: `\w` in JavaScript is `[A-Za-z0-9_]`, not "any
     letter". For real-language matching use `\p{L}` / `\p{N}`
     with the `u` flag.
5. **If the pattern would be brittle or unreadable, recommend the
   alternative** (parser, dedicated library, string method) and
   explain why. Telling the user "don't use regex here" is a
   correct answer when it's the right answer.
6. **For readability**, if the final pattern is over ~60 chars,
   either use the engine's extended / verbose mode (Python `re.X`,
   PCRE `(?x)`) with whitespace and comments, or break it into
   labeled sub-patterns assembled in code.

## Examples

In scope: "match version strings like v1.2.3 with optional
pre-release suffix" in a JavaScript codebase.

→ Produce `/^v(\d+)\.(\d+)\.(\d+)(?:-[a-z0-9.]+)?$/i`. Test cases:

- **Match**: `v1.2.3`, `v0.0.1`, `v10.20.30-beta.1`.
- **No match (incl. near-miss)**: `v1.2`, `1.2.3` (missing `v`),
  `v1.2.3.4` (near-miss — extra segment).
- **Edge**: empty string. (Doesn't match — anchors hold.)

Note that the leading `v` is required by the anchor; if the user
wants it optional, change to `/^v?\.../`.

In scope: "this regex isn't matching `2024-01-15`, why?"

→ Read the user's pattern. Common causes by frequency: anchored
to the wrong delimiter (e.g. `\b` failing because of the hyphen),
character class missing the digit range, or `\d` semantics in
the engine (POSIX BRE doesn't support `\d`). Show the literal
fix and confirm with the user's input as a match test case.

Out of scope: "validate this is a real email address."

→ Recommend `validator.js`'s `isEmail` (RFC-aware) or `zod`'s
`.email()`. A regex that comes close enough is hundreds of lines
and still wrong on `user+tag@subdomain.example`.

## Self-check before responding

- Did I confirm the regex flavor (JS / Python / PCRE / POSIX BRE
  vs ERE / RE2) for the user's environment?
- Did I provide three match cases and three no-match cases,
  including at least one near-miss?
- Did I include an edge case (empty, long, Unicode / emoji)?
- For patterns with nested quantifiers or shared-prefix
  alternations, did I flag catastrophic backtracking?
- For "match up to delimiter" patterns, did I clarify greedy vs
  lazy?
- If the right answer is "don't use regex", did I recommend the
  parser / library instead?
- Is the final pattern readable, or did I use extended mode
  with comments when it exceeded ~60 characters?
