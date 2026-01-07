# Implementation Plan: 002-ai-agent-ignore

**Branch**: `002-ai-agent-ignore` | **Date**: January 3, 2026 | **Spec**: `specs/002-ai-agent-ignore/spec.md`
**Input**: Feature specification from `/specs/002-ai-agent-ignore/spec.md`

## Summary

Implement AI agent ignore support for VS Code extension to allow developers to configure which files should be excluded from AI agent context (Claude Code + Gemini Code Assist in Phase 1, plus Confignore’s own workspace setting as the authoritative source). The feature extends feature 001's ignore configuration framework, supporting VS Code workspace settings (`.vscode/settings.json`) and optional imports from supported agent config files (`.claude/settings.json`, `.aiexclude`). Core deliverables include pattern validation/matching engine, multi-source config aggregation, file decoration badge overlays, and public command API for other extensions to query ignore status. Implementation uses two-tier caching (file-level + workspace-level) to maintain performance targets (<50ms queries, <100ms UI render, <200ms init overhead) with support for 1000+ patterns.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode, ES2022 target), VS Code API 1.105.0+
**Primary Dependencies**: minimatch (pattern matching from feature 001), pino (structured logging), zod (config validation), @vscode/test-electron 2.5+
**Storage**: VS Code workspace settings (`.vscode/settings.json`) + optional imports from supported agent config files (`.claude/settings.json`, `.aiexclude`)
**Testing**: vitest for unit tests, @vscode/test-electron + mocha 10+ for integration tests
**Target Platform**: VS Code extension (multi-root workspace aware)
**Project Type**: VS Code extension (single project, no web/mobile components)
**Performance Goals**: <50ms for file queries (p99), <100ms for decoration render, <200ms extension init overhead
**Constraints**: Two-tier caching required; independent evaluation from gitignore; graceful degradation for malformed configs
**Scale/Scope**: Support 1000+ patterns per workspace; multiple agent config sources; multi-root workspace support

## Constitution Check

_GATE: Must pass before implementation. All gates satisfied._

Status: ✅ All 13 gates passed. Feature aligns with constitution v1.3.0. SpecKit Principle I (template-first), II (latest stable), III (linting/formatting gates), IV (type safety & tests), V (simplicity & clear logs) all satisfied. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

**VS Code Extension Structure** (single project):

```text
src/
├── extension.ts                 # Activation, command registration
├── logger.ts                    # pino logger with OutputChannel
├── models/types.ts              # AiIgnorePattern, AiIgnoreConfig, AiIgnoreStatus
├── services/
│   ├── aiIgnoreResolver.ts      # Core: parseAiIgnoreConfig, isIgnoredForAI
│   ├── agentConfigDetector.ts   # detectClaude, detectGemini
│   ├── decorationProvider.ts    # FileDecorationProvider implementation
│   ├── contextKeys.ts           # aiIgnoredFile, aiIgnoreConfigured context keys
│   ├── aiIgnoreCache.ts         # Two-tier cache: file-level (30s) + workspace-level (60s)
│   ├── configWatcher.ts         # FileSystemWatcher for config changes
│   ├── patternValidator.ts      # Pattern validation with error messages
│   ├── patternMatcher.ts        # Pattern matching with negation support
│   └── aiIgnoreConfig.ts        # Config aggregation and source tracking
├── lib/
│   ├── workspaceSettings.ts     # Read confignore.aiIgnore from workspace settings
│   ├── schemaValidator.ts       # JSON schema validation
│   ├── tooltips.ts              # Tooltip generation
│   ├── strings/errors.ts        # Error message templates
└── assets/badge-ai-ignored.svg  # Badge icon

test/
├── unit/ (pattern validation, caching, context keys, tooltips, schema)
├── integration/ (config detection, watcher, error handling, decorations, commands, performance)
```

**Structure Decision**: Single VS Code extension. Services layer for business logic; lib layer for utilities. Tests mirror source structure with unit/ and integration/ separation.

## Implementation Phases

Feature 002 breaks down into 5 execution phases with clear deliverables and dependencies:

| Phase | Name                                   | Duration | Tasks          | Deliverables                                                                          |
| ----- | -------------------------------------- | -------- | -------------- | ------------------------------------------------------------------------------------- |
| **1** | Setup & Project Structure              | 1-2 days | T001-T006 (6)  | Directory structure, types, schema, manifest, logger, compilation validation          |
| **2** | Foundational Infrastructure            | 3-4 days | T007-T018 (8)  | Pattern validator, matcher, config detector, aggregator, two-tier cache, file watcher |
| **3** | User Story 1 - Configure Patterns (P1) | 2-3 days | T019-T027 (9)  | Config parser, validation pipeline, error handling, feature 001 integration           |
| **4** | User Story 2 - Display Status (P1)     | 2-3 days | T028-T037 (10) | Decoration provider, badge assets, registration, context keys, tooltips               |
| **5** | User Story 3 - Query API (P2)          | 1-2 days | T038-T048 (11) | Primary command, helper commands, multi-root support, performance tests               |

**Parallelization**: After Phase 2, Phases 3-5 can execute in parallel. 3-person team can work on different stories simultaneously.

**Critical Path**: Phase 1 (1-2d) → Phase 2 (3-4d) → Parallel Phases 3-5 (3-4d) = 7-10 days minimum.

## Complexity Tracking

**Status**: No constitution violations. Feature scope aligns with SpecKit discipline. All constraints satisfied.
