# nextjs-hydration-fix

Diagnoses Next.js hydration errors and proposes the smallest fix.
Covers timezone and locale mismatches, `Math.random()` / `Date.now()` in
render, `window` and `localStorage` reads before mount, invalid HTML
nesting, and browser-extension interference (Grammarly, Dark Reader,
password managers). Includes the `suppressHydrationWarning` escape
hatch for unavoidable cases. Example: "I'm getting a hydration mismatch
on my dashboard that says 'Text content does not match server-rendered
HTML'."
