# Implementation Plan: Ignore visibility and config updates

**Branch**: `001-ignore-visibility-config` | **Date**: 2025-11-04 | **Spec**: ./spec.md
**Input**: Feature specification from `/specs/001-ignore-visibility-config/spec.md`

**Note**: Filled by /speckit.plan for this VS Code extension feature.

## Summary

Implement two capabilities:

- Detect if a selection (file/folder) is effectively excluded by any active source and toggle menu visibility accordingly (hide “Ignore”, show “Include” when excluded; inverse when not).
- Support config-based include/exclude updates for v1 targets: TypeScript (tsconfig include/exclude), Prettier, ESLint. Precedence: config-based excludes > project ignore files > workspace settings. Do not auto-create missing configs.

High-level approach:

- Build a resolution service that evaluates a selection against supported sources and returns an EffectiveState with source provenance.
- Register context keys (e.g., confignore.selectionExcluded/confignore.selectionMixed) and update them on selection changes to drive menu visibility.
- Implement config target writers/readers for tsconfig, Prettier, and ESLint with safe read-modify-write and schema validation; no-op if target is missing.

## Technical Context

**Language/Version**: TypeScript (^5.9.x) targeting VS Code engine ^1.105.0
**Primary Dependencies**: VS Code extension API; esbuild bundling; ESLint for linting; TypeScript compiler for types
**Storage**: Files in workspace (ignore files, config files); no external storage
**Testing**: @vscode/test-electron + mocha; command-level and service unit tests
**Target Platform**: VS Code Desktop (matching engine ^1.105.0), multi-root aware
**Project Type**: Single VS Code extension project
**Performance Goals**: Menu state updates within <150ms after selection change; file IO minimal and batched
**Constraints**: Follow repo ESLint rules; type-safe; safe file writes (no partial writes); no changes outside workspace; do not auto-create configs
**Scale/Scope**: Single extension; typical project sizes (hundreds–thousands of files); support multi-selection

## Constitution Check

Gates to satisfy in implementation PR(s):

- Uses SpecKit templates (spec/plan/tasks) with independent user stories — satisfied by current artifacts
- Dependencies at latest stable versions or documented exceptions — will use existing versions aligned to engine
- Typecheck passes (tsc --noEmit) — required before merge
- Linting + formatting pass with zero new warnings — required before merge
- Production build succeeds (esbuild) — required before merge
- Minimal tests for new/changed public behaviors — add tests for state resolution, writers, and context keys

## Project Structure

### Documentation (this feature)

```text
specs/001-ignore-visibility-config/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── extension-commands.md
```

### Source Code (repository root)

```text
src/
├── extension.ts                # activation/registration
├── services/
│   ├── stateResolver.ts        # compute EffectiveState for selections
│   ├── configTargets.ts        # readers/writers for tsconfig, Prettier, ESLint
│   └── contextKeys.ts          # set VS Code context keys for menu visibility
├── lib/
│   ├── fs.ts                   # safe read/write helpers
│   └── patterns.ts             # path matching utilities
└── models/
    └── types.ts                # EffectiveState, Source enums, ConfigTarget types

test/
├── unit/
│   ├── stateResolver.test.ts
│   ├── configTargets.test.ts
│   └── contextKeys.test.ts
└── integration/
    └── commands.test.ts
```

**Structure Decision**: Extend current single-project layout minimally with services/lib/models folders to keep responsibilities clear and tests focused.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | —          | —                                    |
