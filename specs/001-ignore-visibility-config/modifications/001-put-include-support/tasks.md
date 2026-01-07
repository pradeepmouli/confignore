# Tasks: Feature Flag for Include Support (Modification 001-mod-001)

**Input**: Modification documents from `/specs/001-ignore-visibility-config/modifications/001-put-include-support/`
**Prerequisites**: modification-spec.md, plan.md, research.md, data-model.md, contracts/

**Context**: This is a modification to feature 001-ignore-visibility-config to add a feature flag that gates include/unignore functionality. The flag defaults to `false` for progressive rollout.

## Format: `- [ ] [ID] [P?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1: Configuration Setup

**Purpose**: Define feature flag in VS Code configuration schema

- [ ] T001 Add `ignorer.features.includeSupport` to `contributes.configuration` in package.json
- [ ] T002 Verify configuration appears in VS Code settings UI (manual smoke test)

**Checkpoint**: Feature flag setting available in VS Code settings

---

## Phase 2: Feature Flag Infrastructure

**Purpose**: Core infrastructure to read and track feature flag state

- [ ] T003 [P] Create utility function to read `ignorer.features.includeSupport` config in src/extension.ts
- [ ] T004 [P] Implement configuration change listener for `ignorer.features` in src/extension.ts
- [ ] T005 Add context key setter for `ignorer.features.includeSupport` in src/services/contextKeys.ts

**Checkpoint**: Can read flag value and set context key at runtime

---

## Phase 3: Command Registration Gating

**Purpose**: Conditionally register include commands based on feature flag

- [ ] T006 Modify activation function to read feature flag in src/extension.ts
- [ ] T007 Wrap include command registration in conditional block (flag === true) in src/extension.ts
- [ ] T008 Ensure ignore command registration remains unconditional in src/extension.ts
- [ ] T009 Add configuration change handler to update context key in src/extension.ts

**Checkpoint**: Include commands only registered when flag is enabled; ignore commands always registered

---

## Phase 4: Menu Visibility Gating

**Purpose**: Update menu contributions to check feature flag via context keys

- [ ] T010 Update include command `when` clauses to include `ignorer.features.includeSupport &&` in package.json
- [ ] T011 Verify ignore command `when` clauses remain unchanged in package.json

**Checkpoint**: Include menu items only visible when flag enabled AND selection is excluded

---

## Phase 5: State Resolution Optimization

**Purpose**: Skip include-state computation when feature disabled for performance

- [ ] T012 Add feature flag check at start of state resolution in src/services/stateResolver.ts
- [ ] T013 Skip include-state computation when flag is false in src/services/stateResolver.ts
- [ ] T014 Ensure ignore-state computation always runs (needed for hiding ignore commands) in src/services/stateResolver.ts

**Checkpoint**: State resolver respects feature flag; performance optimized when disabled

---

## Phase 6: User Notifications

**Purpose**: Inform users when feature flag changes and reload is needed

- [ ] T015 Implement notification on config change in src/extension.ts
- [ ] T016 Add "Reload Window" action button to notification in src/extension.ts
- [ ] T017 Differentiate "enabled" vs "disabled" notification messages in src/extension.ts

**Checkpoint**: Users notified clearly when flag changes with actionable reload option

---

## Phase 7: Documentation

**Purpose**: Document the feature flag for end users and developers

- [ ] T018 Add "Experimental Features" section to README.md
- [ ] T019 Document `ignorer.features.includeSupport` setting with enablement steps in README.md
- [ ] T020 Note reload requirement in README.md
- [ ] T021 Add rollout plan summary (alpha/beta/GA phases) to README.md

**Checkpoint**: Users can discover and enable the feature flag via documentation

---

## Phase 8: Testing - Flag Disabled (Default State)

**Purpose**: Verify backward compatibility and default behavior

- [ ] T022 [P] Add test utility to disable feature flag in test setup in test/unit/contextKeys.test.ts
- [ ] T023 [P] Test that include commands are NOT registered when flag is false in test/integration/commands.test.ts
- [ ] T024 [P] Test that ignore commands ARE registered when flag is false in test/integration/commands.test.ts
- [ ] T025 [P] Test that context key `ignorer.features.includeSupport` is false in test/unit/contextKeys.test.ts
- [ ] T026 [P] Test that include menu items are hidden when flag is false in test/integration/commands.test.ts
- [ ] T027 [P] Test that state resolver skips include computation when flag is false in test/unit/stateResolver.test.ts

**Checkpoint**: All tests pass with flag disabled (default state); backward compatible

---

## Phase 9: Testing - Flag Enabled (Opt-In State)

**Purpose**: Verify include functionality works when opted in

- [ ] T028 [P] Add test utility to enable feature flag in test setup in test/unit/contextKeys.test.ts
- [ ] T029 [P] Test that include commands ARE registered when flag is true in test/integration/commands.test.ts
- [ ] T030 [P] Test that context key `ignorer.features.includeSupport` is true in test/unit/contextKeys.test.ts
- [ ] T031 [P] Test that include menu items are visible when flag is true AND selection excluded in test/integration/commands.test.ts
- [ ] T032 [P] Test that state resolver computes include state when flag is true in test/unit/stateResolver.test.ts

**Checkpoint**: All original include functionality works when flag is enabled

---

## Phase 10: Testing - Configuration Changes

**Purpose**: Verify dynamic behavior when flag is toggled

- [ ] T033 Test configuration change listener fires when flag changes in test/unit/contextKeys.test.ts
- [ ] T034 Test context key updates when configuration changes in test/unit/contextKeys.test.ts
- [ ] T035 Test notification shown when flag changes in test/integration/commands.test.ts

**Checkpoint**: Configuration changes handled correctly at runtime

---

## Phase 11: Regression Testing

**Purpose**: Ensure original ignore functionality is unaffected

- [ ] T036 Run full original feature test suite with flag disabled
- [ ] T037 Verify all ignore commands still work correctly
- [ ] T038 Verify context menu visibility for ignore commands unchanged
- [ ] T039 Verify config-based exclude updates still work

**Checkpoint**: Zero regression in existing ignore functionality

---

## Phase 12: Build and Quality Gates

**Purpose**: Ensure code quality and production readiness

- [ ] T040 Run TypeScript type check: `npm run typecheck` (or equivalent)
- [ ] T041 Run linter: `npm run lint` - zero new warnings
- [ ] T042 Run formatter check: `npm run format:check` (if applicable)
- [ ] T043 Build production bundle: `npm run build` or `npm run compile`
- [ ] T044 Verify bundle size impact is minimal (<5KB increase)

**Checkpoint**: All quality gates pass

---

## Phase 13: Manual Verification

**Purpose**: End-to-end manual testing before merge

- [ ] T045 Install extension locally and verify flag defaults to false
- [ ] T046 Verify include commands NOT in command palette when flag disabled
- [ ] T047 Enable flag via settings UI, verify notification shown
- [ ] T048 Reload window, verify include commands NOW in command palette
- [ ] T049 Test include command on excluded file (should work)
- [ ] T050 Disable flag, reload, verify include commands gone again
- [ ] T051 Verify ignore commands work in all flag states

**Checkpoint**: Manual smoke test passes; ready for merge

---

## Dependencies

**Task Dependencies** (cannot parallelize):

- T006-T009 depend on T003 (need flag reader utility)
- T010-T011 depend on T005 (need context key defined)
- T012-T014 depend on T003 (need flag reader utility)
- T015-T017 depend on T004 (need config change listener)
- T022-T027 can run in parallel (different test files)
- T028-T032 can run in parallel (different test files)
- T040-T044 should run after all implementation and tests complete

**Parallel Execution Opportunities**:

- Phase 2 tasks (T003, T004, T005) can start in parallel
- Phase 8 tests (T022-T027) can run in parallel
- Phase 9 tests (T028-T032) can run in parallel
- T018-T021 documentation tasks can be done anytime after T001

---

## Implementation Strategy

**Recommended Order**:

1. **Setup** (Phase 1): T001-T002 - Get configuration defined
2. **Infrastructure** (Phase 2): T003-T005 - Core flag reading and context
3. **Gating** (Phases 3-5): T006-T014 - Implement conditional behavior
4. **UX** (Phase 6): T015-T017 - User notifications
5. **Testing** (Phases 8-10): T022-T035 - Comprehensive test coverage
6. **Documentation** (Phase 7): T018-T021 - Can be done earlier if preferred
7. **Quality** (Phases 11-12): T036-T044 - Regression and build checks
8. **Verification** (Phase 13): T045-T051 - Final manual validation

**MVP Scope**: Phases 1-5 + T018-T020 (documentation) deliver core functionality

**Estimated Effort**:

- Implementation: ~4-6 hours (Phases 1-7)
- Testing: ~3-4 hours (Phases 8-11)
- Quality & Verification: ~1-2 hours (Phases 12-13)
- **Total**: ~8-12 hours

---

## Success Criteria

- [x] All tasks completed
- [ ] Feature flag defaults to `false`
- [ ] Include commands gated by flag
- [ ] Ignore commands always available
- [ ] Documentation complete
- [ ] Tests pass with flag enabled and disabled
- [ ] Zero regressions
- [ ] Build succeeds
- [ ] Manual verification passes

---

**Status**: Ready for implementation
**Next Step**: Begin with Phase 1 (T001-T002) to define configuration
