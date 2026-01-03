# Ignorer Constitution

<!--
Sync Impact Report
- Version change: 1.2.0 → 1.3.0
- Modified principles: Constraints section (technology stack details updated)
- Added sections: OXC Linting toolchain in Constraints; pnpm package manager specification
- Removed sections: none
- Templates requiring updates:
	- ✅ .specify/templates/plan-template.md (no changes needed)
	- ✅ .specify/templates/spec-template.md (no changes needed)
	- ✅ .specify/templates/tasks-template.md (no changes needed)
	- ✅ .specify/templates/commands/*.md (no changes needed)
	- ✅ .github/copilot-instructions.md (Active Technologies section updated)
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

- **Language/Runtime**: TypeScript 5.9+ (strict mode), ES2022 target, Node16+ module resolution, VS Code engine 1.105.0+; esbuild 0.25+ for bundling
- **Tooling**:
  - **Linting**: ESLint 9.39+ with @typescript-eslint (8.51+) using flat config format
  - **Formatting**: oxfmt 0.21+ for multi-language formatting (TS, JSON, TOML, etc.)
  - **Advanced Linting**: oxlint 1.36+ as supplementary linter for additional rule coverage beyond ESLint
  - **Package Manager**: pnpm for dependency management (lock file: pnpm-lock.yaml)
  - **Testing**: @vscode/test-electron 2.5+ for VS Code extension testing; @vscode/test-cli 0.0+ for CLI test execution; mocha 10+ test framework
  - **Type Checking**: TypeScript 5.9+ compiler (tsc --noEmit for CI validation)
- **Coding Standards**:
  - ESLint rules enforced; formatting via oxfmt + oxlint consistency checks
  - No warnings for new/changed code without explicit documented exceptions
  - Type Safety: TypeScript strict mode MUST be maintained; minimal type errors allowed only with // @ts-expect-error comments with justification
- **Security**:
  - No secrets in code; avoid unnecessary network calls; follow VS Code API constraints
  - Handle file I/O safely with proper error boundaries
  - Validate user-provided glob patterns and file paths
- **UX**:
  - Multi-root aware; do not clutter the UI; context menus must be relevant and predictable
  - Provide clear error messages via OutputChannel with appropriate log levels (info/warning/error)
  - File decorations and badges must follow VS Code convention patterns
- **Versioning**: Semantic versioning for the extension (MAJOR.MINOR.PATCH) and this constitution (same scheme)
- **Distribution**: VS Code extension packaged via @vscode/vsce 3.7+; published to VS Code Marketplace

## Development Workflow & Quality Gates

### Workflow Selection

Development activities SHALL use the appropriate workflow type based on the nature of the work. Each workflow enforces specific quality gates and documentation requirements tailored to its purpose:

- **Baseline** (`/speckit.baseline`): Project context establishment - requires comprehensive documentation of existing architecture and change tracking
- **Feature Development** (`/specify`): New functionality - requires full specification, planning, and TDD approach
- **Bug Fixes** (`/speckit.bugfix`): Defect remediation - requires regression test BEFORE applying fix
- **Enhancements** (`/speckit.enhance`): Minor improvements to existing features - streamlined single-document workflow with simple single-phase plan (max 7 tasks)
- **Modifications** (`/speckit.modify`): Changes to existing features - requires impact analysis and backward compatibility assessment
- **Refactoring** (`/speckit.refactor`): Code quality improvements - requires baseline metrics, behavior preservation guarantee, and incremental validation
- **Hotfixes** (`/speckit.hotfix`): Emergency production issues - expedited process with deferred testing and mandatory post-mortem
- **Deprecation** (`/speckit.deprecate`): Feature sunset - requires phased rollout (warnings → disabled → removed), migration guide, and stakeholder approvals

The wrong workflow SHALL NOT be used - features must not bypass specification, bugs must not skip regression tests, refactorings must not alter behavior, and enhancements requiring complex multi-phase plans must use full feature development workflow.

### Core Workflow (Feature Development)

1. Feature request initiates with `/specify <description>`
2. Clarification via clarification questions to resolve ambiguities
3. Technical planning with `/speckit.plan` to create implementation design
4. Task breakdown using `/speckit.tasks` for execution roadmap
5. Implementation following task order with constitution compliance

### Extension Workflows

- **Baseline**: `/speckit.baseline` → baseline-spec.md + current-state.md establishing project context
- **Bugfix**: `/speckit.bugfix "<description>"` → bug-report.md + tasks.md with regression test requirement
- **Enhancement**: `/speckit.enhance "<description>"` → enhancement.md (condensed single-doc with spec + plan + tasks)
- **Modification**: `/speckit.modify <feature_num> "<description>"` → modification.md + impact analysis + tasks.md
- **Refactor**: `/speckit.refactor "<description>"` → refactor.md + baseline metrics + incremental tasks.md
- **Hotfix**: `/speckit.hotfix "<incident>"` → hotfix.md + expedited tasks.md + post-mortem.md (within 48 hours)
- **Deprecation**: `/speckit.deprecate <feature_num> "<reason>"` → deprecation.md + dependency scan + phased tasks.md
- **Review**: `/speckit.review <task_id>` → review implementation against spec + update tasks.md + generate report
- **Cleanup**: `/speckit.cleanup` → organize specs/ directory + archive old branches + update documentation

### Quality Gates by Workflow Type

**Baseline** (`/speckit.baseline`):
- Comprehensive project analysis MUST be performed
- All major components MUST be documented in baseline-spec.md
- Current state MUST enumerate all changes by workflow type
- Architecture and technology stack MUST be accurately captured

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

**Enhancement** (`/speckit.enhance`):
- Enhancement MUST be scoped to a single-phase plan with no more than 7 tasks
- Changes MUST be clearly defined in the enhancement document
- Tests MUST be added for new behavior
- If complexity exceeds single-phase scope, full feature workflow MUST be used instead
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

**Version**: 1.3.0 | **Ratified**: 2025-11-04 | **Last Amended**: 2026-01-03
