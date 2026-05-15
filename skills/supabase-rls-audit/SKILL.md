---
name: supabase-rls-audit
title: Supabase RLS Audit
description: Audits Supabase Row Level Security policies for missing tables, inverted logic, and anonymous access leaks.
category: security
tags:
  - supabase
  - rls
  - postgres
  - security
  - vibe-coding
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Supabase RLS Audit

The user is about to ship a Supabase app and wants to know whether
strangers can read other users' rows. Or they already shipped and
something feels wrong. Walk the six checks below in order. The first
two find the highest-severity issues; do not skip them.

CVE-2025-48757 (170+ AI-generated Supabase apps with inverted RLS logic)
and the Moltbook incident (1.5M tokens leaked from a Supabase table
with RLS disabled) are the exact failure modes this skill exists to
prevent.

## Use this skill when

- The user asks "is my Supabase secure" or "audit my RLS".
- The user mentions deploying a Supabase app to production.
- The user has a Lovable, Bolt, Cursor, or v0-generated Supabase app
  and wants a security check before launch.
- The user reports unexpected data showing up to the wrong users.
- The user is migrating from a prototype to a real product.

## Do NOT use this skill when

- The user wants to WRITE a new RLS policy from scratch — that is
  policy-authoring, a different skill. This skill audits what already
  exists.
- The user has auth or session bugs unrelated to data access (login
  loops, JWT expiry). Use a different debugging path.
- The user is auditing a self-hosted Postgres that is not Supabase.
  Some checks (the `auth.uid()` function, the `anon` role) are
  Supabase-specific.

## Procedure

1. Get database access. Two paths, in order of preference:
   - SQL Editor in the Supabase dashboard (Project → SQL Editor) —
     fastest, no setup.
   - `psql` with the connection string from Project Settings →
     Database → Connection string (URI). Use the "session" pooler URL
     for one-off audits.

   If the user cannot share access, ask them to run each SQL query
   below and paste the results.

2. **Check 1: tables in `public` with RLS DISABLED.** This is the
   Moltbook failure mode. RLS off = every row readable by anyone with
   the anon key, and the anon key is in the client bundle by design.

   ```sql
   SELECT schemaname, tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public' AND rowsecurity = false;
   ```

   Any row returned is a CRITICAL finding. Fix per table:

   ```sql
   ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
   ```

   Enabling RLS with no policy = deny-all to non-service-role clients.
   So after enabling, write the policies the app actually needs, or
   the app will start returning empty result sets.

3. **Check 2: tables with RLS enabled but ZERO policies.** Deny-all
   may be intentional (table only touched server-side via the service
   role) — but it may also be an in-progress migration where the dev
   forgot to write a policy and is silently getting empty queries.

   ```sql
   SELECT t.tablename
   FROM pg_tables t
   WHERE t.schemaname = 'public' AND t.rowsecurity = true
   AND NOT EXISTS (
     SELECT 1 FROM pg_policies p
     WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
   );
   ```

   For each result, ask: should the app read or write this table from
   the client? If yes, the missing policy is a bug. If no (server-only
   table), this is fine — note it and move on.

4. **Check 3: policies that allow the `anon` role.** This is one place
   where CVE-2025-48757-style inversions hide.

   ```sql
   SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE 'anon' = ANY(roles) OR 'public' = ANY(roles);
   ```

   For each row, read the `qual` (the `USING` clause). Ask:
   - Does this table genuinely have public content (a blog post
     table with `is_public = true`)? If yes, is `qual` actually
     scoped, e.g. `(is_public = true)`?
   - Is `qual` literally `true`? That means ANY anonymous request
     reads EVERY row. Almost never the intent.
   - Does the `cmd` include `INSERT` / `UPDATE` / `DELETE` for the
     `anon` role? That allows unauthenticated writes — usually a
     mistake.

5. **Check 4: inverted logic.** The CVE-2025-48757 pattern. Read every
   policy `qual` carefully:

   ```sql
   SELECT tablename, policyname, cmd, roles, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

   Red flags to look for in `qual` / `with_check`:
   - `auth.uid() IS NULL` — allows anonymous, blocks authenticated
     users (backwards).
   - `NOT (user_id = auth.uid())` or `user_id <> auth.uid()` — allows
     every row EXCEPT the owner's (backwards).
   - `auth.role() = 'anon'` used to gate "owner only" actions
     (backwards).
   - Policy name says "Users can read own rows" but `qual` does not
     reference `auth.uid()` at all (probably wrong, definitely worth
     re-reading).

   If the policy NAME describes intent that does not match the
   `qual`, someone — or an LLM — inverted the comparison. Treat as
   CRITICAL.

6. **Check 5: service role key usage from the client.** The service
   role bypasses RLS entirely. It must never end up in client code or
   in env vars prefixed with `NEXT_PUBLIC_` / `VITE_` / `PUBLIC_`.

   ```bash
   # In the project root:
   grep -rE "SUPABASE_SERVICE_ROLE_KEY|service_role" \
     --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
     app/ src/ pages/ components/ 2>/dev/null

   grep -E "^(NEXT_PUBLIC_|VITE_|PUBLIC_).*SERVICE" .env* 2>/dev/null
   ```

   Hits in client folders (`app/`, `pages/`, `components/`, anything
   not prefixed with `server` or behind an API route) = CRITICAL.
   Service role belongs in API routes, server actions, or
   `'use server'` modules only.

7. **Check 6: anon key in the bundle (informational).**

   ```bash
   grep -rE "(SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE)" .env* 2>/dev/null
   ```

   The anon key IS designed to be public — it relies on RLS to be
   safe. So its presence in the client is expected. The point of this
   check is to remind the user: every RLS gap above means the anon
   key, which is sitting in their bundle, can be used to exploit it.

8. Summarize findings by severity. Lead with CRITICAL.

   - **CRITICAL** — RLS disabled on a user-data table; service role
     in client code; policy with inverted logic on sensitive data;
     `qual = true` on a table with PII.
   - **HIGH** — anon-role policies on tables containing emails, names,
     or other PII even if scoped; missing `WITH CHECK` on `UPDATE`
     policies (lets a user mutate a row into someone else's
     ownership).
   - **MEDIUM** — tables with RLS enabled but no policies if the app
     reads them (silent failure, not a leak).
   - **LOW** — performance hints (missing index on a column used in a
     policy's `qual`).

   For each CRITICAL finding, give the exact `ALTER TABLE` or
   `CREATE POLICY` / `DROP POLICY` statement the user needs to run.

9. If anything in `pg_policies` is unfamiliar — a custom function in
   `qual`, an extension-defined role, a schema you do not recognize —
   STOP and ask the user. Wrong advice on RLS causes real data leaks.

## Examples

In scope: "Audit my Supabase project before I launch on Friday."

→ Run checks 1-6 in order. Summarize by severity. For each CRITICAL,
provide the exact SQL fix. Tell the user not to launch until
CRITICALs are resolved.

In scope: "Some users say they can see other users' orders in my
dashboard. What did I miss?"

→ Jump to checks 3 and 4 first. Look at the `orders` table's
policies. Most likely `qual` is `true` or references the wrong
column. Verify with a literal query: `SELECT * FROM orders LIMIT 5`
using the anon key — should return only the requesting user's rows.

In scope: "Lovable generated my whole backend, can I trust the RLS it
wrote?"

→ Walk all six checks. AI-generated RLS is the exact failure mode
behind CVE-2025-48757; do not skim. Pay extra attention to check 4
(inverted logic).

Out of scope: "Write me an RLS policy that lets users edit their own
profile."

→ Policy-authoring, not auditing. Different skill / different prompt.

## Self-check before responding

- Did I run check 1 (RLS disabled on `public` tables) FIRST? It is the
  highest-impact failure mode.
- Did I check for service role keys in client code (check 5)?
- Did I read each policy's `qual` for inverted comparisons, not just
  trust the policy name?
- Did I distinguish the `anon` role from `authenticated` when looking
  at `roles`?
- Did I check `with_check` for `INSERT` / `UPDATE` policies, not just
  `qual` for `SELECT`?
- Did I include the exact SQL the user needs to run for each fix?
- Did I rank findings by severity rather than dump a flat list?
- If a policy used a function or role I did not recognize, did I ask
  rather than guess?
