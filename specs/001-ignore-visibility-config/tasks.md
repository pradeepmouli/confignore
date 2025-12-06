---

description: "Actionable, dependency-ordered task list for feature implementation"

---

# Tasks: Ignore visibility and config updates

**Input**: Design documents from `/specs/001-ignore-visibility-config/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Minimal tests are included to satisfy repo constitution; not full TDD.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

---

## ⚠️ Current Implementation Status (Updated: 2025-12-06)

**Feature Flag Added**: The smart menu visibility feature is now controlled by `confignore.enableSmartMenuVisibility` setting (default: `false`).

**Completion Summary**:
- ✅ **Phase 1 (Setup)**: Complete - All infrastructure and package.json contributions added
- ✅ **Phase 2 (Foundational)**: Mostly complete - Core types and activation done; lib utilities simplified into services
- ⚠️ **Phase 3 (User Story 1)**: Partial - Menu visibility logic implemented but disabled by feature flag due to incomplete state resolver
- ❌ **Phase 4 (User Story 2)**: Not implemented - Advanced state resolution pending
- ⚠️ **Phase 5 (User Story 3)**: Partial - Basic config target support; include command not functional
- ⚠️ **Phase N (Polish)**: Partial - Documentation updated; optimization and cleanup pending

**Legend**:
- `[x]` = Fully implemented and tested
- `[~]` = Partially implemented or simplified
- `[ ]` = Not implemented

---

## Format: `[ID] [P?] [Story] Description`

- [P]: Can run in parallel (different files, no dependencies)
- [Story]: US1, US2, US3 for story phases; omit in Setup/Foundational/Polish
- Include exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare structure and contributions needed for feature work.

- [x] T001 Create service/lib/model scaffolding per plan in src/services/, src/lib/, src/models/ (src/services/ and src/models/ created; src/lib/ omitted - simplified in services)
- [x] T002 Add new "Include" command contribution in `package.json` (contributes.commands)
- [x] T003 Add `confignore.addToIgnore.tsconfig` to submenu in `package.json` (contributes.menus.confignore.submenu)
- [x] T004 Define new context keys usage in menus (`confignore.selectionExcluded`, `confignore.selectionMixed`) in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core building blocks required before user stories.

- [x] T005 [P] Implement core types in `src/models/types.ts` (EffectiveState, Source, ConfigTarget)
- [ ] T006 [P] Implement safe fs helpers in `src/lib/fs.ts` (atomic read/write, JSON/JSONC handling) — Omitted: simplified implementation in services
- [ ] T007 [P] Implement path/pattern utilities in `src/lib/patterns.ts` — Omitted: simplified implementation in services
- [x] T008 Wire basic activation scaffolding in `src/extension.ts` (register context updater, empty stubs)

**Checkpoint**: Foundation ready — user stories can begin.

---

## Phase 3: User Story 1 — Hide/Show correct menu actions (Priority: P1) 🎯 MVP

**Goal**: When selection is excluded by any supported source, hide "Ignore" actions and show "Include"; otherwise inverse.

**Independent Test**: In a workspace with existing ignore/config rules, selecting a path shows correct menu visibility without changing files.

### Implementation

- [~] T009 [P] [US1] Implement selection state resolver in `src/services/stateResolver.ts` (read-only evaluation across sources; implement precedence: config > ignore > workspace) — Placeholder implementation; behind feature flag (disabled by default)
- [x] T010 [P] [US1] Implement context key setter in `src/services/contextKeys.ts` (set `confignore.selectionExcluded`, `confignore.selectionMixed`)
- [~] T011 [US1] Update `src/extension.ts` to subscribe to selection changes and call resolver → context setter — Implemented but disabled by feature flag `enableSmartMenuVisibility` (default: false)
- [x] T012 [US1] Update `package.json` menus to use when-clauses:
  - Show Include when `confignore.selectionExcluded`
  - Show Ignore submenu when `confignore.selectionMixed || !confignore.selectionExcluded`
- [x] T013 [US1] Add minimal unit tests for resolver happy path in `test/unit/stateResolver.test.ts`
- [x] T014 [US1] Add minimal unit tests for context keys in `test/unit/contextKeys.test.ts`

**Checkpoint**: Context menu reflects effective state accurately; no file writes. **NOTE**: Feature disabled by default due to incomplete implementation.

---

## Phase 4: User Story 2 — Show ignore actions when not excluded (Priority: P2)

**Goal**: Ensure visibility logic fully handles the inverse case and mixed selections.

**Independent Test**: With items not excluded, show "Ignore" actions and hide "Include"; with mixed-state multi-select, reflect `selectionMixed`.

### Implementation

- [ ] T015 [P] [US2] Enhance resolver to handle nested parent exclusions and child negations in `src/services/stateResolver.ts`
- [ ] T016 [P] [US2] Handle multi-selection aggregation and set `selectionMixed` in `src/services/contextKeys.ts`
- [ ] T017 [US2] Expand unit tests for mixed-state and negation cases in `test/unit/stateResolver.test.ts`

**Checkpoint**: Visibility works for non-excluded and mixed selections.

---

## Phase 5: User Story 3 — Update config-based include/exclude (Priority: P3)

**Goal**: Support updates to config targets (TypeScript, Prettier, ESLint); do not auto-create missing files.

**Independent Test**: With tsconfig/eslint/prettier present, exclude/include modifies config accordingly; when absent, shows message and no write.

### Implementation

- [~] T018 [P] [US3] Implement config target IO for TypeScript in `src/services/configTargets.ts` (read/write include/exclude) — Basic reader implemented; writer in command handler
- [~] T019 [P] [US3] Implement config target IO for Prettier in `src/services/configTargets.ts` — Basic reader implemented (simplified)
- [~] T020 [P] [US3] Implement config target IO for ESLint in `src/services/configTargets.ts` — Basic reader implemented (simplified)
- [x] T021 [US3] Implement `confignore.addToIgnore.tsconfig` command handler in `src/extension.ts` using writers
- [~] T022 [US3] Add new `confignore.include` command handler in `src/extension.ts` to remove exclusions per precedence — Placeholder implementation (not yet functional)
- [x] T023 [US3] Guard actions when config missing (info message), no file creation
- [x] T024 [US3] Add unit tests for writers in `test/unit/configTargets.test.ts`
- [x] T025 [US3] Add integration tests for commands in `test/integration/commands.test.ts`

**Checkpoint**: Config updates functional; include/exclude flows work where configs exist. **NOTE**: Include command not yet implemented; basic exclude functionality working.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements.

- [x] T026 [P] Documentation updates in `specs/001-ignore-visibility-config/quickstart.md` and `README.md`
- [ ] T027 Code cleanup and refactoring (reduce duplication between targets)
- [ ] T028 Performance pass on resolver (batch file reads, cache per workspace)
- [~] T029 [P] Additional unit tests for edge cases in `test/unit/` — Basic tests implemented; edge cases need work
- [x] T030 Update CHANGELOG and bump version in `package.json` — CHANGELOG updated; version kept at 0.0.3

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup
- User Stories (Phase 3+): Depend on Foundational; then can proceed P1 → P2 → P3 or in parallel by team
- Polish: After desired stories

### User Story Dependencies

- US1 (P1): After Foundational — no other story deps
- US2 (P2): After Foundational — enhances US1 behavior but testable independently
- US3 (P3): After Foundational — independent of US1/US2 for write paths; uses resolver where helpful

### Within Each User Story

- Implement minimal tests after core logic to satisfy constitution
- Resolver/context before menu wiring; writers before commands

### Parallel Opportunities

- [P] tasks in different files (types, fs, patterns, writers) can run concurrently
- US3 writers for different targets (tsconfig/prettier/eslint) in parallel
- Unit tests across files can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (Phase 1)
2. Complete Foundational (Phase 2)
3. Implement US1 (Phase 3)
4. Validate with Quickstart

### Incremental Delivery

1. Foundation ready → US1 → demo
2. Add US2 (mixed-state robustness) → demo
3. Add US3 (config updates) → demo

---

## Summary

- Total tasks: 30
- Per story: US1 (6), US2 (3), US3 (8)
- Parallel opportunities: Marked [P] across phases
- Independent tests: Included minimally per story and commands
