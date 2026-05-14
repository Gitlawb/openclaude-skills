---
name: frontend-implementation
title: Frontend Implementation
description: Implements frontend components following project conventions.
category: frontend
tags:
  - frontend
  - ui
  - react
  - components
trust: official
version: 0.1.0
license: MIT
author: gnanam
---

# Frontend Implementation

Build a UI component, page, or feature that fits the project it lives in.
The right answer is almost never "the way I would have done it on a
blank slate" — it is "the way this codebase already does it".

## Use this skill when

- The user asks to build a component, page, or UI feature.
- The user provides a design (Figma, screenshot, description) and
  wants the code.
- The user wants to wire up state, routing, or data fetching for an
  existing component.
- The user wants help finishing a half-built UI feature.

## Do NOT use this skill when

- The work is purely backend. Use a backend-focused skill.
- The user wants a refactor of existing components without a new
  feature. Use `refactor-plan`.
- The user wants design from scratch with no brief or reference.
  Ask for a wireframe, screenshot, or written description first.
- The user wants to debug a known UI bug. Use `debugging`.

## Procedure

1. Read the project's existing component patterns before writing
   anything new. Look for:
   - **File layout** — colocated styles/tests, or central
     directories? Component-per-file or grouped?
   - **State management** — local state? a global store (Redux,
     Zustand, Jotai, signals)? URL state? Server-side state via
     a data layer?
   - **Styling** — CSS modules, Tailwind, vanilla-extract,
     emotion/styled-components, a design-system library?
   - **Forms** — react-hook-form, formik, native form elements?
   - **Routing** — Next.js, React Router, TanStack Router, file-
     based or config-based?
   - **Data fetching** — fetch in components, a query library
     (TanStack Query, SWR), a framework-level loader?
   The first instinct should be to match what is there, not to
   import a new library.
2. Confirm the brief. Bring back the design or description in your
   own words and call out:
   - States to render: loading, empty, error, populated, partial.
   - Interactions: clicks, hover, keyboard, focus, drag.
   - Data dependencies: where does the data come from? What is
     the shape?
   - Where it slots in: which route, which parent component, how
     it composes with siblings.
3. Pick the smallest seam. A new feature usually has a clean place
   to live — a new file, a new sub-route. If the natural seam runs
   through an existing file that is already large, consider
   splitting that file as a preceding step (see `refactor-plan`).
4. Write the component. Match conventions even when you mildly
   disagree with them; conventions earn their keep through
   consistency. Use the project's existing primitives (Button,
   Input, Card) instead of inventing parallel ones.
5. Handle the non-happy states deliberately. A component that
   only renders the populated state is half-finished. Loading,
   error, and empty states are part of the deliverable, not
   polish for a later PR.
6. Wire it in. Connect to data, hook up routing, add it to the
   right parent. A finished component sitting in isolation is not
   a finished feature.
7. Add minimal tests. At least: renders without crashing on each
   state, the main interaction does what it claims, accessibility
   (role, label) is intact. Use `test-writer` for the test design.
8. Flag concerns. After implementation, surface anything you saw
   but did not fix: missing aria labels on a sibling component,
   inconsistent design tokens, a primitive that needs widening.
   The PR is the right place to bring those up.
9. Verify in the browser before claiming done. Type checking and
   unit tests prove the code compiles and the assertions hold;
   they do not prove the feature works. Click through the golden
   path and at least one error path with a running dev server.
10. Watch the network and console while clicking. Unwanted re-
    renders, dropped requests, hydration mismatches, and a11y
    warnings show up there long before they show up in tickets.

## Examples

In scope: "Build a settings panel with a name field and an avatar
upload."

→ Read the existing settings page. Match the form library, the
field component, the error display pattern. Implement loading
(showing the user's current values), saving (optimistic or with
spinner per the existing pattern), validation error display, and
success feedback. Use the existing avatar component if there is
one; do not introduce a new image-cropping library without
discussion.

In scope: "Add a 'Recent activity' card to the dashboard."

→ Find the dashboard's grid system and the card primitive. Wire to
the existing query layer (TanStack / SWR / framework loader).
Implement loading skeleton, empty state ("No activity yet"), error
state with retry, and the populated list with a max height and
overflow.

Out of scope: "Decide what features to build."

→ Product question, not implementation. Ask the user for the brief
first.

In scope: "Add a sticky header that shrinks on scroll."

→ Find the existing header, the layout shell, and the scroll
container. Use the project's existing scroll/intersection
patterns instead of attaching ad-hoc listeners. Test at common
breakpoints; the sticky behavior most commonly breaks on iOS
Safari and inside nested scroll containers.

Out of scope: "Redesign the navigation."

→ Open-ended design work needs a brief. Ask for a target state
before writing code.

Out of scope: "Make this look prettier."

→ Vague aesthetic asks are not actionable. Ask which surface, what
the target style is, and what reference to anchor against.

## Self-check before responding

- Did I read at least 2-3 sibling components before writing this
  one?
- Did I match the existing state management, styling, and form
  patterns?
- Did I implement loading, error, and empty states, not just the
  populated state?
- Did I use existing primitives instead of inventing parallel
  ones?
- Did I add the component to the right parent / route, not leave
  it floating?
- Did I write the minimum tests that prove the component renders
  each state and handles the main interaction?
- Did I check basic accessibility — labels, roles, focus order,
  keyboard?
- Did I flag deviations from convention I noticed but did not
  fix?
