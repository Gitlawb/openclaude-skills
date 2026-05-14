---
name: vercel-build-fail-decode
title: Vercel Build Fail Decode
description: Reads Vercel build logs, finds the actual error among the noise, and proposes a fix.
category: ci
tags:
  - vercel
  - deployment
  - build
  - nextjs
  - debugging
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Vercel Build Fail Decode

The user has a red deploy on Vercel and a wall of log output. The real
error is somewhere in there but it is not the line with the ✘ — it is
50+ lines above. Scan the log methodically, name the cause, propose the
fix, redeploy.

## Use this skill when

- The user pastes a Vercel build log and asks "why did it fail" or
  "what's wrong here".
- The user says "deploy is broken", "Vercel shows red", or "my build is
  failing on Vercel".
- The build succeeds locally but fails on Vercel (or vice versa).
- The user has an "✘ Error" or "Error: Command failed with exit code 1"
  line they cannot interpret.

## Do NOT use this skill when

- The build succeeds but the deployed app misbehaves at runtime — that
  is a runtime/observability issue, not a build failure.
- The user wants to set up a Vercel project from scratch (different
  scope — onboarding, not debugging).
- The failing build is on GitHub Actions, Netlify, or Cloudflare Pages
  — use a generic CI skill instead. Vercel's log format and error
  conventions are specific.

## Procedure

1. Get the full log. Ask the user to paste the FULL build log, not just
   the last 20 lines. The actual error is often 50-200 lines above the
   final `✘` or `Error: Command failed`. The Vercel dashboard URL has a
   "View Full Build Logs" button — that is what you want.

2. Scan the log for these patterns, in this order. Stop at the first
   actionable match.

   - Lines starting with `Error:` (capital E, colon, space) — these
     are the actual TypeScript / Webpack / Next.js errors.
   - `Module not found: Can't resolve '<name>'` — a missing import or
     wrong path.
   - `Type error: <message>` followed by a `<file>:<line>:<col>` — a
     TypeScript failure that `next dev` skipped but `next build`
     enforces.
   - `Failed to compile.` — Next.js's banner; the next 5-15 lines name
     the file and the cause.
   - `JavaScript heap out of memory` or `FATAL ERROR: ... Allocation
     failed - JavaScript heap out of memory` — bundle is too big or
     there is a build-time loop.
   - `Error: ENOENT: no such file or directory` — a path that exists on
     your machine but not in the Vercel build container (case
     sensitivity or untracked file).

3. Common error patterns and their fixes:

   **"Module not found: Can't resolve 'X'"**
   - Package listed in `package.json` but missing from the lockfile:
     run `bun install` / `npm install` locally and commit the lockfile.
   - Path alias broken: check `tsconfig.json`'s `paths` block matches
     the import. Vercel reads `tsconfig.json` for path aliases without
     extra config since 2023.
   - Case mismatch: the file is `Button.tsx` but the import says
     `./button`. macOS is case-insensitive, the Vercel Linux
     container is not. Rename the import to match the file exactly.

   **"Type error: ... is not assignable to type ..."**
   - `next dev` skips typecheck; `next build` runs it. So a type error
     can sit in your code for weeks until the first production deploy.
   - Fix the type properly. Resist `// @ts-ignore` — it hides future
     errors too. If you must suppress, use `// @ts-expect-error <reason>`
     so TypeScript will fail loudly the day the underlying issue is
     fixed.

   **"ReferenceError: <X> is not defined" during build / "Error:
   Environment variable <X> is not defined"**
   - A `process.env.X` is being read at module top-level or in a
     server component during build, but the env var is missing from
     the Vercel project settings.
   - Fix: open Vercel → Project → Settings → Environment Variables,
     add `X` for the right environment (Production / Preview /
     Development), then redeploy. Do not commit `.env.production`.

   **"Failed to compile" with a `pages/` or `app/` file pointed at**
   - Open the named file. Common causes: a `page.tsx` that exports a
     non-component (e.g. a data function as `default`), or a
     client-only API (`window`, `localStorage`) used in a Server
     Component without `'use client'`.

   **"Build optimization failed: found page without React Component
   as default export"**
   - A `page.tsx` / `layout.tsx` `export default` is not returning JSX
     (or is a `Promise` returning a non-component). Make it a function
     component that returns JSX.

   **"Error: Page ... is missing exported function 'generateStaticParams'"**
   - Dynamic route with `export const dynamic = 'force-static'` but no
     `generateStaticParams`. Either add it, or switch to
     `dynamic = 'force-dynamic'`.

   **"Function Size exceeds 50 MB" / "The Serverless Function exceeds
   the maximum size limit"**
   - A serverless function bundled too much. Move a heavy `import`
     behind a dynamic `await import('...')` inside the handler, or
     switch the route to the Edge runtime (`export const runtime =
     'edge'`) if the dependency supports it.

   **"JavaScript heap out of memory" / build exceeds 45 minutes**
   - Usually circular imports or excessive TypeScript instantiations.
     Reproduce locally with `next build` — if it hangs, narrow with
     `bun x tsc --noEmit` to isolate the type-checker hang.
   - As a temporary unblock, bump memory in `package.json`:
     `"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"`.
     This treats the symptom; still find the root cause.

   **"ENOENT: no such file or directory"**
   - The file exists locally but is gitignored or never tracked. Run
     `git ls-files | grep <file>` — if empty, `git add` it.

4. Verify the fix with a redeploy. Push to the branch Vercel is
   watching:

   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push
   ```

   Watch the build log live in the Vercel dashboard, or stream it from
   the CLI: `vercel logs --follow <deployment-url>`.

5. If multiple errors stack in the log, fix them in REVERSE log order.
   The earliest error usually cascades into the later ones; fixing the
   first one often makes the rest disappear.

## Examples

In scope: User pastes a 500-line Vercel build log ending in
`Error: Command failed with exit code 1`.

→ Scroll up. Find the first `Error:` or `Type error:`. Read 10 lines
of surrounding context. Identify which pattern from step 3 matches.
Propose the smallest fix with a file:line reference. Tell the user how
to redeploy.

In scope: "Build works locally but fails on Vercel with
'Module not found: Can't resolve ./button'."

→ Case sensitivity. The file is almost certainly `Button.tsx`. Rename
the import to `./Button` (or rename the file to `button.tsx` and
update all imports). Confirm with `git ls-files | grep -i button`.

In scope: "Vercel build hangs and times out after 45 minutes."

→ Reproduce locally with `next build`. If it hangs, the cause is
local. Narrow with `bun x tsc --noEmit` to isolate type-checker hangs
from bundler hangs.

Out of scope: "My deployed Next.js site is slow to load."

→ Runtime performance, not a build failure. Different debugging path
(observability / web vitals).

Out of scope: "How do I set up a custom domain on Vercel."

→ Configuration, not a build error. Point at Vercel docs.

## Self-check before responding

- Did I ask for the FULL build log, not just the last few lines?
- Did I scan for `Error:` and `Type error:` specifically, instead of
  reading top to bottom?
- Did I check the high-frequency causes first — missing env var, case
  sensitivity, stale lockfile — before exotic ones?
- Did I propose the SMALLEST fix? (Not "rewrite to App Router" when a
  one-line import change works.)
- If multiple errors stacked, did I tell the user to fix them in
  reverse log order?
- Did I include the empty-commit redeploy trick to verify the fix?
- Did I avoid recommending `// @ts-ignore` as a default? (Only
  `// @ts-expect-error <reason>` if suppression is unavoidable.)
- Did I distinguish build-time errors from runtime errors and refuse to
  diagnose runtime issues here?
