# Feature Specification: Ignore visibility and config updates

**Feature Branch**: `001-ignore-visibility-config`
**Created**: 2025-11-04
**Status**: Draft
**Input**: User description: "Add following features:  1. Detect if selection is already ignored and a. hide relevant ignore commands and b. show relevant include commands 2. Support updating config files when inclusion/exclusions are not done through ignore files (e.g. tsconfig.json, pretter.config.ts, etc...)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hide/Show correct menu actions (Priority: P1)

When a user selects a file or folder in the editor or explorer, the extension should determine whether it is currently excluded by any active ignore source and update the context menu accordingly, hiding "Ignore" actions and showing "Include" actions when already excluded.

**Why this priority**: Correct action visibility prevents user errors and reduces confusion; it is core to day-to-day workflow.

**Independent Test**: Prepare a workspace where a known file is excluded by an ignore source; right‑clicking the file should not show "Ignore" actions and should show "Include" actions.

**Acceptance Scenarios**:

1. Given a file matched by an active ignore rule, When the user opens the context menu, Then "Ignore" actions are hidden and "Include" actions are visible.
2. Given a folder matched by an active ignore rule, When the user opens the context menu anywhere within that folder, Then "Ignore" actions are hidden and "Include" actions are visible.

---

### User Story 2 - Show ignore actions when not excluded (Priority: P2)

When a user selects a file or folder that is not excluded by any active ignore source, the extension should show the relevant "Ignore" actions and hide any "Include"/"Unignore" actions.

**Why this priority**: Completes the core command visibility logic for the primary workflow.

**Independent Test**: In a workspace with no exclusion rules for a test file, right‑clicking should show "Ignore" actions and not show "Include" actions.

**Acceptance Scenarios**:

1. Given a file not matched by any ignore source, When the user opens the context menu, Then "Ignore" actions are visible and "Include" actions are hidden.

---

### User Story 3 - Update config-based include/exclude (Priority: P3)

For ecosystems where inclusion/exclusion is configured in project configuration files rather than dedicated ignore files, users can choose to include/exclude selections and the extension updates the relevant configuration entries accordingly.

**Why this priority**: Ensures the feature works across common project types where rules live in config files (e.g., TypeScript project includes/excludes).

**Independent Test**: In a TypeScript project, exclude a folder; the extension updates the project configuration so the folder is excluded from compilation. Reversing the action removes the exclusion.

**Acceptance Scenarios**:

1. Given a project that uses config-based excludes, When a user selects "Exclude" for a folder, Then the relevant configuration shows the folder excluded and the change takes effect on the next tool run.
2. Given an item previously excluded via configuration, When a user selects "Include", Then the corresponding exclude entry is removed and the item is processed normally thereafter.

### Edge Cases

- Selection is matched by multiple sources (e.g., both a global ignore and a project config). Precedence is: config-based excludes > project ignore files > workspace settings, and the UI communicates which source applies.
- Selection is a nested path where a parent is excluded but the child has an include/negation rule; the UI should reflect the effective state for the selection, not just the parent.
- Config file exists but is malformed; the user should receive a clear, actionable message and no changes should be applied.
- Multi-selection with mixed states; the menu should handle mixed states (e.g., enable actions that apply to all or indicate mixed selection).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST determine whether a selected file/folder is currently excluded by any active ignore source (e.g., ignore files or supported config-based rules) and compute the effective state for that selection.
- **FR-002**: The system MUST update command visibility so that when a selection is excluded, "Ignore" commands are hidden and "Include" commands are shown; when not excluded, "Ignore" commands are shown and "Include" commands are hidden.
- **FR-003**: The system MUST support config-based exclusion/inclusion updates for common project types where rules are not stored in dedicated ignore files (e.g., project configuration files that control includes/excludes).
- **FR-004**: The system MUST ensure that updates are non-destructive and preserve unrelated settings and formatting in configuration files.
- **FR-005**: The system MUST provide clear user feedback on what source determined the selection's state (e.g., tooltip or message indicating which rule/file applies) without requiring users to open configuration files.
- **FR-006**: The system MUST handle multi-selection cases, applying actions to all selected items where applicable and indicating if some items cannot be updated due to conflicts.
- **FR-007**: The system MUST fail safely when configuration files are unreadable or invalid (no partial writes) and surface a user-friendly error explaining next steps.
- **FR-008**: The system SHOULD support undo for the last include/exclude change via standard editor history or an explicit "Revert" action, where feasible.
- **FR-009**: The system MUST respect workspace trust/security model—never modifies files outside the workspace and only updates files under version control when the user initiates an action.
- **FR-010**: The system MUST document that v1 supports config-based updates for: TypeScript (tsconfig include/exclude), Prettier (relevant include/exclude or ignore settings), and ESLint (ignore patterns/overrides), and how the chosen precedence is determined.
 - **FR-011**: The system MUST NOT auto-create missing configuration files; if a target config is absent, the action is not offered and the user is informed.

### Key Entities *(include if feature involves data)*

- **Selection**: The file or folder path(s) chosen by the user; used to compute effective inclusion/exclusion and to scope updates.
- **Ignore Source**: Any rule set that can exclude or include paths (e.g., ignore files, workspace settings, or supported config files). Attributes: source type, location, effective rules.
- **Config Target**: A project configuration file that controls include/exclude behavior for a toolchain. Attributes: location, supported sections/keys, precedence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Command visibility reflects the effective state with ≥ 99% accuracy across supported sources in a representative test suite.
- **SC-002**: Users can perform an include or exclude action for a single item in ≤ 10 seconds from selection to confirmation, on average.
- **SC-003**: For supported config targets, updates apply correctly and are observed by the relevant tool on the next run ≥ 95% of the time in tests.
- **SC-004**: Error scenarios (malformed config, conflicting rules, permission issues) result in a clear, actionable message in 100% of observed cases, with no partial writes.
- **SC-005**: In multi-selection with mixed states, the system communicates scope/results clearly and completes updates for applicable items ≥ 95% of the time.

### Assumptions

- Where tools support both ignore files and config-based excludes, precedence for visibility is: config-based excludes > project ignore files > workspace settings (explicit includes/negations still apply within their source).
- Initial supported config targets for v1 are: TypeScript (tsconfig include/exclude), Prettier, and ESLint. Additional targets may be added later based on user demand.
