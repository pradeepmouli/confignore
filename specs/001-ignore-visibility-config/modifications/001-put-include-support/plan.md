````markdown
# Implementation Plan: Feature Flag for Include Support (Modification 001-mod-001)

**Branch**: `001-mod-001-put-include-support` | **Date**: 2025-12-08
**Original Feature**: [001-ignore-visibility-config](../../spec.md)
**Modification Spec**: [modification-spec.md](./modification-spec.md)

## Summary

Add a feature flag `ignorer.features.includeSupport` (boolean, default `false`) to gate all include/unignore functionality behind a configuration setting. This enables progressive rollout of include support while keeping the extension stable for users who only need ignore functionality.

**Technical Approach**:
- Add VS Code configuration contribution in `package.json`
- Read flag at activation time and conditionally register include commands
- Set context key `ignorer.features.includeSupport` for menu visibility
- Listen to configuration changes and update context key dynamically
- Skip include-state computation in state resolver when flag is disabled
- Update menu contributions with compound `when` clauses
- Document flag in README with clear enablement instructions

## Technical Context

**Language/Version**: TypeScript (^5.9.x) targeting VS Code engine ^1.105.0
**Primary Dependencies**: VS Code extension API; esbuild bundling; ESLint for linting; TypeScript compiler for types
**Storage**: Files in workspace (ignore files, config files); no external storage
**Testing**: @vscode/test-electron + mocha; command-level and service unit tests
**Target Platform**: VS Code Desktop (matching engine ^1.105.0), multi-root aware
**Project Type**: Single VS Code extension project
**Performance Goals**: Configuration read <10ms; context key updates <50ms; no impact on ignore functionality when flag disabled
**Constraints**: Follow repo ESLint rules; type-safe; backward compatible (flag defaults to false); no breaking changes; preserve all ignore functionality
**Scale/Scope**: Single configuration setting affecting command registration and menu visibility

## Constitution Check (Modification Workflow)

**Modification-Specific Gates**:
- [x] Impact analysis complete and accurate (5 files identified)
- [x] Backward compatibility verified (no breaking changes, opt-in only)
- [x] Modified scenarios documented in modification spec
- [x] Tests strategy covers flag enabled/disabled states
- [x] Rollout plan defined (3-phase: Alpha → Beta → GA)

**Standard Gates** (apply to implementation):
- [ ] Typecheck passes (tsc --noEmit)
- [ ] Linting + formatting pass with zero new warnings
- [ ] Production build succeeds (esbuild)
- [ ] Tests pass with flag disabled (default state)
- [ ] Tests pass with flag enabled (opt-in state)
- [ ] Original feature tests still pass (regression prevention)

## Project Structure

### Documentation (this modification)

```text
specs/001-ignore-visibility-config/modifications/001-put-include-support/
├── modification-spec.md      # Created by create-modification.sh
├── impact-analysis.md         # Manual analysis (scanner not found)
├── plan.md                    # This file
├── research.md                # Phase 0 output
├── data-model.md              # Phase 1 output
├── quickstart.md              # Phase 1 output
├── contracts/
│   ├── configuration.schema.json    # Phase 1 output
│   └── extension-commands.md        # Phase 1 output
└── tasks.md                   # Phase 2 output (via /speckit.tasks)
```

### Source Code (modifications to existing)

```text
package.json                   # Add configuration contribution
README.md                      # Document experimental feature flag

src/
├── extension.ts               # Conditional command registration, config listener
├── services/
│   ├── contextKeys.ts         # Add feature flag context key
│   └── stateResolver.ts       # Gate include-state computation

test/
├── integration/
│   └── commands.test.ts       # Add flag enabled/disabled test scenarios
└── unit/
    ├── contextKeys.test.ts    # Add flag context key tests
    └── stateResolver.test.ts  # Add flag gating tests
```

**Structure Decision**: Modifying existing VS Code extension structure. All changes are additive or conditional (gating existing functionality), no new modules required.

## Complexity Tracking

> No constitution violations. Feature flag is minimal complexity pattern for progressive feature rollout.

## Phase 0: Research ✅

**Status**: Complete

**Output**: `research.md` with decisions on:
- Feature flag implementation pattern (VS Code configuration)
- Command registration strategy (conditional at activation)
- Context key gating (compound `when` clauses)
- State resolution optimization (skip when flag disabled)
- Testing strategy (parameterized tests for both flag states)

**Key Findings**:
- Use `contributes.configuration` in package.json
- Read via `vscode.workspace.getConfiguration('ignorer').get('features.includeSupport')`
- Set context key via `setContext` command
- Reload required for command registration changes (acceptable for feature flag)
- Window scope appropriate for this setting

## Phase 1: Design & Contracts ✅

**Status**: Complete

### Data Model (`data-model.md`)
- Added `FeatureFlags` entity with `includeSupport` boolean
- Modified `EffectiveState` to track `includeStateComputed`
- Documented flag → command registration → context key relationships
- Defined validation rules and state transitions for flag changes

### Contracts (`contracts/`)
1. **configuration.schema.json**: JSON schema for feature flag setting
2. **extension-commands.md**: Updated include command preconditions and context key mappings

### Quickstart (`quickstart.md`)
- End-user enablement instructions
- Developer testing guidance (enable/disable in tests)
- Configuration scope explanation
- Expected behavior for both flag states
- Troubleshooting common issues

## Phase 2: Implementation Tasks

**Note**: Detailed task breakdown will be generated by `/speckit.tasks` command. High-level phases below:

### 2.1: Configuration Setup
- Add configuration contribution to `package.json`
- Define schema with description, default, scope
- Verify contribution appears in VS Code settings UI

### 2.2: Feature Flag Infrastructure
- Create `FeatureFlags` service/utility to read configuration
- Implement configuration change listener
- Add context key setter for `ignorer.features.includeSupport`

### 2.3: Command Registration Gating
- Modify `extension.ts` activation to read flag
- Conditionally register include commands based on flag value
- Ensure ignore commands always registered (unchanged)

### 2.4: Context Key Updates
- Update context key evaluation in `contextKeys.ts`
- Add feature flag context key to evaluation logic
- Update menu `when` clauses in `package.json` (compound expressions)

### 2.5: State Resolution Optimization
- Modify `stateResolver.ts` to check feature flag
- Skip include-state computation when flag disabled
- Preserve ignore-state computation (always needed)

### 2.6: User Notifications
- Add configuration change handler
- Show notification when flag changes
- Provide "Reload Window" action button

### 2.7: Documentation
- Add "Experimental Features" section to README
- Document feature flag with enablement steps
- Note reload requirement

### 2.8: Testing
- Add feature flag setup/teardown utilities for tests
- Parameterize existing include tests with flag enabled
- Add tests for flag disabled state (commands not registered)
- Add tests for configuration change handling
- Verify context key updates
- Regression test: ensure ignore functionality unaffected

### 2.9: Verification
- Run full test suite with flag disabled (default)
- Run full test suite with flag enabled
- Manual smoke test: toggle flag, verify menu visibility
- Verify README instructions match actual behavior

## Success Criteria

### Functional
- [x] Configuration setting `ignorer.features.includeSupport` defined in package.json
- [ ] Flag defaults to `false` (disabled)
- [ ] Include commands NOT registered when flag is `false`
- [ ] Include commands registered when flag is `true`
- [ ] Context key `ignorer.features.includeSupport` mirrors configuration value
- [ ] Menu items use compound `when` clauses with feature flag
- [ ] Configuration changes update context key immediately
- [ ] User notified to reload when flag changes
- [ ] Include-state computation skipped when flag `false` (performance)
- [ ] All ignore functionality works regardless of flag value (backward compatibility)

### Testing
- [ ] All tests pass with flag disabled (default state)
- [ ] All tests pass with flag enabled (opt-in state)
- [ ] Tests verify command registration state matches flag
- [ ] Tests verify menu visibility logic
- [ ] Tests verify context key updates on config change
- [ ] Regression tests confirm ignore functionality unaffected
- [ ] Zero new lint/type warnings

### Documentation
- [ ] README documents feature flag in "Experimental Features" section
- [ ] Enablement steps clear and accurate
- [ ] Reload requirement documented
- [ ] quickstart.md provides developer testing guidance

### Performance
- [ ] Configuration read at activation: <10ms
- [ ] Context key updates: <50ms
- [ ] No measurable performance impact when flag disabled
- [ ] Include-state computation skipped measurably when flag disabled

## Rollout Plan

### Phase 1: Alpha Release
- Feature flag defaults to `false`
- Document in README with "Experimental" label
- Early adopters manually enable via settings
- Monitor GitHub issues for feedback

### Phase 2: Beta Testing
- Gather feedback from alpha users
- Fix any reported issues
- Monitor adoption (if telemetry available)
- Ensure stability over 2-4 weeks

### Phase 3: General Availability
- Flip default to `true` in future minor version (e.g., v1.1.0)
- Maintain flag for one more release (deprecate in v1.2.0)
- Remove flag in v1.3.0 (include support always enabled)

### Rollback Strategy
- If critical issues: advise users to set flag to `false`
- Publish patch with default changed back to `false` if necessary
- Fix root cause and re-enable in subsequent release

## Dependencies

**Blocked by**: None
**Blocks**: None (feature flag is independent modification)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Users enable flag, find bugs | Medium | Clear "Experimental" labeling; easy to disable |
| Reload requirement confusing | Low | Clear notification with reload button |
| Tests become complex with parameterization | Low | Good test utilities for flag setup/teardown |
| Flag forgotten after feature stable | Low | Documented rollout plan with removal timeline |

## Open Questions

**All resolved** - see research.md for decisions made.

## Verification Checklist

- [x] Research complete (Phase 0)
- [x] Data model updated (Phase 1)
- [x] Contracts defined (Phase 1)
- [x] Quickstart documented (Phase 1)
- [x] Agent context updated
- [x] Implementation plan complete
- [ ] Tasks breakdown created (via `/speckit.tasks`)
- [ ] Implementation complete
- [ ] All tests passing
- [ ] Documentation accurate
- [ ] Ready for merge

---

**Next Command**: `/speckit.tasks` to generate detailed task breakdown for implementation.
````
