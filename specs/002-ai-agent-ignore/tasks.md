# Tasks: AI Agent Ignore Support (Feature 002)

**Feature**: 002-ai-agent-ignore | **Branch**: `002-ai-agent-ignore`
**Generated**: January 5, 2026 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

## Overview

Implementation tasks for AI agent ignore pattern support (Confignore workspace settings as authoritative source, plus optional imports from Claude Code + Gemini Code Assist local configs in Phase 1). Generated from specification with 3 user stories organized into 5 phases.

**Total Tasks**: 48 | **Phase 1 (Setup)**: 6 | **Phase 2 (Foundation)**: 12 | **Phase 3 (US1)**: 9 | **Phase 4 (US2)**: 10 | **Phase 5 (US3)**: 11

**Performance Targets**: <50ms queries, <100ms UI render, <200ms init overhead

---

## Phase 1: Setup & Project Structure

Initialize project structure and configuration validation. **Must complete before Phase 2.**

**Story Goal**: Prepare VS Code extension environment for AI ignore feature development.
**Acceptance Criteria**: Project structure ready, dependencies installed, TypeScript compilation successful.

### Setup Tasks

- [x] T001 Create feature branch structure with `src/services/aiIgnoreResolver.ts`, `src/services/agentConfigDetector.ts`, `test/unit/ai*.test.ts`, `test/integration/ai*.test.ts`
- [x] T002 Extend `src/models/types.ts` with new `AiIgnorePattern`, `AiIgnoreConfig`, `AiIgnoreStatus`, `AgentConfigDetectionResult` types; add `IgnoreType = 'ai'` variant to existing enum
- [x] T003 Create JSON schema for AI ignore configuration in `.vscode/settings.schema.json` with pattern validation, error messages, IntelliSense descriptions
- [x] T004 Add VS Code extension manifest entries in `package.json`: command registrations for `confignore.isIgnoredForAI`, `confignore.openAiIgnoreSettings`, `confignore.reloadAiIgnoreConfig`, `confignore.showAiIgnoreStatus`; context keys: `confignore.aiIgnoredFile`, `confignore.aiIgnoreConfigured`
- [x] T005 Create `src/logger.ts` (pino logger instance) with OutputChannel integration for extension logging
- [ ] T006 Verify TypeScript compilation (`tsc --noEmit`), oxlint passes (0 warnings), oxfmt formatting applied

---

## Phase 2: Foundational Infrastructure

Implement core pattern matching and configuration detection. **Blocking tasks for all user stories.**

**Story Goal**: Establish AI ignore pattern evaluation engine and multi-source config aggregation.
**Acceptance Criteria**: Pattern validation working, config detection finds agent files, caching functional. Tests: unit ~70% (validation/matching), integration ~60% (multi-source aggregation).

### Pattern Validation & Matching

- [x] T007 [P] Implement `validateAiIgnorePattern(pattern: string): PatternValidation` in `src/services/patternValidator.ts`; reuse minimatch validation from feature 001; catch malformed glob syntax; return errors array with clear messages
- [x] T008 [P] Add pattern validation tests in `test/unit/patternValidator.test.ts`: valid patterns (wildcards, negation, paths), invalid patterns (bad brackets, reserved), edge cases (empty, circular refs)
- [x] T009 Implement `matchFileAgainstPatterns(filePath: string, patterns: AiIgnorePattern[]): boolean` in `src/services/patternMatcher.ts`; reuse minimatch from feature 001; support negation patterns (!pattern); handle relative paths from workspace root
- [x] T010 Add pattern matching tests in `test/unit/patternMatcher.test.ts`: basic matches, wildcards, negation exceptions, relative paths, case sensitivity per platform, deep nesting, symlink entries matched without traversing targets (no cycles)

### Configuration Detection & Aggregation

- [x] T011 [P] Implement `AgentConfigDetector` class in `src/services/agentConfigDetector.ts` with methods:
  - `detectClaude(workspaceUri: Uri): Promise<AiIgnoreSource | null>` → read `.claude/settings.json` (JSON format; import file read exclusions from `permissions.deny` entries of the form `Read(./path-or-glob)`; research.md)
  - `detectGemini(workspaceUri: Uri): Promise<AiIgnoreSource | null>` → read `.aiexclude` (gitignore-style; research.md)
  - `detectAll(workspaceUri: Uri): Promise<AiIgnoreSource[]>` → run supported detectors in parallel; aggregate results, filtering null returns
  - Handle malformed JSON/gitignore syntax with error messages; graceful degradation (skip invalid sources, log warnings, continue with others)
- [x] T012 [P] Add config detection tests in `test/integration/agentConfigDetector.test.ts`: detect Claude + Gemini formats, handle missing files, parse errors, multi-root workspaces, mixed valid/invalid sources
- [x] T013 Implement workspace settings reader in `src/lib/workspaceSettings.ts`:
  - `getAiIgnorePatternsFromSettings(workspaceUri: Uri): AiIgnorePattern[]` → read `.vscode/settings.json` for `confignore.aiIgnore` array
  - Validate patterns; return only valid patterns; log warnings for invalid
- [x] T014 Create `configAggregator()` function in `src/services/aiIgnoreConfig.ts`:
  - Combine patterns from workspace settings + all detected agent configs
  - Track source provenance (which patterns came from which source)
  - Return `AiIgnoreConfig` object with aggregated patterns, sources, validation state, lastUpdated timestamp
  - Deduplication: remove duplicate patterns while preserving source info

### Two-Tier Caching

- [x] T015 [P] Implement cache layer in `src/services/aiIgnoreCache.ts`:
  - **File-level cache**: `Map<filePath, CacheEntry>` with TTL (30s) for individual file matches
  - **Workspace-level cache**: `Map<workspaceUri, ConfigCacheEntry>` with TTL (60s) for aggregated config
  - `get(key, level)` → return cached value if not expired
  - `set(key, value, level)` → store with timestamp; overwrite on config reload
  - `invalidate(level, pattern?)` → clear file-level if config changes; cascade invalidation
  - Performance requirement: <50ms for file queries with 1000+ patterns
- [x] T016 [P] Add cache tests in `test/unit/aiIgnoreCache.test.ts`: cache hit/miss, TTL expiration, invalidation on config change, cascade behavior, concurrent access

### FileSystemWatcher Integration

- [x] T017 Add FileSystemWatcher in `src/services/configWatcher.ts`:
  - Watch `.vscode/settings.json` for changes
  - Watch for agent config files (`.claude/settings.json`, `.aiexclude`)
  - On change: invalidate cache, re-detect configs, broadcast reload event
  - Cleanup on extension deactivate
- [x] T018 Add watcher tests in `test/integration/configWatcher.test.ts`: file change detection, cache invalidation, multi-root workspace watching

---

## Phase 3: User Story 1 - Configure AI Agent Ignore Patterns (P1)

Implement core pattern configuration in workspace settings and agent-specific files.

**Story Goal**: Developers can configure and manage AI ignore patterns through VS Code settings and agent configs.
**Test Criteria**: Configure patterns via settings, detect agent configs, validate patterns, aggregate sources, handle errors gracefully.

### Configuration Parsing & Validation

- [x] T019 [US1] Implement `parseAiIgnoreConfig(workspaceUri: Uri): Promise<AiIgnoreConfig>` in `src/services/aiIgnoreResolver.ts`:
  - Call workspace settings reader (T013)
  - Call config detector to find agent files (T011)
  - Call pattern validator on each pattern (T007)
  - Aggregate via configAggregator (T014)
  - Return `AiIgnoreConfig` with all patterns, sources, validation state
  - Handle workspace not found, invalid patterns, partial loading
- [x] T020 [P] [US1] Add config parsing tests in `test/unit/aiIgnoreResolver.test.ts`:
  - Parse valid config (settings + agent files)
  - Handle missing files gracefully
  - Validate malformed patterns and report errors
  - Deduplicate patterns across sources
  - Track source provenance
- [x] T021 [US1] Implement schema validation in `src/lib/schemaValidator.ts`:
  - Validate `.vscode/settings.json` confignore.aiIgnore array against schema (T003)
  - Report schema errors: missing array, invalid pattern format, unknown config keys
  - Used for static UI validation in settings editor
- [x] T022 [P] [US1] Add schema validation tests in `test/unit/schemaValidator.test.ts`:
  - Valid config schema
  - Invalid patterns (type mismatch, format errors)
  - Complete coverage of schema constraints

### Error Handling & User Feedback

- [X] T023 [US1] Implement error handling in `src/services/aiIgnoreResolver.ts`:
  - Catch pattern parsing errors; log with context
  - Show VS Code notification for invalid patterns (`.showErrorMessage()`)
  - Graceful degradation: skip invalid patterns, continue with valid ones
  - Log all errors to pino logger with file/line context
- [X] T024 [US1] Create error message templates in `src/strings/errors.ts`:
  - "Invalid AI ignore pattern: {pattern} - {reason}"
  - "Failed to read agent config: {file} - {error}"
  - "AI ignore config partially loaded: {count} patterns invalid"
  - "No AI ignore configuration detected"
- [X] T025 [P] [US1] Add error handling tests in `test/integration/errorHandling.test.ts`:
  - Malformed pattern handling
  - Agent config parsing errors
  - Workspace initialization errors
  - Error notification display

### Integration with Feature 001

- [ ] T026 [US1] Extend feature 001 infrastructure in `src/models/types.ts`:
  - Add `'ai'` variant to existing `IgnoreType` enum
  - Ensure `AiIgnoreStatus` compatible with feature 001's `IgnoreStatus` structure
  - Reuse existing `matchPattern` and glob utilities from feature 001
- [ ] T027 [P] [US1] Add integration tests in `test/integration/feature001Integration.test.ts`:
  - Verify AI ignore works independently from gitignore
  - Confirm feature 001 utilities reused for pattern matching
  - Check context key compatibility

---

## Phase 4: User Story 2 - Display AI-Specific Ignore Status (P1)

Implement visual indicators (badge decorations) for AI-ignored files in file explorer.

**Story Goal**: Developers can see which files are ignored for AI agents via visual badges in the file explorer.
**Test Criteria**: Badge rendered for matching files, no conflicts with other decorations, hover tooltips show ignore source, performance <100ms.

### File Decoration Provider

- [ ] T028 [US2] Implement `AiIgnoreDecorationProvider` class in `src/services/decorationProvider.ts`:
  - Extend `vscode.FileDecorationProvider` interface
  - `provideFileDecoration(uri: Uri): FileDecoration | undefined` → check if file ignored for AI
  - Render badge icon (custom SVG or glyph) overlaid on file icon
  - Return `FileDecoration` with badge, tooltip (which source ignored it)
  - Separate decoration layer (no color tinting, avoid conflicts with SCM/linter decorations)
- [ ] T029 [US2] Create badge icon assets in `src/assets/`:
  - `badge-ai-ignored.svg` (small icon for file explorer)
  - Ensure readable at small size, consistent with VS Code design language
- [ ] T030 [P] [US2] Add decoration rendering tests in `test/integration/decorationProvider.test.ts`:
  - Badge rendered for ignored files
  - Badge not rendered for non-ignored files
  - Badge composition with other extensions' decorations (no conflicts)
  - Tooltip shows correct source (workspace settings vs agent config)
  - Performance: <100ms rendering time

### File Decoration Registration

- [ ] T031 [US2] Register decoration provider in `src/extension.ts`:
  - Create `AiIgnoreDecorationProvider` instance
  - Register with `vscode.window.registerFileDecorationProvider()`
  - Add to extension context subscriptions for cleanup
  - Trigger re-render on config reload (cache invalidation)
- [ ] T032 [US2] Implement re-render on config change in `src/services/decorationProvider.ts`:
  - Listen to config reload events
  - Call `fireDidChange()` to notify VS Code of decoration updates
  - Only re-render affected files (optimization)
- [ ] T033 [P] [US2] Add registration tests in `test/integration/extensionActivation.test.ts`:
  - Decoration provider registered on activation
  - Re-renders on config reload
  - Cleanup on deactivation

### Context Keys for Conditional UI

- [ ] T034 [US2] Implement context key management in `src/services/contextKeys.ts`:
  - `confignore.aiIgnoredFile` → true if selected file is ignored for AI
  - `confignore.aiIgnoreConfigured` → true if any AI ignore patterns exist
  - Update on file selection change
  - Update on config reload
  - Reuse feature 001's context key infrastructure
- [ ] T035 [P] [US2] Add context key tests in `test/unit/contextKeys.test.ts`:
  - Set correctly for ignored/non-ignored files
  - Update on file selection
  - Update on config change

### Hover Tooltips & Information Display

- [ ] T036 [US2] Implement tooltip generation in `src/lib/tooltips.ts`:
  - `generateIgnoreTip(filePath, sources): string` → "File ignored for AI by: workspace settings, .claude/settings.json"
  - Format source list with file paths
  - Include pattern that matched (if determinable)
- [ ] T037 [P] [US2] Add tooltip tests in `test/unit/tooltips.test.ts`:
  - Single source tooltip
  - Multiple source tooltip
  - Format consistency

---

## Phase 5: User Story 3 - Query AI-Specific Ignore Status Programmatically (P2)

Implement public command API for other extensions to check AI ignore status.

**Story Goal**: Other extensions and AI tools can query which files are ignored for AI agents via command API.
**Test Criteria**: Command returns accurate boolean, handles edge cases (nested patterns, no config), performance <50ms.

### Primary Command Implementation

- [ ] T038 [US3] Implement `confignore.isIgnoredForAI` command in `src/extension.ts`:
  - `registerCommand('confignore.isIgnoredForAI', (fileUri: Uri) => Promise<boolean>)`
  - Call `aiIgnoreResolver.isIgnoredForAI(fileUri)` (main resolver method)
  - Return `true` if file matches any pattern, `false` otherwise
  - Handle errors: invalid URI, workspace not accessible → throw clear error message
  - Performance requirement: <50ms (99th percentile) with 1000+ patterns
- [ ] T039 [P] [US3] Add command tests in `test/integration/commands.test.ts`:
  - Command returns true for ignored files
  - Command returns false for non-ignored files
  - Handles nested directory patterns
  - Performance: <50ms execution (measure with benchmark)
  - Error cases: invalid URI, workspace unavailable

### AiIgnoreResolver Main Method

- [x] T040 [US3] Implement `isIgnoredForAI(fileUri: Uri): Promise<boolean>` in `src/services/aiIgnoreResolver.ts`:
  - Get workspace from fileUri
  - Load `AiIgnoreConfig` from cache or parse fresh (with TTL)
  - Match filePath against aggregated patterns (including negation)
  - Return boolean result
  - Use caching layer for performance (file-level cache)
  - Handle relative path conversion (fileUri → relative to workspace)
- [ ] T041 [P] [US3] Add resolver tests in `test/unit/aiIgnoreResolver.test.ts`:
  - Basic matching: ignored/not ignored
  - Negation patterns (exceptions to broad exclusions)
  - Nested paths and deep directory structures
  - Relative path handling
  - Cache behavior (miss on first call, hit on second)

### Helper Commands

- [ ] T042 [US3] Implement `confignore.openAiIgnoreSettings` command in `src/extension.ts`:
  - Open `.vscode/settings.json` in editor
  - Position cursor at `confignore.aiIgnore` array (if exists)
  - Provide snippet/IntelliSense for common patterns
- [ ] T043 [US3] Implement `confignore.reloadAiIgnoreConfig` command in `src/extension.ts`:
  - Manually reload all configs (normally auto-reloading on file save)
  - Invalidate all caches
  - Re-detect agent configs
  - Update decorations
  - Return when complete
- [ ] T044 [US3] Implement `confignore.showAiIgnoreStatus` command in `src/extension.ts`:
  - Get currently selected file from editor
  - Evaluate AI ignore status via `isIgnoredForAI()`
  - Show information message: "File {name} is [ignored|not ignored] for AI: {reason}"
  - Include patterns that matched (if ignored)
- [ ] T045 [P] [US3] Add helper command tests in `test/integration/helperCommands.test.ts`:
  - Settings command opens correct file
  - Reload command invalidates caches and updates decorations
  - Show status command displays correct information

### Multi-Root Workspace Support

- [ ] T046 [US3] Implement multi-root support in `src/services/aiIgnoreResolver.ts`:
  - `vscode.workspace.workspaceFolders` → iterate all folders
  - Determine which folder a fileUri belongs to
  - Load config for appropriate workspace folder
  - Aggregate patterns across all folders (each folder's settings respected)
- [ ] T047 [P] [US3] Add multi-root tests in `test/integration/multiRootWorkspace.test.ts`:
  - Multiple workspace folders with different configs
  - File in each folder matched against respective config
  - Performance with multi-folder setups

### Performance Validation (Critical for SC-003, SC-005)

- [ ] T048 [CRITICAL] Create performance benchmark tests in `test/integration/performance.test.ts`:
  - Benchmark file query: Execute `isIgnoredForAI()` 1000x with various pattern counts (100, 500, 1000+ patterns); measure p50/p99 latencies; validate <50ms p99 target
  - Benchmark decoration render: Measure `provideFileDecoration()` time across 100+ files; validate <100ms target
  - Benchmark extension init: Measure activation time (parse config + load cache + register providers); validate <200ms overhead target
  - Document baseline with system specs (CPU/RAM) for reproducibility; measure with real glob pattern sets from research.md examples
  - **MUST PASS before PR submission** to validate SC-003, SC-005 success criteria

---

## Dependencies & Completion Order

**Phase Dependency Graph**:

```
Phase 1 (Setup)
  ↓
Phase 2 (Foundation)
  ├→ Phase 3 (US1)
  │   ├→ Phase 4 (US2) [depends on T019, T026]
  │   └→ Phase 5 (US3) [depends on T019, T026]
  └→ (Phases 3, 4, 5 can execute in parallel after Phase 2)
```

**Story Completion Order** (can be implemented in parallel after Phase 2):

1. **US1 (Configuration)**: T019-T027 → Core resolver & config parsing
2. **US2 (Display)**: T028-T037 → Badge decorations (depends on US1 resolver)
3. **US3 (Query API)**: T038-T047 → Public command API (depends on US1 resolver)

**Critical Path**:

- Setup (Phase 1): 6 tasks → 1-2 days
- Foundation (Phase 2): 8 tasks → 3-4 days
  **Phase 5 (US3 - Query API)**: 11 tasks → 1-2 days
- **Total**: ~12-16 days (2-3 weeks)

---

## Parallel Execution Examples

### After Phase 2 Complete

**Team Setup** (if 2-3 developers):

- **Developer 1**: US1 Configuration (T019-T027) — core resolver, pattern validation
- **Developer 2**: US2 Display (T028-T037) — decoration provider, context keys
- **Developer 3**: US3 Query API (T038-T047) — command handlers, helper commands

**Individual Developer** (sequential):

1. Complete Phase 2 (foundation)
2. Execute T019-T027 (US1) sequentially
3. Execute T028-T037 (US2) sequentially
4. Execute T038-T047 (US3) sequentially

---

## Testing Strategy

**Test Coverage Targets** (per spec.md):

- **Unit Tests** (~70% on validation/matching logic):
  - Pattern validation: T008, T010, T022, T025
  - Caching behavior: T016
  - Context key management: T035
  - Tooltip generation: T037
  - Command implementations: T039, T041, T045

- **Integration Tests** (~60% on multi-source aggregation):
  - Config detection: T012, T018
  - Feature 001 integration: T027
  - Decoration rendering: T030, T033
  - Command execution: T039, T045, T047
  - Error handling: T025
  - Multi-root support: T047

**Test Execution**:

- Run tests after each phase: `pnpm test`
- Measure coverage: `pnpm test --coverage`
- Integration tests require VS Code extension environment: `pnpm test:integration`

**Performance Validation**:

- File query <50ms: Benchmark T041 with 1000+ patterns
- Decoration render <100ms: Test T030 with large file trees
- Extension init overhead <200ms: Measure T031 + T034 activation time

---

## Implementation Checklist

Use this checklist to track progress through all tasks:

- [ ] **Phase 1**: T001-T006 (Setup)
- [ ] **Phase 2**: T007-T018 (Foundation)
- [ ] **Phase 3**: T019-T027 (US1 Configuration)
- [ ] **Phase 4**: T028-T037 (US2 Display)
- [ ] **Phase 5**: T038-T048 (US3 Query API + Performance)
- [ ] All tests passing: `pnpm test`
- [ ] Code coverage: Unit ~70%, Integration ~60%
- [ ] Performance targets met: <50ms queries, <100ms rendering, <200ms init (measured in T048)
- [ ] oxlint: 0 violations
- [ ] TypeScript: 0 errors (tsc --noEmit)
- [ ] **Ready for PR**: All tasks complete, tests passing, performance benchmarks passed
