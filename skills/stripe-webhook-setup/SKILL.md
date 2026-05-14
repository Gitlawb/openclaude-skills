---
name: stripe-webhook-setup
title: Stripe Webhook Setup
description: Sets up Stripe webhooks correctly with signature verification, idempotency, and local testing.
category: ci
tags:
  - stripe
  - payments
  - webhooks
  - vibe-coding
  - security
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Stripe Webhook Setup

The user is wiring Stripe into a Next.js app. The four ways this goes
wrong: they read the request body as JSON before verifying the
signature, they forget to make the handler idempotent, they confuse the
webhook signing secret with the API secret key, and the handler times
out on Vercel. Walk them through each — in that order.

## Use this skill when

- The user asks to set up Stripe webhooks.
- The user has a Stripe webhook handler that "doesn't work", "fires
  twice", or returns 400 to Stripe.
- The user asks how to test Stripe webhooks locally.
- The user's subscription state in their DB drifts from what Stripe
  shows in its dashboard.
- The user sees "No signatures found matching the expected signature
  for payload" in their handler logs.

## Do NOT use this skill when

- The user wants to set up Stripe Checkout — checkout happens before
  webhooks are relevant. Different skill / different setup.
- The user wants Stripe Tax, Stripe Connect, or Stripe Identity.
  Related products, different setup.
- The user wants Lemon Squeezy, Paddle, or Polar. Different APIs and
  different webhook conventions.

## Procedure

1. **Pick the right events.** For a typical SaaS subscription, these
   five cover ~95% of cases:

   - `checkout.session.completed` — initial paid signup.
   - `customer.subscription.updated` — plan change, status change
     (e.g. `active` → `past_due`).
   - `customer.subscription.deleted` — cancellation.
   - `invoice.paid` — recurring renewal succeeded.
   - `invoice.payment_failed` — renewal failed (dunning flow starts).

   Do not subscribe to `*` / all events — every event hits the handler
   and burns serverless compute. Do not subscribe to test-mode events
   from a production endpoint or vice versa.

2. **Verify the signature on every request.** The biggest failure
   mode: reading the body as JSON before verifying, which consumes the
   stream and breaks verification.

   Next.js App Router example:

   ```ts
   // app/api/stripe-webhook/route.ts
   import Stripe from 'stripe'
   import { headers } from 'next/headers'

   export const runtime = 'nodejs' // not 'edge' — Stripe SDK needs Node
   export const dynamic = 'force-dynamic'

   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

   export async function POST(req: Request) {
     const body = await req.text()        // MUST be text, NOT req.json()
     const sig = (await headers()).get('stripe-signature')
     if (!sig) return new Response('Missing signature', { status: 400 })

     let event: Stripe.Event
     try {
       event = stripe.webhooks.constructEvent(
         body,
         sig,
         process.env.STRIPE_WEBHOOK_SECRET!
       )
     } catch (err) {
       return new Response('Invalid signature', { status: 400 })
     }

     // ... handle event
     return new Response('ok', { status: 200 })
   }
   ```

   If verification keeps failing with "No signatures found matching
   the expected signature for payload", the cause is almost always one
   of: `req.json()` was called somewhere, the wrong signing secret is
   in the env, or middleware is rewriting the body.

3. **Make the handler idempotent.** Stripe retries failed webhooks
   with exponential backoff for up to 3 days. The same event WILL
   arrive twice eventually.

   Pick one strategy:

   a. **Track event IDs in the database** (works for any logic):

      ```sql
      CREATE TABLE stripe_events (
        id          TEXT PRIMARY KEY,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ```

      ```ts
      const { error } = await db
        .from('stripe_events')
        .insert({ id: event.id })
      if (error?.code === '23505') {
        return new Response('already processed', { status: 200 })
      }
      ```

   b. **Make the action itself idempotent** (simpler when applicable):
      instead of "increment user credit by 10", use "set user
      `current_plan` to the value derived from this event". Replaying
      the same event produces the same state.

4. **Test locally with Stripe CLI.**

   ```bash
   # one-time install: https://stripe.com/docs/stripe-cli
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

   The CLI prints a webhook signing secret that starts with
   `whsec_...`. Put it in `.env.local` as `STRIPE_WEBHOOK_SECRET`.
   Now real test-mode events from the Stripe dashboard forward to the
   local handler with valid signatures.

   To fire a specific event without doing a real transaction:

   ```bash
   stripe trigger checkout.session.completed
   stripe trigger invoice.payment_failed
   ```

5. **Wire the production webhook.** Stripe Dashboard → Developers →
   Webhooks → "Add endpoint":

   - URL: the deployed handler URL, e.g.
     `https://yourapp.com/api/stripe-webhook`.
   - Events: the five from step 1.
   - After saving, click "Reveal" next to "Signing secret" — this is a
     DIFFERENT `whsec_...` value from the CLI's. Set it as the
     production `STRIPE_WEBHOOK_SECRET` in Vercel → Project Settings →
     Environment Variables (Production only).

   Three secrets to keep straight:
   - `STRIPE_SECRET_KEY` — server-side API key, starts with `sk_test_`
     or `sk_live_`. Used by the SDK.
   - `STRIPE_WEBHOOK_SECRET` — signing secret, starts with `whsec_`.
     Used only by `constructEvent`. Different value for local CLI vs
     each production endpoint.
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — client-side, starts with
     `pk_test_` or `pk_live_`. Safe in the bundle.

6. **Common failure modes:**

   - "No signatures found matching the expected signature for
     payload" — `req.json()` was called somewhere up the stack, OR
     the wrong signing secret is in the env (CLI vs production
     mismatch is the #1 cause).
   - Handler returns 200, DB does not update — the handler is async
     but a Promise was not awaited.
   - Subscription state drifts from Stripe — the local DB is treated
     as the source of truth. For anything time-sensitive (current
     plan, trial end), re-read from Stripe on demand or rebuild the
     row from the event.
   - Webhook fires twice and creates duplicate rows — handler is not
     idempotent. Add event-ID tracking (step 3a).
   - "504 Gateway Timeout" / function timed out — default Vercel
     timeout is 10s (Hobby) / 60s (Pro). If the work is slow, return
     200 fast and push the heavy work to Inngest, Trigger.dev, or a
     Vercel queue.
   - Body is empty after middleware — a custom middleware ran
     `await req.text()` or `await req.json()` and consumed the
     stream. Skip middleware for the webhook path in `matcher`.

## Examples

In scope: "Set up Stripe subscriptions in my Next.js app."

→ Walk steps 1-5. Provide the route handler skeleton with raw-text
body verification, the event-ID idempotency table, the CLI testing
command, and the env-var layout (3 distinct secrets).

In scope: "My webhook fires but Supabase doesn't update."

→ Check, in order: was the Promise awaited? Was the signature valid
(check handler logs for 400 responses)? Was the same event ID already
in `stripe_events`? Is the service role / write path correctly
authorized?

In scope: "I'm getting 'No signatures found matching' on every event."

→ Three suspects: `req.json()` somewhere, wrong `STRIPE_WEBHOOK_SECRET`
(CLI vs production), or middleware consuming the body. Ask which.

Out of scope: "How do I show the customer's plan in the UI."

→ Reading state, not webhook setup. Different concern.

## Self-check before responding

- Did I emphasize that the body MUST be `req.text()`, never
  `req.json()`, BEFORE signature verification?
- Did I include an idempotency strategy (event-ID table OR idempotent
  actions)?
- Did I list the five essential events without saying "subscribe to
  all events"?
- Did I show the `stripe listen --forward-to` and `stripe trigger`
  commands for local testing?
- Did I clearly distinguish the three secrets (API key, webhook
  signing secret, publishable key) and warn that the CLI signing
  secret is DIFFERENT from the production one?
- Did I mention the Vercel timeout (10s/60s) and the queue solution
  for slow handlers?
- Did I tell the user to set `runtime = 'nodejs'`, not Edge, for the
  Stripe SDK?
