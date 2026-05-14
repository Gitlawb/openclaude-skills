---
description: This fixture is missing the required name field, used to assert the validator catches that.
trust: official
version: 0.1.0
license: MIT
---

# Missing Name

This skill intentionally omits the `name` field so the validator integration
test can assert that the missing-name error fires.

## Use this skill when

Never — this is a fixture, not a real skill. It exists only to drive the
"missing name" path through the validator.

## Procedure

1. Load this file.
2. Run `validateSkill`.
3. Assert that the result contains the `frontmatter.missing_name` error.

## Examples

In scope: error-path testing only.

## Self-check before responding

- Did the validator return `ok: false`?
- Was the missing-name error reported with field `name`?
