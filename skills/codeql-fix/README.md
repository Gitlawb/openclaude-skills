# codeql-fix

Reads a CodeQL / Semgrep / Sonar / Snyk Code finding, traces the
source → sink path, and produces the smallest fix at the right layer for
the rule class — parameterized queries for SQL injection, array-form
subprocess for command injection, output encoding for XSS, resolve-and-verify
for path traversal. Refuses to wrap-and-silence with try/except, and
suppresses false positives only with an English justification.
