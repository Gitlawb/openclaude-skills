---
name: error-message-decode
title: Error Message Decode
description: Decodes cryptic error messages, stack traces, and panics into actual causes and fix paths.
category: debugging
tags:
  - errors
  - debugging
  - troubleshooting
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Error Message Decode

The user has pasted an error and wants to know what it means and how to
fix it. Read the message literally, find the frame that touches their
code, name the cause, and propose the smallest fix.

## Use this skill when

- The user pastes an error message, stack trace, panic, or segfault and
  asks what's wrong.
- The user says "I got this error" and shows terminal output.
- The user shares browser console output, a server log line, or a
  build-tool failure paste.
- The user asks "why is this failing" with the error text visible in
  the message.

## Do NOT use this skill when

- The user has no specific error text to show — behavioural bugs
  ("the page is blank", "the number is wrong") go to `debugging`.
- The user wants to **write** better error messages in their own
  code. Use a coding skill.
- The error is a CI pipeline failure (lockfile drift, runner OOM,
  failed deploy). Use `ci-fix`.
- The error is a CodeQL / Semgrep / Snyk Code finding. Use
  `codeql-fix`.

## Procedure

1. **Identify the language and error type** from signatures in the
   paste:
   - Python: `Traceback (most recent call last):` and the
     `ExceptionType: message` line at the end.
   - JavaScript/TypeScript: `TypeError` / `ReferenceError` /
     `SyntaxError` plus `at functionName (file:line:col)` frames.
   - Rust: `thread '<name>' panicked at` plus a backtrace.
   - Go: `panic:` followed by a goroutine dump.
   - C/C++: a segfault address, `Segmentation fault`, or
     `core dumped`.
   - Java/Kotlin: `Exception in thread "..."` plus `at
     pkg.Class.method(File.java:line)`.
   Also classify: **compile-time** (build won't start),
   **runtime** (program crashed), or **build-tool** (esbuild,
   webpack, cargo, gradle complaining).
2. **Find the frame that touches the user's code.** Skip framework
   frames (`node_modules/`, `site-packages/`, `org.springframework`,
   `java.lang`) and walk up until the next frame is in the
   project's source tree. That is almost always the line that
   needs to change. The top of the stack is usually a generic
   helper; the bottom is usually OS internals.
3. **Read the message literally before interpreting.** A
   surprising number of cryptic errors are clear if you say the
   words out loud. `expected 2 positional arguments, got 1` means
   exactly that — a call site is missing an argument. Don't jump
   to "maybe it's a circular import" if the literal reading
   identifies the problem.
4. **Apply known decode patterns** for messages that are common
   and not literal:
   - `Cannot read property X of undefined` (JS) → the *parent*
     became undefined somewhere upstream. Trace back to where it
     should have been set.
   - `'NoneType' object has no attribute X` (Python) → same shape:
     a value upstream was `None` when the caller expected an
     object.
   - `ECONNREFUSED 127.0.0.1:5432` → the service isn't listening
     on that port. Confirm with `pg_isready -h 127.0.0.1 -p 5432`
     for Postgres, or `nc -vz 127.0.0.1 5432` generically.
   - `EADDRINUSE` → port already in use. Find the holder with
     `lsof -iTCP:<port> -sTCP:LISTEN`.
   - `EACCES` → file/path permissions; show the user `ls -la` on
     the target path.
   - `Maximum call stack size exceeded` / `RecursionError` →
     infinite recursion. Look for missing base case.
   - `no such file or directory` → the **resolved** path is
     missing, not necessarily the literal string. Print the
     actual resolved path before the open call.
   - `Module not found` / `Cannot find module` → check both
     spelling and the resolver (TypeScript `paths`,
     `package.json` `exports`, virtual env activation).
5. **Propose the fix as the smallest diff that addresses the cause,
   not the symptom.** A null check three layers above where the
   value should never have been null is a symptom patch.
6. **If the message has two or three plausible causes**, list
   them ranked by probability with a one-line verification each.
   Don't pick blindly when the paste doesn't disambiguate.

## Examples

In scope: a Python paste ending with `TypeError: unsupported
operand type(s) for +: 'int' and 'str'` and a one-line traceback
pointing at `total = count + label`.

→ The literal message is correct: `count` is `int`, `label` is
`str`. Open the file at the traced line and propose the smallest
fix — either `str(count) + label` if the result should be a
string, or `count + int(label)` if the result should be a number.
Ask which the caller expects if it isn't obvious from context.

In scope: `Error: connect ECONNREFUSED 127.0.0.1:5432` from a
Node process at startup.

→ Decode: Postgres isn't accepting connections on that port.
Confirm with `pg_isready -h 127.0.0.1 -p 5432`. Likely causes
ranked: (a) postgres service isn't running — start it; (b) port
mismatch with `DATABASE_URL` — print the resolved URL; (c)
firewall / container networking — check Docker port mapping.

Out of scope: "my app is slow and I'm not sure why" with no
error text.

→ No error to decode. Hand off to `debugging` for a behavioural
investigation.

## Self-check before responding

- Did I find the frame that touches the user's code, not the top
  of the stack?
- Did I read the error message literally before reaching for an
  interpretation?
- Is my fix the smallest diff that addresses the cause, not a
  defensive layer over the symptom?
- If the message is ambiguous, did I list 2–3 candidates ranked
  by probability with verification steps?
- Did I include at least one concrete command the user can run
  to confirm the diagnosis (`pg_isready`, `lsof`, `ls -la`,
  `echo $VAR`)?
- Did I avoid generic "check your code" advice?
