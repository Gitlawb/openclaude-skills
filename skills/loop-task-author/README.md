# loop-task-author

Writes the `.openclaude/loop.md` file (or `~/.openclaude/loop.md`) that
drives openclaude's `/loop` scheduled maintenance. Picks the right loop
mode (dynamic-maintenance / dynamic-prompt / fixed-maintenance /
fixed-prompt), structures the file with continuing-work + background-
passes + guardrails sections, and shows the exact `/loop` invocation
plus how to stop it. Patterns covered: PR-watch, CI-fix, dependency
upgrades, bughunt.
