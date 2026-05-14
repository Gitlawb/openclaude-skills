# git-conflict-resolve

Walks through merge, rebase, or cherry-pick conflicts one block at a
time. Classifies each block as same-goal / independent-goals / logical-
conflict, picks the right resolution per class, and explicitly asks the
user before guessing on logical conflicts. Suggests the correct
`--continue` command for the operation in progress, and the `--abort`
escape hatch when the resolution goes sideways.
