# vercel-build-fail-decode

Reads Vercel build logs, finds the actual error among the noise, and
proposes a fix. Covers the high-frequency causes — missing env vars,
case-sensitivity on Linux, stale lockfiles, TypeScript errors that
`next dev` skipped, function-size limits, and out-of-memory builds.
Tells the user which line to read, what to change, and how to redeploy.
Example: "Vercel build fails with 'Module not found: Can't resolve
./button' but it works locally."
