---
name: symlink-folder
description: Fixture used by tests to exercise the symlink rejection path; symlink is created at test time.
trust: community
version: 0.1.0
license: MIT
---

# Symlink Folder

This fixture's SKILL.md is committed, but the symlink that exercises the
rejection path is created at test setup time so the repository remains
portable across platforms.

## Use this skill when

Never — fixture only.

## Procedure

1. Test setup creates a symlink in this folder pointing at /etc.
2. Run `validateSkillFolder` on this folder.
3. Assert that a `files.symlink` error is reported.

## Examples

In scope: folder-policy symlink rejection.

## Self-check before responding

- Was the symlink error tied to the right entry name?
- Was the SKILL.md content still parsed?
