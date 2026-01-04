# Tasks: AI Agent Ignore Support

**Input**: Design documents from `/specs/002-ai-agent-ignore/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are omitted per the task generation rules.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing codebase to support AI agent ignore types

- [ ] T001 [P] Extend Source enum in src/models/types.ts to add AI ignore source types (WorkspaceSettingsAiAgent, IgnoreFileAiAgent, AgentConfigClaude, AgentConfigCopilot, AgentConfigCursor, AgentConfigCodeium)
- [ ] T002 [P] Extend EffectiveState interface in src/models/types.ts to add AI ignore fields (aiIgnored, aiIgnoreSource, aiIgnoreReasons)
- [ ] T003 [P] Define AiIgnorePattern type in src/models/types.ts
- [ ] T004 [P] Define AiIgnoreConfig interface in src/models/types.ts with workspaceUri, patterns, sources, lastUpdated, isValid fields
- [ ] T005 [P] Define AiIgnoreSource interface in src/models/types.ts
- [ ] T006 [P] Define AiIgnoreStatus interface in src/models/types.ts with uri, isIgnored, matchedPatterns, source, evaluatedAt fields
- [ ] T007 [P] Define AgentConfigDetectionResult interface in src/models/types.ts
- [ ] T008 [P] Define AgentConfigFile interface in src/models/types.ts
- [ ] T009 [P] Define AgentConfigError interface in src/models/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create aiIgnoreResolver.ts service skeleton in src/services/aiIgnoreResolver.ts with class AiIgnoreResolver and method isIgnored(uri: Uri): Promise<AiIgnoreStatus>
- [ ] T011 Create agentConfigDetector.ts service skeleton in src/services/agentConfigDetector.ts with class AgentConfigDetector and method detectAgentConfigs(workspaceUri: Uri): Promise<AgentConfigDetectionResult>
- [ ] T012 Implement pattern validation helper in src/services/aiIgnoreResolver.ts with validatePattern(pattern: string): PatternValidation function
- [ ] T013 Implement cache structure in src/services/aiIgnoreResolver.ts with AiIgnoreCacheEntry interface and cache Map
- [ ] T014 Implement cache invalidation strategy in src/services/aiIgnoreResolver.ts with invalidateCache(reason: string): void method

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure AI Agent Ignore Patterns (Priority: P1) 🎯 MVP

**Goal**: Enable developers to configure AI agent ignore patterns through workspace settings and detect patterns from agent-specific config files

**Independent Test**: Create workspace settings with `confignore.aiIgnore` array, verify patterns are recognized and parsed without errors. Add `.claude/settings.json` with ignore patterns, verify they are detected and aggregated.

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implement workspace settings reader in src/services/aiIgnoreResolver.ts to load confignore.aiIgnore from VS Code workspace configuration
- [ ] T016 [P] [US1] Implement Claude config detector in src/services/agentConfigDetector.ts to find and parse .claude/settings.json with ignore array extraction
- [ ] T017 [P] [US1] Implement Copilot config detector in src/services/agentConfigDetector.ts to find and parse .copilotignore gitignore-style file
- [ ] T018 [P] [US1] Implement Cursor config detector in src/services/agentConfigDetector.ts to find and parse .cursorignore gitignore-style file
- [ ] T019 [P] [US1] Implement Codeium config detector in src/services/agentConfigDetector.ts to find and parse .codeiumignore gitignore-style file
- [ ] T020 [US1] Implement pattern aggregation logic in src/services/agentConfigDetector.ts to combine patterns from all detected sources with deduplication
- [ ] T021 [US1] Implement error handling for agent config parsing in src/services/agentConfigDetector.ts with graceful degradation for malformed JSON, missing fields, file permission errors
- [ ] T022 [US1] Implement config validation in src/services/aiIgnoreResolver.ts to validate each pattern for glob syntax and log warnings for invalid patterns
- [ ] T023 [US1] Wire up AiIgnoreResolver to load config from workspace settings and agentConfigDetector in src/services/aiIgnoreResolver.ts constructor
- [ ] T024 [US1] Register onDidChangeConfiguration listener in src/extension.ts to invalidate cache when workspace settings change
- [ ] T025 [US1] Register FileSystemWatcher for .claude/settings.json in src/extension.ts to invalidate cache when agent config files change
- [ ] T026 [US1] Register FileSystemWatcher for .copilotignore in src/extension.ts to invalidate cache when agent config files change
- [ ] T027 [US1] Register FileSystemWatcher for .cursorignore in src/extension.ts to invalidate cache when agent config files change
- [ ] T028 [US1] Register FileSystemWatcher for .codeiumignore in src/extension.ts to invalidate cache when agent config files change

**Checkpoint**: At this point, User Story 1 should be fully functional - AI patterns are configured and detected from multiple sources

---

## Phase 4: User Story 2 - Display AI-Specific Ignore Status (Priority: P1)

**Goal**: Provide visual feedback in VS Code file explorer showing which files are ignored for AI agents with badge overlays

**Independent Test**: Configure AI ignore patterns, verify badge overlays appear on matching files in file explorer. Hover over badges to see tooltips explaining the ignore scope.

### Implementation for User Story 2

- [ ] T029 [P] [US2] Implement pattern matching logic in src/services/aiIgnoreResolver.ts using existing glob matching from feature 001 (reuse lib/patterns.ts utilities)
- [ ] T030 [P] [US2] Implement cache lookup in src/services/aiIgnoreResolver.ts isIgnored method to check cache before evaluating patterns
- [ ] T031 [P] [US2] Implement pattern evaluation in src/services/aiIgnoreResolver.ts isIgnored method to match file URI against all AI ignore patterns
- [ ] T032 [P] [US2] Implement cache write in src/services/aiIgnoreResolver.ts isIgnored method to store evaluation results in cache
- [ ] T033 [US2] Extend stateResolver.ts to call aiIgnoreResolver.isIgnored and populate EffectiveState aiIgnored fields in src/services/stateResolver.ts
- [ ] T034 [US2] Extend contextKeys.ts to register confignore.aiIgnoredFile context key in src/services/contextKeys.ts
- [ ] T035 [US2] Extend contextKeys.ts to register confignore.aiIgnoreConfigured context key in src/services/contextKeys.ts
- [ ] T036 [US2] Update contextKeys.ts to set confignore.aiIgnoredFile based on currently selected file's AI ignore status in src/services/contextKeys.ts
- [ ] T037 [US2] Update contextKeys.ts to set confignore.aiIgnoreConfigured based on whether any AI patterns exist in src/services/contextKeys.ts
- [ ] T038 [US2] Register file decoration provider in src/extension.ts for AI ignored files with badge overlay icon
- [ ] T039 [US2] Implement decoration provider logic to apply badge to files where aiIgnored is true in src/extension.ts
- [ ] T040 [US2] Add tooltip text to badge decorations showing "Ignored for AI agents" in src/extension.ts
- [ ] T041 [US2] Handle decoration updates on file tree render with <100ms latency target in src/extension.ts
- [ ] T042 [US2] Handle decoration updates when AI ignore config changes in src/extension.ts by listening to cache invalidation events

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - patterns configured, files decorated with badges

---

## Phase 5: User Story 3 - Query AI-Specific Ignore Status Programmatically (Priority: P2)

**Goal**: Expose VS Code command API for other extensions to query whether files are ignored for AI agents

**Independent Test**: Create test extension that invokes confignore.isIgnoredForAI command with various file paths, verify correct boolean results returned for ignored/not-ignored files.

### Implementation for User Story 3

- [ ] T043 [P] [US3] Implement confignore.isIgnoredForAI command handler in src/extension.ts that accepts Uri parameter and returns Promise<boolean>
- [ ] T044 [P] [US3] Implement confignore.openAiIgnoreSettings command handler in src/extension.ts to open .vscode/settings.json and position cursor at confignore.aiIgnore
- [ ] T045 [P] [US3] Implement confignore.reloadAiIgnoreConfig command handler in src/extension.ts to manually trigger config reload and cache invalidation
- [ ] T046 [P] [US3] Implement confignore.showAiIgnoreStatus command handler in src/extension.ts to display information message with file's AI ignore status
- [ ] T047 [US3] Register confignore.isIgnoredForAI command in package.json commands section with title "Check if file is ignored for AI"
- [ ] T048 [US3] Register confignore.openAiIgnoreSettings command in package.json commands section with title "Open AI Ignore Settings"
- [ ] T049 [US3] Register confignore.reloadAiIgnoreConfig command in package.json commands section with title "Reload AI Ignore Configuration"
- [ ] T050 [US3] Register confignore.showAiIgnoreStatus command in package.json commands section with title "Show AI Ignore Status"
- [ ] T051 [US3] Add error handling to confignore.isIgnoredForAI for invalid file URI with graceful degradation returning false
- [ ] T052 [US3] Add error handling to confignore.isIgnoredForAI for workspace not open with graceful degradation returning false
- [ ] T053 [US3] Optimize confignore.isIgnoredForAI to use cache for <50ms query performance even with 1000+ patterns
- [ ] T054 [US3] Add confignore.aiIgnoredFile context key to package.json when clause for menu visibility
- [ ] T055 [US3] Add confignore.aiIgnoreConfigured context key to package.json when clause for command palette visibility

**Checkpoint**: All user stories should now be independently functional - configure, display, and query AI ignore status

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T056 [P] Add comprehensive JSDoc documentation to all public methods in src/services/aiIgnoreResolver.ts
- [ ] T057 [P] Add comprehensive JSDoc documentation to all public methods in src/services/agentConfigDetector.ts
- [ ] T058 [P] Update package.json with feature 002 activation events (onStartupFinished, onWorkspaceContains:.vscode/settings.json)
- [ ] T059 [P] Update package.json configuration schema to include confignore.aiIgnore setting with array type and description
- [ ] T060 [P] Update README.md to document AI agent ignore feature with configuration examples
- [ ] T061 [P] Update CHANGELOG.md to add feature 002 release notes
- [ ] T062 Run typecheck (tsc --noEmit) to ensure no TypeScript errors
- [ ] T063 Run linting (oxlint, ESLint) to ensure no new warnings
- [ ] T064 Run formatter (oxfmt) to ensure consistent code style
- [ ] T065 Build extension (esbuild) to verify production build succeeds
- [ ] T066 Manual integration test following specs/002-ai-agent-ignore/quickstart.md scenarios to validate end-to-end workflows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): Can start after Foundational - No dependencies on other stories
  - User Story 2 (Phase 4): Can start after Foundational - No dependencies on other stories (decorations can work independently)
  - User Story 3 (Phase 5): Can start after Foundational - No dependencies on other stories (commands can work independently)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Ideally after US1 for pattern availability but can work with empty patterns
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Ideally after US1 for pattern availability but can work with empty patterns

**Note**: While US2 and US3 benefit from US1's pattern configuration, they are designed to work independently (gracefully handling empty pattern sets). This enables parallel development if team capacity allows.

### Within Each User Story

**User Story 1 (Configure AI Patterns)**:
- Types and interfaces (T001-T009) must complete first
- Foundation services (T010-T014) must complete before config detection
- Config detection (T015-T022) can run in parallel after foundation
- Integration (T023-T028) runs after detection logic completes

**User Story 2 (Display AI Status)**:
- Pattern matching (T029-T032) can run in parallel after foundation
- State resolver integration (T033) depends on pattern matching
- Context keys (T034-T037) can run in parallel after state resolver
- Decorations (T038-T042) depend on context keys

**User Story 3 (Command API)**:
- All command handlers (T043-T046) can run in parallel after foundation
- package.json registration (T047-T055) can run in parallel after handlers

### Parallel Opportunities

- **Phase 1 (Setup)**: All type definitions (T001-T009) can run in parallel
- **Phase 3 (US1)**: All config detectors (T015-T019) can run in parallel
- **Phase 3 (US1)**: All FileSystemWatchers (T025-T028) can run in parallel
- **Phase 4 (US2)**: Pattern matching tasks (T029-T032) can run in parallel
- **Phase 4 (US2)**: Context key registrations (T034-T037) can run in parallel
- **Phase 5 (US3)**: All command handlers (T043-T046) can run in parallel
- **Phase 5 (US3)**: All package.json registrations (T047-T055) can run in parallel
- **Phase 6 (Polish)**: Documentation tasks (T056-T061) can run in parallel
- **Across User Stories**: Once foundational phase completes, US1, US2, and US3 can be developed in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all config detectors together:
Task T016: "Implement Claude config detector in src/services/agentConfigDetector.ts"
Task T017: "Implement Copilot config detector in src/services/agentConfigDetector.ts"
Task T018: "Implement Cursor config detector in src/services/agentConfigDetector.ts"
Task T019: "Implement Codeium config detector in src/services/agentConfigDetector.ts"

# Launch all FileSystemWatchers together:
Task T025: "Register FileSystemWatcher for .claude/settings.json"
Task T026: "Register FileSystemWatcher for .copilotignore"
Task T027: "Register FileSystemWatcher for .cursorignore"
Task T028: "Register FileSystemWatcher for .codeiumignore"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2 Only)

1. Complete Phase 1: Setup (type definitions)
2. Complete Phase 2: Foundational (core services)
3. Complete Phase 3: User Story 1 (pattern configuration and detection)
4. Complete Phase 4: User Story 2 (visual indicators)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready

**Rationale**: US1 + US2 provide complete value to end users (configure patterns + see visual feedback). US3 (command API) is valuable for extensibility but not required for core functionality.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic configuration)
3. Add User Story 2 → Test independently → Deploy/Demo (MVP with visual feedback!)
4. Add User Story 3 → Test independently → Deploy/Demo (Full feature with API)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (pattern configuration)
   - Developer B: User Story 2 (decorations)
   - Developer C: User Story 3 (command API)
3. Stories complete and integrate independently

**Note**: Due to architectural design, US2 and US3 can start immediately after foundational phase with graceful empty-pattern handling, enabling true parallel development.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests are NOT included per feature specification (no explicit test requirements)
- Feature extends existing codebase (feature 001) following established patterns
- Reuses existing infrastructure: glob pattern matching (lib/patterns.ts), file I/O (lib/fs.ts), context keys
- Performance targets: decoration updates <100ms, command queries <50ms (maintained by caching)
- Independent evaluation: AI ignore patterns are evaluated separately from gitignore (no precedence relationship)
