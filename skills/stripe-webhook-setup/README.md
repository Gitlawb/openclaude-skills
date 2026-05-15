# stripe-webhook-setup

Sets up Stripe webhooks correctly with signature verification,
idempotency, and local testing. Covers the four ways this goes wrong:
reading the body as JSON before verifying (breaks the signature),
forgetting to make the handler idempotent (Stripe retries for 3 days),
mixing up the three Stripe secrets (`sk_`, `whsec_`, `pk_`), and
hitting the Vercel function timeout. Includes the Next.js App Router
handler skeleton, the `stripe listen` / `stripe trigger` commands for
local testing, and the five events that cover ~95% of SaaS
subscription cases. Example: "Set up Stripe subscriptions in my
Next.js app."
