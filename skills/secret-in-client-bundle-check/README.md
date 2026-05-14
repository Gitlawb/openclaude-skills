# secret-in-client-bundle-check

Detects API keys, tokens, and secrets accidentally bundled into
client-side JavaScript before production deploy. Scans the BUILT
bundle (not just source) with known patterns for AWS, Stripe live,
OpenAI, Anthropic, Google, GitHub, and Supabase service-role keys.
Audits framework-public env prefixes (`NEXT_PUBLIC_*`, `VITE_*`,
`PUBLIC_*`) for sensitive values that should not be public. Scans git
history with trufflehog/gitleaks. Ranks findings critical / high /
medium / low and tells the user to ROTATE before rewriting history.
Example: "Run a pre-launch security check on my Next.js app."
