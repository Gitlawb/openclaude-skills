---
name: nextjs-hydration-fix
title: Next.js Hydration Fix
description: Diagnoses Next.js hydration mismatches and proposes the smallest fix that resolves them.
category: frontend
tags:
  - nextjs
  - react
  - hydration
  - ssr
  - debugging
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Next.js Hydration Fix

The user has a hydration error. The browser console is yelling, the page
flickers on load, and Next.js is unhelpful. Identify which variant of
the error it is, find the smallest fix, and verify it.

## Use this skill when

- The browser console shows "Text content does not match server-rendered HTML".
- The console shows "Hydration failed because the initial UI does not match what was rendered on the server".
- The console shows "There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering".
- The page renders correctly on first paint then flickers or visibly changes a moment later.
- The user explicitly asks about a hydration error, hydration mismatch, or SSR/CSR mismatch.

## Do NOT use this skill when

- The error is a build-time failure (use `vercel-build-fail-decode` or
  general `debugging`). Hydration errors only fire in the browser at
  runtime.
- The error is in a Server Component and there is no hydration happening
  at all — that is a different bug class (server render error).
- The user wants to learn React fundamentals. This skill fixes the bug;
  it does not teach hydration as a concept.

## Procedure

1. Identify the exact error variant. The fix depends on which one:
   - "Text content does not match server-rendered HTML" → a string
     rendered server-side differs from the string rendered client-side.
   - "Expected server HTML to contain a matching ... in ..." → the
     element tree differs in shape, not just text.
   - "There was an error while hydrating" → an exception was thrown
     during hydrate (often `undefined` access on a `window`-only value).

2. Open the browser DevTools console and expand the error. React 18+
   prints the offending component name and a short diff. If the diff is
   not visible, temporarily mark the page as dynamic to confirm the
   error is SSR-vs-client data drift:

   ```ts
   // app/your-page/page.tsx
   export const dynamic = 'force-dynamic'
   ```

   If the error disappears with `force-dynamic`, the cause is server/
   client data drift. Remove the flag — it is a diagnostic, not the fix.

3. Walk the common root causes in order of frequency. Stop at the first
   one that matches.

   a. **Date/time rendered without an explicit timezone or locale.**
      Symptom: "Text content does not match" on a timestamp like
      `12/05/2026, 4:21 PM`. Server uses UTC, client uses the user's
      zone, the strings diverge. Fix: render with an explicit format —
      `new Date(x).toISOString()` for machine output, or `date-fns-tz`
      / `Intl.DateTimeFormat` with an explicit `timeZone` option for
      human output. Never call `new Date().toLocaleString()` without a
      timezone in SSR-rendered markup.

   b. **`Math.random()`, `Date.now()`, or `crypto.randomUUID()` in
      render.** Symptom: a random id or timestamp differs between SSR
      and the first client render. Fix: use `useId()` for stable
      element ids. For other dynamic values, compute them in a
      `useEffect` and gate the render with a state flag (see pattern c).

   c. **Reading `window`, `localStorage`, `document`, `navigator` during
      render.** Symptom: works after a click or route change, fails on
      first paint; sometimes "ReferenceError: window is not defined"
      shows up server-side first, then the hydration error follows. Fix:

      ```tsx
      'use client'
      import { useEffect, useState } from 'react'

      export function ThemeToggle() {
        const [mounted, setMounted] = useState(false)
        useEffect(() => setMounted(true), [])
        if (!mounted) return null
        // safe to read localStorage / window here
        const theme = localStorage.getItem('theme') ?? 'light'
        return <button>{theme}</button>
      }
      ```

   d. **Invalid HTML nesting.** Common cases: `<p>` containing a
      `<div>`, `<a>` containing an `<a>`, `<button>` containing a
      `<button>`, `<tr>` outside a `<tbody>`. The browser silently
      rearranges the DOM to make it valid, so the post-parse tree no
      longer matches what React rendered. Fix: validate the JSX
      structure. Replace block-level children inside `<p>` with
      `<span>` and `display: block` CSS, or restructure.

   e. **Browser extensions rewriting the DOM before hydrate.** Top
      culprits: Grammarly (adds `data-gr-ext-*` attributes), Dark
      Reader (injects inline styles), 1Password / LastPass (inject
      icons into inputs). Symptom: error reproduces in your normal
      browser, disappears in incognito with extensions disabled. Fix
      options:

      ```tsx
      // For the specific element being modified:
      <body suppressHydrationWarning>...</body>
      <input suppressHydrationWarning />
      ```

      `suppressHydrationWarning` only silences mismatches one level
      deep. Use it on the smallest element you can, not the whole
      `<html>`.

   f. **`useLayoutEffect` in code that runs on the server.** Symptom:
      a warning during render about `useLayoutEffect` having no effect
      on the server. Fix: switch to `useEffect`, or import
      `useIsomorphicLayoutEffect` from a tiny shim:

      ```tsx
      import { useEffect, useLayoutEffect } from 'react'
      const useIsoEffect =
        typeof window !== 'undefined' ? useLayoutEffect : useEffect
      ```

4. Verify the fix:
   - Hard refresh: Cmd+Shift+R on macOS, Ctrl+Shift+R elsewhere.
   - Open the page in an incognito window (rules out extensions).
   - Check the console — no hydration error, no new warnings.
   - If you added `'use client'` to a previously server component, make
     sure the parent still passes only serializable props.

5. If none of the fixes above matches, ask the user for:
   - The exact error text, copied from the console, including the
     component name in the React stack.
   - The source of the component where the error is fired (15-30 lines
     around the suspected line).
   - Whether the project uses the `app/` router or the `pages/` router
     — error semantics differ slightly between them.

## Examples

In scope: "I'm getting 'Text content does not match server-rendered HTML'
on my dashboard that shows 'Welcome back, [name] · last login [time]'."

→ Most likely cause (a): the timestamp is rendered with
`toLocaleString()` and the server is in UTC, the client is not. Replace
with `new Date(lastLogin).toISOString()` or render with explicit
`Intl.DateTimeFormat('en-US', { timeZone: 'UTC' })`. If the name string
also varies (e.g. picked at random for a placeholder), apply pattern (b)
with `useId` or a mounted-flag.

In scope: "Theme toggle works locally but throws 'Hydration failed' in
production."

→ Cause (c): `localStorage.getItem('theme')` is being read during
render. Apply the `mounted` state pattern. Render `null` (or a server-
safe default) until `useEffect` has set `mounted = true`.

In scope: "Hydration error only in my own browser, never in incognito,
never on my coworker's machine."

→ Cause (e), almost certainly Grammarly or Dark Reader. Add
`suppressHydrationWarning` to the affected element (usually `<body>` or
an `<input>`). Do NOT add it to the entire app root — that silences
real bugs.

Out of scope: "What is hydration in React?"

→ Briefly explain in one sentence (React reuses server-rendered HTML
and attaches event handlers), point at the official React docs, and do
not invoke the rest of this skill.

## Self-check before responding

- Did I identify which exact hydration error string the user is seeing?
- Did I walk the common causes in order — timezone first, random/`Date.now`
  second, `window`/`localStorage` third — rather than jumping to exotic
  fixes?
- Did I propose the smallest fix, not a refactor or a router switch?
- Did I mention testing in incognito to rule out browser extensions
  before suggesting `suppressHydrationWarning`?
- When I did suggest `suppressHydrationWarning`, did I scope it to the
  smallest element rather than the whole tree?
- Did I treat `export const dynamic = 'force-dynamic'` as a diagnostic
  only, and remove it after confirming the cause?
- Did I avoid telling the user to "switch to the pages router" or
  "disable SSR for the whole page" as a fix?
