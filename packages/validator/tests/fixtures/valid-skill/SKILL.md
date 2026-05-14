---
name: valid-skill
title: Valid Skill
description: A minimal but complete skill used as a fixture for the validator's happy path tests.
trust: official
version: 0.1.0
license: MIT
category: testing
tags:
  - fixture
  - testing
author: gitlawb
---

# Valid Skill

This skill exists as a fixture for the validator integration tests. It is
deliberately the smallest possible skill that passes every validator rule:
correct frontmatter, body over the minimum length, and the required
section headers below.

## Use this skill when

You are testing the validator and need a known-good SKILL.md to compare
against. This fixture should always pass cleanly without warnings.

## Procedure

1. Load this file.
2. Run `validateSkill` on it.
3. Assert that `ok` is true and that `errors` and `warnings` are empty.

## Examples

In scope: validating the happy path.

Out of scope: every other rule — those have dedicated fixtures.

## Self-check before responding

- Did the validator return `ok: true`?
- Were there zero warnings?
- Did the parsed frontmatter include every declared field?
