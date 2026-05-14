---
name: database-review
title: Database Review
description: Reviews database schema changes, migrations, and queries.
category: database
tags:
  - database
  - migrations
  - sql
  - postgres
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Database Review

Review a migration, schema change, or query. The dangerous failures
are silent at code-review time and loud at 2 AM — locks held during
a deploy, an index that gets bypassed, a constraint that breaks
existing rows. Catch them now.

## Use this skill when

- The user has a migration file (SQL, Knex, Prisma, Alembic, etc.)
  they want reviewed before merging.
- The user is changing schema — adding/dropping columns, indexes,
  constraints, types.
- The user has a slow query and wants help reading the plan.
- The user asks about indexing strategy for an existing query.
- The user wants to know if a deploy is safe under rolling
  releases.

## Do NOT use this skill when

- The user wants to design a brand-new schema from scratch with no
  constraints. Out of scope; ask for the access patterns and the
  data shape first.
- The user is troubleshooting an ORM behavior that is not actually
  the SQL's fault. Use `debugging`.
- The user wants help writing CRUD code on top of a schema. Use a
  coding skill.

## Procedure

1. Identify the database and version. Postgres 14 differs from 16,
   MySQL 5.7 from 8, SQLite from both. Migration safety depends on
   what `ALTER TABLE` actually does on that engine.
2. Read the migration. For each statement, ask:
   - **Lock duration**: does this take an ACCESS EXCLUSIVE / table-
     level lock that blocks reads or writes? In Postgres,
     `ALTER TABLE ... ADD COLUMN` with a default rewrites the
     table on older versions; in newer versions it doesn't, but a
     `NOT NULL` constraint without a default still does.
   - **Index builds**: does it use `CONCURRENTLY` where supported?
     A blocking `CREATE INDEX` on a hot table is a deploy outage.
   - **Backfills**: does the migration backfill data inline? Large
     backfills should run outside the migration as a batched job.
   - **Constraint additions**: `NOT NULL` and `CHECK` constraints
     scan the table. `NOT VALID` then `VALIDATE` separately avoids
     blocking.
   - **Type changes**: column type changes often rewrite the
     table. Same for dropping a column with a stored value.
3. Check rolling-deploy compatibility. If the application is
   deployed in stages, the schema must be compatible with both
   the old and new code for the window of the rollout. Common
   patterns that break this:
   - Renaming a column the old code still selects.
   - Adding a `NOT NULL` column without a default — old code
     inserting without the column fails.
   - Dropping a column the old code still references.
   The safe shape is two-step: add the new shape compatible with
   both, deploy the code, then drop the old in a follow-up.
4. Review indexes against query patterns. For each new index, name
   the query that uses it. For each new query, name the index that
   serves it. An index without a query is overhead; a query without
   an index over a large table is a sequential scan waiting to
   happen.
5. Review the query itself. Walk through:
   - **Predicates** — do they match an index prefix? `WHERE a = ?
     AND b = ?` with an index on `(a)` only uses half the index.
   - **JOIN order and types** — large × small with the small on
     the build side, nested-loop vs hash vs merge.
   - **N+1 patterns** — code that iterates a result set issuing
     a follow-up query per row.
   - **OFFSET on deep pages** — anything past a few hundred rows
     should use keyset pagination, not `LIMIT/OFFSET`.
   - **Implicit casts** — `WHERE int_col = '42'` can disable index
     use on some engines.
6. Ask for an `EXPLAIN` (or `EXPLAIN ANALYZE` against a copy with
   realistic data volume) when the query is non-trivial or the
   table is large. A plan is worth ten guesses.
7. Check for data integrity hazards: missing foreign keys, missing
   uniqueness constraints, soft-delete columns that queries forget
   to filter, default values that don't match the application's
   expectations.
8. Insist on a reversible migration. Every migration should have a
   `down` (or its equivalent) that brings the schema back to the
   prior state, or a written note explaining why it cannot be
   reversed. A migration that ships without a path back is a
   migration you cannot deploy on a Friday.
9. Check that the migration runs cleanly on a copy of production-
   sized data, not just the dev seed. A statement that takes 200ms
   on 10 rows can take 40 minutes on 10 million.

## Examples

In scope: "Add a `last_login_at` column to `users`."

→ On Postgres 11+, `ADD COLUMN last_login_at timestamptz` without
a default is fast (metadata-only). Adding `NOT NULL` will scan
the table — if `users` is large, either allow NULL or backfill
in batches and add `NOT NULL` later as `NOT VALID` + `VALIDATE`.
Verify the new column doesn't break old code mid-deploy.

In scope: "This query is slow: `SELECT * FROM orders WHERE
status = 'pending' ORDER BY created_at DESC LIMIT 50`."

→ Look for an index on `(status, created_at DESC)`. A plain
index on `status` will still scan and sort. If `pending` is a
small fraction of rows, a partial index `WHERE status =
'pending'` is even better and cheaper to maintain.

In scope: "Drop the `legacy_id` column from `products`."

→ Two-step. First deploy that removes all reads/writes of
`legacy_id` from application code. Then a follow-up migration
drops the column. A single-step drop will break any pod still
running the old code during rollout.

Out of scope: "Design a schema for a new SaaS product."

→ Needs a brief and access patterns first. Not a review task.

## Self-check before responding

- Did I name the database engine and version?
- For each migration statement, did I evaluate lock duration?
- Did I check rolling-deploy compatibility (old code + new
  schema, new code + old schema)?
- Did I match every new index to a query, and every slow query
  to an index plan?
- Did I look for backfills hidden inside the migration?
- Did I ask for an `EXPLAIN` when the query was non-trivial?
- Did I check data integrity (FKs, uniqueness, soft-delete
  filters)?
- Did I avoid generic advice ("add an index") in favor of named
  indexes against named queries?
- Did I confirm the migration is reversible or note explicitly why
  not?
- Did I consider production-sized data, not just the dev seed?
