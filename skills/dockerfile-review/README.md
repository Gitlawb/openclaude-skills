# dockerfile-review

Reviews Dockerfiles for size, security, caching, and reproducibility issues.
Walks `FROM` → layer ordering → root-vs-non-root + secrets → pinned versions
→ image size, groups findings as blocker / important / nit, and cites each
by `Dockerfile:line`. Example: "review my Dockerfile" / "why is my image
1.2 GB?".
