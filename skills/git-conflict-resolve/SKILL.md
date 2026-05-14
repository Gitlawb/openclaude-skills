---
name: git-conflict-resolve
title: Git Conflict Resolve
description: Resolves merge and rebase conflicts by preserving both sides' intent.
category: code-review
tags:
  - git
  - merge
  - rebase
  - conflicts
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Git Conflict Resolve

Walk through merge, rebase, or cherry-pick conflicts one block at a
time. Figure out what each side was trying to do, pick the resolution
that preserves both intents, and flag the ones where you genuinely have
to ask the user.

## Use this skill when

- The user has a merge, rebase, or cherry-pick conflict and asks for
  help resolving it.
- The user pastes a file containing `<<<<<<<`, `=======`, `>>>>>>>`
  conflict markers.
- The user says their rebase is stuck or that git is asking them to
  resolve something.
- The user asks how to merge two specific branches when conflicts
  are known to exist.

## Do NOT use this skill when

- The user wants to write a commit message (use
  `commit-message-craft`).
- No conflict has happened yet — questions like "will these branches
  conflict?" call for inspecting the diff, not running this skill.
- The user wants general git tutorials or strategy advice — this
  skill resolves an in-progress operation, not theory.

## Procedure

1. **Check the state.** Don't assume what operation is in
   progress.
   - `git status` to see which files are conflicted and which
     operation triggered the conflict (merge / rebase / cherry-pick
     / revert).
   - `git log --oneline --graph --decorate -20` to see how the two
     branches diverged.
   - `git diff --cc <file>` for each conflicted file. The "combined
     diff" view is more readable than the raw `<<<<<<<` markers —
     it shows only the lines that actually differ from both sides.
2. **For each conflict block, name both sides' intent.** The
   conflict marker shows you two competing edits; the question is
   what each was trying to accomplish.
   - `HEAD`'s version (above `=======`) — what's the current
     branch trying to do?
   - The incoming version (below `=======`, before `>>>>>>>`) —
     what's the branch being merged in trying to do?
   - Then classify the block: **same goal, different style**
     (pick one — see step 3); **different, independent goals**
     (keep both, ordered naturally); or **logical conflict** —
     one side renames or removes a thing the other relies on —
     in which case STOP and ask the user which intent wins.
     Never guess on a logical conflict.
3. **Pick the resolution strategy per block.**
   - For style-only conflicts, scan recent commits (`git log -p
     -10 -- <file>`) to learn the file's dominant style and match
     it.
   - For semantic conflicts where both sides should land, write
     the merged version that does both things. Move imports,
     reorder symbol declarations, and combine option objects as
     needed.
   - For logical conflicts, write the question for the user as
     specifically as possible: name the lines, name both intents,
     and ask which one wins.
4. **Order multi-file resolution from leaves to roots.** Config
   and constant files first, then libraries / shared utilities,
   then the call sites. Resolving call sites before the
   underlying API is settled tends to produce conflicts inside
   conflicts.
5. **Verify after resolving.** Don't `git add` blind.
   - `git diff <file>` to confirm the resolved content matches
     the combined intent and has no stray markers.
   - If the project has tests for the touched area, run them now
     (`bun test`, `pytest <path>`, etc.) — the cheapest
     correctness check is at conflict-resolution time, not after
     `--continue`.
6. **Stage and continue with the right command for the
   operation.** `git add <files>` for each, then: mid-rebase
   `git rebase --continue`; mid-merge `git commit` (the message
   is already prepared); mid-cherry-pick `git cherry-pick
   --continue`; mid-revert `git revert --continue`. Don't run
   `git commit --amend` mid-rebase — let `--continue` drive it.
7. **If everything goes sideways**, the escape hatches are
   `git rebase --abort` / `git merge --abort` /
   `git cherry-pick --abort`. They restore the pre-operation
   state cleanly; suggest them explicitly when the user is stuck
   rather than digging deeper.

## Examples

In scope: a user pastes a file with three conflict marker blocks
in `src/config.ts`.

→ Run `git status` (to confirm which operation), `git diff --cc
src/config.ts` (to read the combined view), and walk each block
in order. For block 1 (different env-var defaults), the two sides
have the same intent — pick the value from the more recent commit
on the relevant branch. For block 2 (one side adds a new feature
flag, the other doesn't touch it), keep both. For block 3 (one
side renames `timeoutMs` to `timeoutSeconds` and rescales, the
other adds a new caller using the old name), stop and ask which
name wins before touching it.

In scope: "I'm rebasing onto main and have three conflicts."

→ `git status` first to confirm which three files. Resolve in
the order config → shared utility → caller. After each, run
`git diff <file>` and re-run any tests touching that file before
moving to the next. `git rebase --continue` at the end, not
between each file.

Out of scope: "should I use merge or rebase for this branch?"

→ General strategy question, not an in-progress resolution. Tell
the user this skill resolves conflicts; ask whether they're
mid-operation, and offer to continue from there if they trigger
the conflict.

## Self-check before responding

- Did I identify both sides' intent for each block, not just
  "HEAD vs theirs"?
- Did I classify each block as same-goal / independent / logical
  conflict before resolving?
- Did I flag the logical conflicts to the user instead of
  guessing?
- Did I propose `git diff <file>` (and tests where cheap) to
  verify each resolution before staging?
- Did I name the **correct** continue command for the operation
  (`rebase --continue` vs `commit` vs `cherry-pick --continue`
  vs `revert --continue`)?
- For multi-file conflicts, did I propose a resolution order
  (leaves to roots)?
- Did I leave the user a path back (`--abort`) if the resolution
  goes wrong?
