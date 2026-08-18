---
name: gitlawb-sidecar
title: GitLawb Sidecar
description: Add a signed GitLawb mirror next to GitHub. Use when publishing, backing up, or proving a commit without changing origin.
category: release
tags:
  - git
  - github
  - gitlawb
  - provenance
trust: community
version: 0.1.0
license: MIT
author: DevOps21133
tools_required:
  - Bash
min_openclaude_version: 0.10.0
---

# GitLawb Sidecar

GitHub stays the primary remote. This skill adds a second, signed public
mirror on the GitLawb network so every push has a verifiable certificate.
It never replaces GitHub and never touches `origin`.

## Use this skill when

- The user asks to put this repository on GitLawb, or to add a GitLawb remote.
- The user asks to publish, backup, or mirror commits with a signed certificate.
- The user asks to prove authorship of a commit or attach a cert to a pull request.
- The user asks to run `gitlawb-sidecar` or to enable the sidecar GitHub Action.
- The user asks how to give a coding agent Git access without a personal access token.

## Do NOT use this skill when

- The repository is private or contains secrets, `.env` files, or wallet keys. GitLawb mirrors are public.
- The user wants to replace GitHub, delete `origin`, or migrate off GitHub.
- The user wants to run the official GitLawb CLI named `gl`. That name collides with a common `git pull` alias. Use `gitlawb-sidecar` instead.

## Procedure

1. Confirm the working tree is a git repository and that `origin` is a GitHub remote. If it is not a git repo, stop and say so. If `origin` is not GitHub, still proceed but say the GitHub mapping will be empty.
2. Confirm the user is not asking to publish private source. If the repo looks private or they mention secrets, refuse the mirror and explain that sidecar copies are public.
3. Install or run the sidecar without putting a binary named `gl` on PATH:
   - Prefer `npx --yes github:DevOps21133/gitlawb-sidecar <command>`
   - Or, if already built locally, `node /path/to/gitlawb-sidecar/dist/cli.js <command>`
4. First time in this repo: run `init`. That creates or reuses a DID, registers on the public node, adds a remote named `gitlawb` (never `origin`), pushes HEAD, and writes:
   - `.gitlawb-sidecar.json`
   - `.github/workflows/gitlawb-sidecar.yml` (uses `DevOps21133/gitlawb-sidecar@main`)
   - skill files under `.claude/skills`, `.agents/skills`, and `.cursor/skills` when `.cursor` exists
5. Later: run `sync` to push HEAD and fetch the certificate; run `verify` to check HEAD has a matching cert; run `doctor` and treat a non-zero exit as a real failure.
6. After `init` or `sync`, paste the explorer URL and the certificate id in the reply. Tell the user to store the identity file as repo secret `GITLAWB_IDENTITY_PEM` so GitHub Actions can sign.
7. If they only want the one-line embed in an existing workflow, add this step after checkout, then tell them to add the same secret:
   - `uses: DevOps21133/gitlawb-sidecar@main`
   - `with.identity` set from `secrets.GITLAWB_IDENTITY_PEM`

## Examples

In scope: "Put this repo on GitLawb."

→ Run `init`. Do not change `origin`. Print explorer URL and cert id.

In scope: "Prove this commit was pushed."

→ Run `verify`. If it fails, run `sync` then `verify` again.

Out of scope: "Mirror our private production repo."

→ Refuse. Sidecar copies are public. Suggest they keep private work on GitHub only.

Out of scope: "Install gl and register."

→ Do not run `gl`. Use `gitlawb-sidecar` so the shell alias cannot turn into `git pull`.

## Self-check before responding

- Did I leave `origin` unchanged?
- Did I avoid running a command named `gl`?
- Did I refuse if the source should stay private?
- Did I print the explorer URL and cert id after a successful `init` or `sync`?
- Did I mention the GitHub Actions secret by name, without printing the key material?
