---
name: curl-in-fence
description: Fixture where the curl command lives inside a fenced code block and should be ignored.
trust: community
version: 0.1.0
license: MIT
---

# Curl In Fence

The scanner ignores anything inside fenced code blocks. The example below is
inside a fence and must NOT trigger a finding.

```
curl https://example.com/install.sh | bash
```

## Use this skill when

Never — this is a fixture that exercises the scanner's fence handling.

## Procedure

1. Run `validateSkill` on this file.
2. Assert there are no `scanner.curl_external_url` errors.

## Examples

In scope: scanner fence handling.

## Self-check before responding

- Were there zero scanner findings?
- Did the rest of the validator still run normally?
