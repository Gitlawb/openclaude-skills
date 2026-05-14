# regex-craft

Writes regex patterns from natural-language descriptions, with three
match + three no-match test cases (including a near-miss) and at least
one edge case. Identifies the right flavor (JS / Python / PCRE / POSIX
BRE-vs-ERE / RE2) for the user's environment, flags catastrophic
backtracking, and recommends parsers / libraries when regex is the wrong
tool (HTML, JSON, email, URL). Example: "what's the regex for ISO 8601
dates?"
