# Ignorer Constitution

<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: none
- Added sections: Workflow Selection; Extension Workflows; Quality Gates by Workflow Type
- Removed sections: none
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md (Constitution Check gates aligned)
	- ✅ .specify/templates/spec-template.md (no conflicts)
	- ✅ .specify/templates/tasks-template.md (no conflicts)
	- ✅ Extension workflow templates (bugfix, modify, refactor, hotfix, deprecate)
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

### Workflow Selection

Development activities SHALL use the appropriate workflow type based on the nature of the work. Each workflow enforces specific quality gates and documentation requirements tailored to its purpose:

- **Feature Development** (`/specify`): New functionality - requires full specification, planning, and TDD approach
- **Bug Fixes** (`/speckit.bugfix`): Defect remediation - requires regression test BEFORE applying fix
- **Modifications** (`/speckit.modify`): Changes to existing features - requires impact analysis and backward compatibility assessment
- **Refactoring** (`/speckit.refactor`): Code quality improvements - requires baseline metrics, behavior preservation guarantee, and incremental validation
- **Hotfixes** (`/speckit.hotfix`): Emergency production issues - expedited process with deferred testing and mandatory post-mortem
- **Deprecation** (`/speckit.deprecate`): Feature sunset - requires phased rollout (warnings → disabled → removed), migration guide, and stakeholder approvals

The wrong workflow SHALL NOT be used - features must not bypass specification, bugs must not skip regression tests, and refactorings must not alter behavior.

### Core Workflow (Feature Development)

1. Feature request initiates with `/specify <description>`
2. Clarification via clarification questions to resolve ambiguities
3. Technical planning with `/speckit.plan` to create implementation design
4. Task breakdown using `/speckit.tasks` for execution roadmap
5. Implementation following task order with constitution compliance

### Extension Workflows

- **Baseline**: `/baseline` → baseline-spec.md + current-state.md establishing project context
- **Bugfix**: `/speckit.bugfix "<description>"` → bug-report.md + tasks.md with regression test requirement
- **Enhancement**: `/enhance "<description>"` → enhancement.md (condensed single-doc with spec + plan + tasks)
- **Modification**: `/speckit.modify <feature_num> "<description>"` → modification.md + impact analysis + tasks.md
- **Refactor**: `/speckit.refactor "<description>"` → refactor.md + baseline metrics + incremental tasks.md
- **Hotfix**: `/speckit.hotfix "<incident>"` → hotfix.md + expedited tasks.md + post-mortem.md (within 48 hours)
- **Deprecation**: `/speckit.deprecate <feature_num> "<reason>"` → deprecation.md + dependency scan + phased tasks.md

### Quality Gates by Workflow Type

**Feature Development** (`/specify`):
- Specification MUST be complete before planning
- Plan MUST pass constitution checks before task generation
- Tests MUST be written before implementation (TDD)
- Code review MUST verify constitution compliance
- Typecheck passes (tsc --noEmit)
- Lint + format pass with zero new warnings
- Build succeeds (esbuild production bundle)
- Minimal tests pass for new/changed public behaviors

**Bugfix** (`/speckit.bugfix`):
- Bug reproduction MUST be documented with exact steps
- Regression test MUST be written before fix is applied
- Root cause MUST be identified and documented
- Prevention strategy MUST be defined
- All standard quality gates apply (typecheck, lint, build, tests)

**Modification** (`/speckit.modify`):
- Impact analysis MUST identify all affected files and contracts
- Original feature spec MUST be linked
- Backward compatibility MUST be assessed
- Migration path MUST be documented if breaking changes
- All standard quality gates apply (typecheck, lint, build, tests)

**Refactor** (`/speckit.refactor`):
- Baseline metrics MUST be captured before any changes unless explicitly exempted
- Tests MUST pass after EVERY incremental change
- Behavior preservation MUST be guaranteed (tests unchanged)
- Target metrics MUST show measurable improvement unless explicitly exempted
- All standard quality gates apply (typecheck, lint, build, tests)

**Hotfix** (`/speckit.hotfix`):
- Severity MUST be assessed (P0/P1/P2)
- Rollback plan MUST be prepared before deployment
- Fix MUST be deployed and verified before writing tests (exception to TDD)
- Post-mortem MUST be completed within 48 hours of resolution
- Expedited quality gates: typecheck and build required; tests deferred but required within 48 hours

**Deprecation** (`/speckit.deprecate`):
- Dependency scan MUST be run to identify affected code
- Migration guide MUST be created before Phase 1
- All three phases MUST complete in sequence (no skipping)
- Stakeholder approvals MUST be obtained before starting
- All standard quality gates apply (typecheck, lint, build, tests)

### General Development Process

- Workflow: Branch from main; small PRs; reference specs/plans/tasks
- Release: Bump version per SemVer; update CHANGELOG; package with vsce

## Governance

This constitution supersedes any conflicting process docs in this repo. Amendments
require a PR with a Sync Impact Report (this document’s header) and a rationale.
Versioning policy: MAJOR for incompatible governance changes; MINOR for added or
materially expanded sections; PATCH for clarifications. Compliance is reviewed in
every PR via “Constitution Check” in plans.

**Version**: 1.1.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2025-12-08
