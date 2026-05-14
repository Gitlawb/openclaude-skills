# security-audit

Reviews code changes for common security risks — injection, auth bypass,
secret handling, unsafe file/network ops, deserialization, dependency
CVEs. Anchors every finding to a concrete input and a `file:line` fix.
Example: "Audit this new upload endpoint for path traversal."
