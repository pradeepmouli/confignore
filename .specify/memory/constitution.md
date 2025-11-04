# Ignorer Constitution

<!--
Sync Impact Report
- Version change: N/A → 1.0.0
- Modified principles: defined 5 core principles tailored to this repo
- Added sections: Constraints; Development Workflow
- Removed sections: none
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md (Constitution Check gates aligned)
	- ✅ .specify/templates/spec-template.md (no conflicts)
	- ✅ .specify/templates/tasks-template.md (no conflicts)
- Follow-up TODOs: none
-->

## Core Principles

### I. SpecKit Discipline (Template-First)

All feature work MUST start from SpecKit templates (spec, plan, tasks). Plans and
specs are the source of truth for scope, gates, and deliverables. Each story is
independently testable and deliverable. Deviations MUST be justified in the plan.

### II. Latest Stable Dependencies

We MUST use the latest stable versions of dependencies and dev tools unless a
blocking issue is documented. Dependency updates SHOULD be routine and automated
where possible. Security updates are prioritized.

### III. Linting and Formatting as Gates

Code MUST pass linting and formatting before merge. Any generated code MUST obey
the repo’s linting rules. No warnings for new/changed code without explicit,
documented exceptions.

### IV. Type Safety and Tests

TypeScript strictness MUST be maintained. Minimal tests are REQUIRED for public
behaviors and critical paths. For VS Code extensions, prefer @vscode/test-electron
and command-level tests where feasible.

### V. Simplicity, Small Surface, Clear Logs

Favor the simplest viable approach. Keep contributions minimal and coherent.
Provide user-facing clarity with concise status messages and an OutputChannel for
diagnostics.

## Constraints

- Language/Runtime: TypeScript, Node per VS Code engine; esbuild bundling.
- Coding: ESLint rules enforced; formatting consistent with repo standards.
- Security: No secrets in code; avoid unnecessary network calls; follow VS Code API
  constraints; handle file I/O safely.
- UX: Multi-root aware; do not clutter the UI; context menus must be relevant and
  predictable; provide clear error messages.
- Versioning: Semantic versioning for the extension and this constitution.

## Development Workflow & Quality Gates

- Workflow: Branch from main; small PRs; reference specs/plans/tasks.
- Quality Gates (required for merge):
  - Plan/spec updated (SpecKit templates) and in sync.
  - Typecheck passes (tsc --noEmit).
  - Lint + format pass with zero new warnings.
  - Build succeeds (esbuild production bundle).
  - Minimal tests pass for new/changed public behaviors.
- Release: Bump version per SemVer; update CHANGELOG; package with vsce.

## Governance

This constitution supersedes any conflicting process docs in this repo. Amendments
require a PR with a Sync Impact Report (this document’s header) and a rationale.
Versioning policy: MAJOR for incompatible governance changes; MINOR for added or
materially expanded sections; PATCH for clarifications. Compliance is reviewed in
every PR via “Constitution Check” in plans.

**Version**: 1.0.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-11-04
