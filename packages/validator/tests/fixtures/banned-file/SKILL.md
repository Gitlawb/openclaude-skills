---
name: banned-file
description: Fixture skill folder that also contains a banned install.sh file alongside SKILL.md.
trust: community
version: 0.1.0
license: MIT
---

# Banned File

This skill folder contains an extra `install.sh` script next to the SKILL.md
file. The validator must reject the folder for containing a disallowed file
even though the SKILL.md itself is otherwise fine.

## Use this skill when

Never — this is a fixture that exercises the file-policy error path.

## Procedure

1. Run `validateSkillFolder` against this folder.
2. Assert that the result lists `files.disallowed_file` mentioning
   `install.sh`.

## Examples

In scope: file-policy error path testing.

## Self-check before responding

- Was the error tied to `install.sh`?
- Did the validator still attempt to parse SKILL.md and aggregate errors?
