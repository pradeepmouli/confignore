# Modification Spec: Put Include Support Behind a Feature Flag

**Original Feature**: [001-ignore-visibility-config](../../spec.md)
**Modification ID**: 001-mod-001
**Branch**: `001-mod-001-put-include-support`
**Created**: 2025-12-08
**Status**: Implemented

## Input

User description: "put include support behind a feature flag"

## Why Modify?

Progressive rollout and risk mitigation. The include/unignore functionality is complex, involving:

- Menu visibility toggling based on effective ignore state
- Config-based include/exclude updates for TypeScript, Prettier, and ESLint
- Multi-source precedence logic (config > ignore files > workspace settings)

Putting this behind a feature flag allows:

1. **Safer initial release**: Ship core ignore functionality first, enable include support for early adopters
2. **Easier testing**: Enable/disable for specific test scenarios without code changes
3. **Quick rollback**: Disable if production issues arise without redeployment
4. **Gradual rollout**: Beta test with subset of users before full release

## What's Changing?

### Added

- **Feature flag setting**: `ignorer.features.includeSupport` (boolean, default: `false`)
- **Configuration schema**: New setting in `package.json` contributions
- **Runtime gating**: Check feature flag before executing include-related commands
- **Menu visibility gating**: Include/unignore commands only visible when flag is enabled
- **Documentation**: README section explaining the feature flag and how to enable it

### Modified

- **Command registration**: Include/unignore commands conditionally registered based on flag
- **Context key updates**: `contextKeys.ts` checks feature flag before evaluating include command visibility
- **State resolution**: `stateResolver.ts` skips include-state computation when flag is disabled
- **Menu contributions**: Include commands have additional `when` clause checking feature flag

### Removed

- None (no functionality removed, only gated)

### Unchanged (Important to Document)

- **Ignore functionality**: All ignore/exclude commands work regardless of flag state
- **State detection**: Underlying ignore state detection logic remains active (used for both ignore and include)
- **Config target support**: Config file parsing and update logic remains (just gated at execution time)
- **Test coverage**: All tests remain; those for include support will use flag to enable functionality

## Impact Analysis

### Files Affected (from original implementation)

**Will Need Updates**:

- `src/extension.ts` - Register commands conditionally based on feature flag; read configuration
- `src/services/contextKeys.ts` - Add feature flag check to context key evaluation for include commands
- `src/services/stateResolver.ts` - Gate include state resolution behind feature flag
- `package.json` - Add feature flag configuration contribution
- `README.md` - Document the feature flag and how to enable include support

**Unchanged but Referenced**:

- `src/services/configTargets.ts` - Config update logic remains unchanged, just gated at command level
- `src/lib/patterns.ts` - Pattern matching logic unchanged
- `src/lib/fs.ts` - File system utilities unchanged

### Contracts Changed

**Original Contracts** (from `specs/001-ignore-visibility-config/contracts/`):

- `extension-commands.md` - Add precondition that include commands require feature flag enabled

**New Contracts Needed**:

- `configuration.schema.json` - Define feature flag setting schema and defaults

### Tests Requiring Updates

**From Original Feature**:

- All include-related tests in `test/integration/commands.test.ts` - Add setup to enable feature flag
- Context key tests in `test/unit/contextKeys.test.ts` - Add scenarios for flag enabled/disabled
- State resolver tests in `test/unit/stateResolver.test.ts` - Verify include state skipped when flag disabled

**New Tests Needed**:

- Feature flag configuration reading tests
- Command registration conditional logic tests
- Menu visibility with flag enabled vs disabled
- Error/message when user attempts include action with flag disabled (if applicable)

### Database Migrations

- [x] No database changes required

### Dependencies Changed

- [x] No dependency changes required

## Backward Compatibility

**Breaking Changes**: [x] No

**Rationale**: Feature flag defaults to `false`, meaning include support is disabled by default. This matches behavior if the feature were not yet implemented. Users who want include support must explicitly opt-in via configuration.

**Compatibility Checklist**:

- [x] Existing API contracts unchanged (ignore commands work as before)
- [x] Existing data readable by new code (no data model changes)
- [x] Existing tests pass after modification (with flag disabled by default)
- [x] No forced migration for existing users (opt-in only)
- [x] Deprecation warnings not needed (new feature, not removing anything)

## Updated User Scenarios

_Include support scenarios only active when feature flag is enabled_

### Modified Scenario: Hide/Show correct menu actions (User Story 1)

**Original**: Include actions shown when file is excluded
**Modified**: **Given** feature flag `ignorer.features.includeSupport` is `false`, **When** user opens context menu on excluded file, **Then** include actions are NOT shown (only ignore state is used to hide ignore actions)
**Why Changed**: Include support gated behind feature flag for controlled rollout

### Modified Scenario: Show ignore actions when not excluded (User Story 2)

**Original**: Include actions hidden when file is not excluded
**Modified**: Behavior unchanged when flag is disabled (include actions never shown). When flag is enabled, original behavior applies.
**Why Changed**: Feature flag controls entire include command visibility

### Modified Scenario: Update config-based include/exclude (User Story 3)

**Original**: Config updates work for TypeScript, Prettier, ESLint
**Modified**: **Given** feature flag is `false`, **When** user attempts include action, **Then** commands are not available in menu. **Given** feature flag is `true`, **When** user performs include action, **Then** config updates proceed as originally specified.
**Why Changed**: Config-based include updates require feature flag enabled

### New Scenario: Enable Include Support

**Given** user wants to use include/unignore functionality, **When** user sets `ignorer.features.includeSupport` to `true` in VS Code settings, **Then** include commands appear in context menus for excluded files and config-based updates become available.
**Why Added**: Document how users opt-in to include support

## Updated Requirements

### New Requirements

- **FR-NEW-001**: The system MUST provide a configuration setting `ignorer.features.includeSupport` (boolean, default `false`) that controls whether include/unignore commands are available
- **FR-NEW-002**: The system MUST NOT register or show include/unignore commands when `ignorer.features.includeSupport` is `false`
- **FR-NEW-003**: The system MUST read the feature flag value from VS Code configuration at activation time and respect changes when configuration is updated
- **FR-NEW-004**: The system MUST document the feature flag in README with clear instructions on how to enable include support
- **FR-NEW-005**: The system SHOULD reload command registration when feature flag configuration changes (if feasible without full reload)

### Modified Requirements

- **Original FR-002**: System MUST update command visibility when selection is excluded (show include, hide ignore)
  - **Modified to**: System MUST update command visibility when selection is excluded AND `ignorer.features.includeSupport` is `true`
  - **Justification**: Include command visibility now conditional on feature flag

## Constitution Compliance

- [x] **Specification-First**: Modification spec complete before coding
- [x] **Minimal Complexity**: Adds only necessary flag check; no over-engineering
- [x] **TDD**: Tests updated to cover flag enabled/disabled scenarios
- [x] **Progressive Enhancement**: Builds on stable ignore foundation; include is opt-in enhancement
- [x] **Clear Boundaries**: Feature flag check isolated in configuration/activation layer

**Violations and Justifications**: None

## Testing Strategy

### Existing Tests

- [x] Run full original feature test suite with flag disabled (default) - include tests should be skipped or adapted
- [x] Run full original feature test suite with flag enabled - all include tests should pass
- [x] Document which tests need flag setup in beforeEach/beforeAll
- [x] Ensure all tests pass in both flag states before claiming complete

### New Tests

- [ ] Configuration reading: Verify flag value read correctly from settings
- [ ] Command registration: Verify include commands not registered when flag false
- [ ] Context key evaluation: Verify include context keys evaluate false when flag disabled
- [ ] Menu visibility: Verify include menu items hidden when flag false
- [ ] State resolution performance: Verify include state computation skipped when flag false (optimization)
- [ ] Configuration change: Verify behavior updates when flag toggled (if live reload supported)

## Rollout Strategy

**Phased Rollout**: [x] Yes

**Phases**:

1. **Phase 1 (Alpha)**: Release with flag default `false`; documentation for early adopters
2. **Phase 2 (Beta)**: Monitor feedback; fix issues; gather telemetry on usage if available
3. **Phase 3 (GA)**: After stable beta period, flip default to `true` in future minor version

**Feature Flags**: [x] Yes

- `ignorer.features.includeSupport`: Controls all include/unignore functionality

**Monitoring**:

- User-reported issues related to include functionality
- Configuration adoption rate (if telemetry available)
- Test suite pass rate with flag enabled vs disabled

**Rollback Plan**:
If critical issues arise:

1. Document workaround: Instruct users to set flag to `false`
2. If necessary, publish patch release changing default back to `false`
3. Fix root cause in separate release, re-enable in subsequent version

---

## Verification Checklist

- [x] Impact analysis reviewed and accurate
- [x] Backward compatibility assessed (no breaking changes)
- [x] Migration path documented (opt-in via config)
- [x] All modified scenarios documented
- [x] Tests strategy defined (cover both flag states)
- [x] Rollout plan complete (phased with flag default false)
- [x] Original spec cross-referenced
- [x] Constitution compliance verified

---

_Modification spec created using `/speckit.modify` workflow - See .specify/extensions/workflows/modify/_
