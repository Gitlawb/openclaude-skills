---
name: dockerfile-review
title: Dockerfile Review
description: Reviews Dockerfiles for size, security, caching, and reproducibility issues.
category: ci
tags:
  - docker
  - containers
  - devops
  - security
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Dockerfile Review

Read a Dockerfile end to end and identify the issues that bite in
production — bloated images, blown caches, secrets leaking out, builds
that succeed today and not tomorrow. Group findings by severity and
cite specific lines.

## Use this skill when

- The user pastes a Dockerfile and asks for feedback.
- The user asks "review my Dockerfile" or "what's wrong with this
  Dockerfile".
- The user asks why their image is large, slow to build, insecure,
  or non-reproducible.
- The user asks whether a Dockerfile is ready for production.

## Do NOT use this skill when

- The user wants a Dockerfile **written from scratch** with no
  existing file. Use a coding skill.
- The user wants Kubernetes manifest review (deployment, service,
  ingress) — out of scope.
- The user wants general CI pipeline review unrelated to the
  Docker build. Use `ci-fix`.
- The user wants base-image recommendations as standalone advice
  ("what's the best base for Rust?") without an actual Dockerfile
  to review.

## Procedure

Read the Dockerfile in this order — top to bottom, but the categories
below are what to look for at each step.

1. **Base image.** `FROM` lines first.
   - Pinned tag, or `:latest`? `:latest` is a red flag — it makes
     today's build different from tomorrow's.
   - Slim/alpine variant where appropriate, or the full distro?
   - Trusted registry, or a random Docker Hub image?
   - Multi-stage builds (`FROM … AS builder`) for compiled languages?
     If absent, build artifacts and toolchains ship to production
     unnecessarily.
2. **Layer caching.** Look at the order of `COPY` and `RUN`.
   - Dependencies installed **before** copying full source? The
     canonical pattern: `COPY package.json package-lock.json ./` →
     `RUN npm ci` → `COPY . .`. Reverse that and every code change
     reinstalls every dependency.
   - `ADD` used where `COPY` would do? `ADD` is for tar extraction
     and remote URLs; everywhere else it's a footgun.
3. **Security.**
   - Runs as root at runtime? Should drop to a non-root user via
     `USER appuser` after install steps.
   - Secrets baked into layers? Anything `RUN`-ing a secret value
     leaves it in the image history forever. Use BuildKit
     `--mount=type=secret` or build args that never touch a layer.
   - `ADD https://…` fetching arbitrary URLs? Untrusted content
     pulled at build time.
   - Health checks present? `HEALTHCHECK` is cheap insurance for
     orchestrators.
4. **Reproducibility.**
   - Versions pinned in package managers? `npm ci` (with a
     committed lockfile) over `npm install`. `pip install
     --no-cache-dir -r requirements.txt` against a pinned
     requirements file.
   - Locale / timezone explicitly set when the app cares?
5. **Image size.**
   - `apt-get` / `apk` cache cleaned in the **same** `RUN` layer as
     install? The canonical Debian pattern chains `apt-get update`,
     `apt-get install`, and a cleanup of `/var/lib/apt/lists/*`
     inside one `RUN` so the cache never lands in a layer. Separate
     `RUN`s leave the cache in an earlier layer permanently.
   - Dev dependencies pruned before final stage?
   - `.dockerignore` present? Missing one ships `.git/`,
     `node_modules/`, and local secrets into the build context.
6. **Group findings by severity:**
   - **Blocker** — security holes, build non-reproducibility from
     `:latest`, secrets leaked into layers.
   - **Important** — caching bugs that waste CI minutes,
     non-root runtime, missing healthcheck.
   - **Nit** — naming, ordering, comment style.
7. Cite each finding with `Dockerfile:line` (or `Dockerfile.api:line`
   for non-default names).

## Examples

In scope: a Dockerfile pasted into the conversation.

→ Walk the order above. For a typical Node service Dockerfile that
starts `FROM node:latest` and runs `npm install` after copying
everything: flag the unpinned base (blocker), the cache miss
caused by copying full source before deps (important), and lack of
a non-root user (important). Cite each by line.

In scope: "my image is 1.2 GB, why is it so big?"

→ Read the file. Common culprits: missing multi-stage build (the
toolchain ships to prod), `apt` cache left in an earlier layer,
dev dependencies not pruned, missing `.dockerignore` so the build
context shipped 200 MB of node_modules. Propose a multi-stage
rewrite if appropriate.

Out of scope: "what's the smallest base image for a Rust binary?"

→ General advice without an existing file to review. Tell the
user this skill reviews; propose `gcr.io/distroless/static-debian12`
as a starting answer and stop.

## Self-check before responding

- Did I name the base image and call out `:latest` if present?
- Did I check the order of `COPY` and `RUN` against the canonical
  deps-first pattern?
- Did I check whether the image runs as root at runtime?
- Did I look for secrets that might be baked into layers?
- Did I check that apt/apk caches are cleaned in the same `RUN`?
- Did I check whether a `.dockerignore` exists?
- Did I group findings as blocker / important / nit?
- Does every finding cite a specific `Dockerfile:line`?
